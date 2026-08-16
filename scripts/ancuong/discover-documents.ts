import { createHash } from "node:crypto";
import { join } from "node:path";
import type { SupplierDocumentRecord } from "../../lib/catalog/full-import/types";
import { mapConcurrent } from "./concurrency";
import { paths } from "./config";
import { createHttpClient } from "./http-client";
import { atomicWriteJson } from "./stable-json";
import type { CliOptions } from "./types";

export type DiscoveredCatalogueDocument = {
  sourceUrl: string;
  sourceParent: string;
  title: string;
  checksum?: string;
};

type DocumentDependencies = {
  indexUrls?: string[];
  colorMapUrl?: string;
  outputPath?: string;
  fetchText?: (url: string) => Promise<{ body: string; status: number; contentHash: string }>;
};

function decodeHtml(value: string): string {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function text(value: string): string {
  return decodeHtml(value.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

function slug(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("vi")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function parseCatalogueDocumentLinks(html: string, sourceParent: string): DiscoveredCatalogueDocument[] {
  const records = new Map<string, DiscoveredCatalogueDocument>();
  for (const match of html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    const sourceUrl = new URL(decodeHtml(match[1]), sourceParent).toString();
    const host = new URL(sourceUrl).hostname;
    if (!new Set(["catalogue.ancuong.com", "view.publitas.com"]).has(host)) continue;
    const title = text(match[2]) || new URL(sourceUrl).pathname.split("/").filter(Boolean).at(-1)?.replace(/-/g, " ") || "An Cuong catalogue";
    records.set(sourceUrl, { sourceUrl, sourceParent, title });
  }
  return [...records.values()].sort((left, right) => left.sourceUrl.localeCompare(right.sourceUrl));
}

export function buildCatalogueDocumentRecords(links: DiscoveredCatalogueDocument[]): SupplierDocumentRecord[] {
  return links.map((link) => {
    const sourceUrls = [link.sourceParent, link.sourceUrl].sort();
    return {
      recordType: "document",
      supplier: "an-cuong",
      name: link.title,
      slug: `an-cuong-${slug(link.title)}`,
      category: "Catalogue",
      documentType: "catalogue",
      needsEditorialReview: false,
      images: [],
      documents: [{ sourceUrl: link.sourceUrl, title: link.title, mimeType: "text/html", ...(link.checksum ? { checksum: link.checksum } : {}) }],
      sourceUrls,
      sourceChecksum: createHash("sha256").update(JSON.stringify({ title: link.title, sourceUrls })).digest("hex"),
      editorialStatus: "SOURCE_ONLY",
      seoStatus: "SOURCE_ONLY",
    } satisfies SupplierDocumentRecord;
  }).sort((left, right) => left.name.localeCompare(right.name));
}

export async function run(options: CliOptions, dependencies: DocumentDependencies = {}): Promise<SupplierDocumentRecord[]> {
  const indexUrls = dependencies.indexUrls ?? [
    "https://ancuong.com/catalogue/catalogue-material.html",
    "https://ancuong.com/catalogue/accessories-others.html",
  ];
  const colorMapUrl = dependencies.colorMapUrl ?? "https://ancuong.com/color-map.html";
  const outputPath = dependencies.outputPath ?? join(paths.normalized, "documents.json");
  const client = dependencies.fetchText ? undefined : createHttpClient();
  const fetchText = dependencies.fetchText ?? ((url: string) => client!.fetchText(url));
  const links: DiscoveredCatalogueDocument[] = [];
  for (const indexUrl of indexUrls) {
    const response = await fetchText(indexUrl);
    links.push(...parseCatalogueDocumentLinks(response.body, indexUrl));
  }
  const uniqueLinks = [...new Map(links.map((link) => [link.sourceUrl, link])).values()].sort((left, right) => left.sourceUrl.localeCompare(right.sourceUrl));
  const verifiedLinks = await mapConcurrent(uniqueLinks, options.concurrency, async (link) => {
    const response = await fetchText(link.sourceUrl);
    return { ...link, checksum: response.contentHash };
  });
  const colorMap = await fetchText(colorMapUrl);
  const records = [
    ...buildCatalogueDocumentRecords(verifiedLinks),
    {
      recordType: "document" as const,
      supplier: "an-cuong" as const,
      name: "An Cuong Color Map",
      slug: "an-cuong-color-map",
      category: "Color Map",
      documentType: "color-map" as const,
      needsEditorialReview: true,
      images: [],
      documents: [],
      sourceUrls: [colorMapUrl],
      sourceChecksum: colorMap.contentHash,
      editorialStatus: "SOURCE_ONLY" as const,
      seoStatus: "SOURCE_ONLY" as const,
    },
  ].sort((left, right) => left.name.localeCompare(right.name));
  if (!options.dryRun) await atomicWriteJson(outputPath, records);
  return records;
}
