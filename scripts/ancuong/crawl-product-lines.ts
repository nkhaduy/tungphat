import { createHash } from "node:crypto";
import { join } from "node:path";
import type { SupplierFamilyRecord } from "../../lib/catalog/full-import/types";
import { parseProductLinePage, type ParsedProductLinePage } from "./html";
import { mapConcurrent } from "./concurrency";
import { paths } from "./config";
import { createHttpClient } from "./http-client";
import { atomicWriteJson, readJsonIfExists } from "./stable-json";
import type { CliOptions, DiscoveryManifest, RawProductDetail } from "./types";

export { parseProductLinePage } from "./html";

type CrawlDependencies = {
  discoveryPath?: string;
  outputPath?: string;
  cacheDirectory?: string;
  fetchText?: (url: string) => Promise<{ body: string; status: number; contentHash: string }>;
};

function slug(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("vi")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function unique(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort();
}

export function buildProductLineFamilyRecords(pages: ParsedProductLinePage[]): SupplierFamilyRecord[] {
  const byUrl = new Map(pages.map((page) => [page.sourceUrl, page]));
  const edges = new Map<string, Set<string>>();
  for (const page of pages) {
    const neighbors = edges.get(page.sourceUrl) ?? new Set<string>();
    for (const alternate of [page.alternateViUrl, page.alternateEnUrl]) {
      if (!alternate || !byUrl.has(alternate)) continue;
      neighbors.add(alternate);
      const reverse = edges.get(alternate) ?? new Set<string>();
      reverse.add(page.sourceUrl);
      edges.set(alternate, reverse);
    }
    edges.set(page.sourceUrl, neighbors);
  }
  const groups: ParsedProductLinePage[][] = [];
  const visited = new Set<string>();
  for (const page of pages) {
    if (visited.has(page.sourceUrl)) continue;
    const group: ParsedProductLinePage[] = [];
    const pending = [page.sourceUrl];
    while (pending.length > 0) {
      const sourceUrl = pending.pop()!;
      if (visited.has(sourceUrl)) continue;
      visited.add(sourceUrl);
      const entry = byUrl.get(sourceUrl);
      if (entry) group.push(entry);
      pending.push(...(edges.get(sourceUrl) ?? []));
    }
    groups.push(group);
  }
  const records: SupplierFamilyRecord[] = [];
  for (const group of groups) {
    const sorted = [...group].sort((left, right) => Number(right.locale === "vi") - Number(left.locale === "vi") || left.sourceUrl.localeCompare(right.sourceUrl));
    const primary = sorted[0];
    if (!primary.name) continue;
    const sourceUrls = unique(sorted.map((page) => page.sourceUrl));
    const imageUrls = unique(sorted.flatMap((page) => page.imageUrls));
    const features = unique(sorted.flatMap((page) => page.features));
    const standards = unique(sorted.flatMap((page) => page.standards));
    const dimensionThicknessMatrix = sorted.find((page) => page.dimensionThicknessMatrix.length > 0)?.dimensionThicknessMatrix ?? [];
    const sourceChecksum = createHash("sha256").update(JSON.stringify({
      sourceUrls,
      hashes: sorted.map((page) => page.sourceHash).sort(),
      name: primary.name,
      features,
      standards,
      dimensionThicknessMatrix,
      imageUrls,
    })).digest("hex");
    records.push({
      recordType: "family",
      supplier: "an-cuong",
      name: primary.name,
      slug: `an-cuong-${slug(primary.name)}`,
      category: primary.category,
      specifications: { features, standards, dimensionThicknessMatrix },
      images: imageUrls.map((sourceUrl) => ({ sourceUrl, mediaType: "product", rightsStatus: "UNCONFIRMED" })),
      documents: [],
      sourceUrls,
      sourceChecksum,
      editorialStatus: "NEEDS_EDITORIAL_REVIEW",
      seoStatus: "NEEDS_ENRICHMENT",
    });
  }
  const slugCounts = new Map<string, number>();
  for (const record of records) slugCounts.set(record.slug, (slugCounts.get(record.slug) ?? 0) + 1);
  return records
    .map((record) => {
      if ((slugCounts.get(record.slug) ?? 0) < 2) return record;
      const sourceSuffix = new URL(record.sourceUrls[0]).pathname.split("/").filter(Boolean).at(-1)?.replace(/\.html$/i, "") ?? record.sourceChecksum.slice(0, 8);
      return { ...record, slug: `${record.slug}-${slug(sourceSuffix)}` };
    })
    .sort((left, right) => left.name.localeCompare(right.name) || left.slug.localeCompare(right.slug));
}

export function enrichProductLineFamilyRecords(
  records: SupplierFamilyRecord[],
  details: RawProductDetail[],
): SupplierFamilyRecord[] {
  const linesByUrl = new Map<string, RawProductDetail["productLines"]>();
  for (const detail of details) {
    for (const line of detail.productLines) {
      if (!line.sourceUrl) continue;
      const sourceUrl = new URL(line.sourceUrl).toString();
      const lines = linesByUrl.get(sourceUrl) ?? [];
      lines.push(line);
      linesByUrl.set(sourceUrl, lines);
    }
  }
  return records.map((record) => {
    const lines = record.sourceUrls.flatMap((sourceUrl) => linesByUrl.get(sourceUrl) ?? []);
    const current = record.specifications as {
      features?: string[];
      standards?: string[];
      dimensionThicknessMatrix?: Array<{ dimension: string; thicknesses: string[] }>;
    };
    const matrix = new Map<string, Set<string>>();
    for (const row of [...(current.dimensionThicknessMatrix ?? []), ...lines.flatMap((line) => line.dimensionThicknessMatrix)]) {
      const thicknesses = matrix.get(row.dimension) ?? new Set<string>();
      row.thicknesses.forEach((value) => thicknesses.add(value));
      matrix.set(row.dimension, thicknesses);
    }
    const specifications = {
      features: unique([...(current.features ?? []), ...lines.flatMap((line) => line.features)]),
      standards: unique([...(current.standards ?? []), ...lines.flatMap((line) => line.standards)]),
      dimensionThicknessMatrix: [...matrix.entries()]
        .map(([dimension, thicknesses]) => ({ dimension, thicknesses: [...thicknesses].sort((left, right) => left.localeCompare(right, undefined, { numeric: true })) }))
        .sort((left, right) => left.dimension.localeCompare(right.dimension)),
    };
    return {
      ...record,
      specifications,
      sourceChecksum: createHash("sha256").update(JSON.stringify({ prior: record.sourceChecksum, specifications })).digest("hex"),
    };
  });
}

function cachePath(cacheDirectory: string, sourceUrl: string): string {
  return join(cacheDirectory, `${createHash("sha256").update(sourceUrl).digest("hex")}.json`);
}

export async function run(options: CliOptions, dependencies: CrawlDependencies = {}): Promise<SupplierFamilyRecord[]> {
  const discoveryPath = dependencies.discoveryPath ?? join(paths.reports, "discovery-manifest.json");
  const outputPath = dependencies.outputPath ?? join(paths.normalized, "product-families.json");
  const cacheDirectory = dependencies.cacheDirectory ?? join(paths.root, "cache", "product-lines");
  const manifest = await readJsonIfExists<DiscoveryManifest>(discoveryPath);
  if (!manifest) throw new Error(`Discovery manifest not found: ${discoveryPath}`);
  const urls = [...new Set(manifest.sitemapProductLineUrls ?? [])].sort();
  const client = dependencies.fetchText ? undefined : createHttpClient();
  const fetchText = dependencies.fetchText ?? ((url: string) => client!.fetchText(url));
  const pages = await mapConcurrent(urls, options.concurrency, async (sourceUrl) => {
    const pageCachePath = cachePath(cacheDirectory, sourceUrl);
    if (options.resume && !options.force) {
      const cached = await readJsonIfExists<ParsedProductLinePage>(pageCachePath);
      if (cached?.sourceUrl === sourceUrl) return cached;
    }
    const response = await fetchText(sourceUrl);
    const page = parseProductLinePage(response.body, sourceUrl, response.contentHash);
    if (!options.dryRun) await atomicWriteJson(pageCachePath, page);
    return page;
  });
  const records = buildProductLineFamilyRecords(pages);
  if (!options.dryRun) await atomicWriteJson(outputPath, records);
  return records;
}
