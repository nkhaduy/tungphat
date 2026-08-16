import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { buildCoverageSummary, checksumFullSourceManifest, validateFullSourceManifest } from "@/lib/catalog/full-import/manifest";
import type { CatalogueRecord, DiscoveredSourceUrl, FullSourceManifest } from "@/lib/catalog/full-import/types";
import type { SupplierColorCode } from "@/lib/catalog/types";
import {
  buildBaThanhCatalogueRecords,
  buildBaThanhFullSourceManifest,
  checksumBaThanhRecords,
  recordId,
  type BaThanhFullSourceItem,
} from "./full-import";

type FullDiscovery = {
  schemaVersion: 1;
  supplier: "ba-thanh";
  discoveredAt: string;
  discovered: DiscoveredSourceUrl[];
  melamineBaselineCodes?: string[];
  melamineCounts: Record<string, number>;
  laminateCounts: Record<string, number>;
  melamineCrawl?: { total: number; successful: number; discoveredOutsideMap?: number; rejected: number; failed: number };
  laminateCrawl?: { total: number; successful: number; rejected: number; failed: number };
};

type FullRecordFile = {
  schemaVersion: 1;
  supplier: "ba-thanh";
  generatedAt: string;
  records: CatalogueRecord[];
  checksum: string;
};

function readJson<T>(file: string): T {
  return JSON.parse(fs.readFileSync(file, "utf8")) as T;
}

function writeJson(file: string, value: unknown) {
  const temporary = `${file}.tmp`;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`);
  fs.renameSync(temporary, file);
}

function recordChecksum(record: CatalogueRecord): string {
  return checksumBaThanhRecords([record]);
}

function importDelta(previous: FullRecordFile | undefined, records: CatalogueRecord[]) {
  const oldRecords = new Map((previous?.records ?? []).map((record) => [recordId(record), recordChecksum(record)]));
  const incoming = new Map(records.map((record) => [recordId(record), recordChecksum(record)]));
  let created = 0;
  let updated = 0;
  let unchanged = 0;
  for (const [id, checksum] of incoming) {
    const oldChecksum = oldRecords.get(id);
    if (!oldChecksum) created += 1;
    else if (oldChecksum === checksum) unchanged += 1;
    else updated += 1;
  }
  return {
    created,
    updated,
    unchanged,
    removed: [...oldRecords.keys()].filter((id) => !incoming.has(id)).length,
    duplicates: records.length - incoming.size,
  };
}

function preserveImportedAt(previous: FullRecordFile | undefined, records: CatalogueRecord[]) {
  const previousById = new Map((previous?.records ?? []).map((record) => [recordId(record), record]));
  return records.map((record) => {
    if (record.recordType !== "sku") return record;
    const existing = previousById.get(recordId(record));
    if (existing?.recordType !== "sku" || existing.sourceChecksum !== record.sourceChecksum) return record;
    return { ...record, importedAt: existing.importedAt };
  });
}

function groupCounts(records: CatalogueRecord[]) {
  return Object.fromEntries([...new Set(records
    .filter((record) => record.recordType === "sku")
    .map((record) => String(record.attributes.sourceGroup)))]
    .sort()
    .map((group) => [group, records.filter((record) =>
      record.recordType === "sku" && String(record.attributes.sourceGroup) === group).length]));
}

function discoveredWithRecordAssets(base: DiscoveredSourceUrl[], records: CatalogueRecord[]): DiscoveredSourceUrl[] {
  const byUrl = new Map(base.map((item) => [new URL(item.url).toString(), item]));
  for (const record of records) {
    const sourceParent = record.sourceUrls[0];
    const pageType = record.recordType === "sku" ? "product" : record.recordType === "family" ? "product-family" : "catalogue";
    for (const image of record.images) {
      const url = new URL(image.sourceUrl).toString();
      if (!byUrl.has(url)) byUrl.set(url, {
        supplier: "ba-thanh",
        url,
        discoveredFrom: "html-link",
        sourceParent,
        locale: "unknown",
        pageType,
      });
    }
    for (const document of record.documents) {
      const url = new URL(document.sourceUrl).toString();
      if (!byUrl.has(url)) byUrl.set(url, {
        supplier: "ba-thanh",
        url,
        discoveredFrom: "catalogue-document",
        sourceParent,
        locale: "unknown",
        pageType: "catalogue",
      });
    }
  }
  return [...byUrl.values()];
}

function validateArtifacts(options: {
  discovery: FullDiscovery;
  melamineSources: BaThanhFullSourceItem[];
  laminate: BaThanhFullSourceItem[];
  recordFile: FullRecordFile;
  manifest: FullSourceManifest;
  root: string;
}): string[] {
  const errors: string[] = [];
  const records = options.recordFile.records;
  const skuRecords = records.filter((record) => record.recordType === "sku");
  const melamine = skuRecords.filter((record) => record.productFamily === "Melamine");
  const laminate = skuRecords.filter((record) => record.productFamily === "WAY Laminate");
  const families = records.filter((record) => record.recordType === "family");
  const documents = records.filter((record) => record.recordType === "document");
  const expectedMelamineCodes = new Set([
    ...(options.discovery.melamineBaselineCodes ?? []),
    ...options.melamineSources.filter((item) => item.status === "PARSED").map((item) => item.codeNormalized),
  ]);
  const expectedLaminateCodes = new Set(options.laminate.filter((item) => item.status === "PARSED").map((item) => item.codeNormalized));
  if (melamine.length !== expectedMelamineCodes.size) errors.push(`Expected ${expectedMelamineCodes.size} discovered Melamine SKUs, found ${melamine.length}`);
  if (laminate.length !== expectedLaminateCodes.size) errors.push(`Expected ${expectedLaminateCodes.size} discovered WAY Laminate SKUs, found ${laminate.length}`);
  const importedMelamineCodes = new Set(melamine.map((record) => record.normalizedCode));
  const missingBaseline = (options.discovery.melamineBaselineCodes ?? []).filter((code) => !importedMelamineCodes.has(code));
  if (missingBaseline.length) errors.push(`${missingBaseline.length} baseline Melamine code(s) are missing from the import`);
  if (families.length !== 11) errors.push(`Expected 11 family records, found ${families.length}`);
  if (documents.length !== 2) errors.push(`Expected 2 document records, found ${documents.length}`);
  if (families.some((record) => "code" in record)) errors.push("Family records contain invented codes");
  if (skuRecords.some((record) => /MDF(?:3|5|9|12|15|17|25)MM/.test(record.normalizedCode))) errors.push("Thickness-derived fake SKU detected");
  if (new Set(skuRecords.map((record) => record.normalizedCode)).size !== skuRecords.length) errors.push("Duplicate SKU code within Ba Thanh");
  if (options.melamineSources.some((item) => item.status !== "PARSED")) errors.push("Melamine crawl is not fully verified");
  if (options.laminate.some((item) => item.status !== "PARSED")) errors.push("Laminate crawl is not fully verified");
  if (documents.find((record) => record.slug === "catalogue-melamine-ba-thanh-2025")?.images.length !== 24) errors.push("Melamine catalogue page count is not 24");
  if (documents.find((record) => record.slug === "catalogue-van-san-dongwha")?.images.length !== 14) errors.push("Dongwha catalogue page count is not 14");
  if (JSON.stringify(records).match(/3970[.\s-]*1399|0986[.\s-]*94[.\s-]*95[.\s-]*86|group@bathanh/i)) errors.push("Supplier contact details leaked into normalized records");
  for (const record of records) {
    if (!record.sourceUrls.length || record.sourceUrls.some((url) => !url.startsWith("https://"))) errors.push(`${recordId(record)}: invalid source URL`);
    for (const image of record.images) {
      if (image.rightsStatus !== "UNCONFIRMED") errors.push(`${recordId(record)}: media rights status changed`);
      if (image.localPath && !image.localPath.startsWith("/catalog/ba-thanh/")) errors.push(`${recordId(record)}: invalid local media path`);
      else if (image.localPath && !fs.existsSync(path.join(options.root, "public", image.localPath.replace(/^\//, "")))) errors.push(`${recordId(record)}: local media missing ${image.localPath}`);
      else if (!image.localPath && record.seoStatus === "READY_TO_INDEX") errors.push(`${recordId(record)}: indexable record has source-only media`);
    }
  }
  errors.push(...validateFullSourceManifest(options.manifest).map((issue) => `${issue.code}: ${issue.url ?? issue.message}`));
  const coverage = buildCoverageSummary(options.manifest);
  if (coverage.coveragePercentage !== 100 || coverage.unaccounted !== 0) errors.push(`Full source coverage is ${coverage.coveragePercentage}%`);
  if (options.manifest.checksum !== checksumFullSourceManifest(options.manifest)) errors.push("Manifest checksum is unstable");
  if (options.recordFile.checksum !== checksumBaThanhRecords(records)) errors.push("Record checksum is unstable");
  return errors;
}

export async function runBaThanhFullImport(options: {
  root?: string;
  dryRun?: boolean;
  validateOnly?: boolean;
} = {}) {
  const root = options.root ?? process.cwd();
  const importDir = path.join(root, "data/imports/ba-thanh");
  const recordFilePath = path.join(importDir, "full-records.json");
  const manifestPath = path.join(importDir, "full-source-manifest.json");
  const reportPath = path.join(importDir, "full-import-report.json");
  const discovery = readJson<FullDiscovery>(path.join(importDir, "full-discovery.json"));
  const melamineSources = readJson<BaThanhFullSourceItem[]>(path.join(importDir, "discovered-codes.json"));
  const laminate = readJson<BaThanhFullSourceItem[]>(path.join(importDir, "discovered-laminate-codes.json"));
  const melamine = readJson<SupplierColorCode[]>(path.join(root, "data/catalogs/ba-thanh.json"));

  if (options.validateOnly) {
    const recordFile = readJson<FullRecordFile>(recordFilePath);
    const manifest = readJson<FullSourceManifest>(manifestPath);
    const errors = validateArtifacts({ discovery, melamineSources, laminate, recordFile, manifest, root });
    if (errors.length) throw new Error(errors.join("\n"));
    const coverage = buildCoverageSummary(manifest);
    console.log(JSON.stringify({ command: "validate:full", records: recordFile.records.length, coverage: coverage.coveragePercentage, pass: true }, null, 2));
    return null;
  }

  let previous: FullRecordFile | undefined;
  try {
    previous = readJson<FullRecordFile>(recordFilePath);
  } catch {
    previous = undefined;
  }
  const records = preserveImportedAt(previous, buildBaThanhCatalogueRecords({
    melamine,
    melamineSources,
    laminate,
    importedAt: discovery.discoveredAt,
  }));
  const recordChecksum = checksumBaThanhRecords(records);
  const recordFile: FullRecordFile = {
    schemaVersion: 1,
    supplier: "ba-thanh",
    generatedAt: previous?.checksum === recordChecksum ? previous.generatedAt : discovery.discoveredAt,
    records,
    checksum: recordChecksum,
  };
  const discovered = discoveredWithRecordAssets(discovery.discovered, records);
  const manifest = buildBaThanhFullSourceManifest({ records, discovered, generatedAt: discovery.discoveredAt });
  const errors = validateArtifacts({ discovery, melamineSources, laminate, recordFile, manifest, root });
  if (errors.length) throw new Error(errors.join("\n"));
  const delta = importDelta(previous, records);
  const coverage = buildCoverageSummary(manifest);
  const mediaReferences = records.flatMap((record) => record.images);
  const uniqueMediaSourceUrls = new Set(mediaReferences.map((image) => image.sourceUrl));
  const report = {
    schemaVersion: 1,
    generatedAt: discovery.discoveredAt,
    dryRun: Boolean(options.dryRun),
    previousRecords: previous?.records.length ?? 0,
    melamineSkus: records.filter((record) => record.recordType === "sku" && record.productFamily === "Melamine").length,
    melamineGroups: groupCounts(records.filter((record) => record.recordType === "sku" && record.productFamily === "Melamine")),
    laminateSkus: records.filter((record) => record.recordType === "sku" && record.productFamily === "WAY Laminate").length,
    laminateGroups: groupCounts(records.filter((record) => record.recordType === "sku" && record.productFamily === "WAY Laminate")),
    familyRecords: records.filter((record) => record.recordType === "family").length,
    documentRecords: records.filter((record) => record.recordType === "document").length,
    totalImported: records.length,
    mediaReferences: mediaReferences.length,
    uniqueMediaSourceUrls: uniqueMediaSourceUrls.size,
    localMediaReferences: mediaReferences.filter((image) => image.localPath).length,
    sourceOnlyMediaReferences: mediaReferences.filter((image) => !image.localPath).length,
    originalMediaDownload: "DEFERRED_CAPACITY_REVIEW",
    mediaRightsStatus: "UNCONFIRMED",
    ...delta,
    coveragePercentage: coverage.coveragePercentage,
    accountedSourceUrls: coverage.accounted,
    totalSourceUrls: coverage.totalDiscovered,
    manifestChecksum: manifest.checksum,
    recordChecksum: recordFile.checksum,
  };
  if (!options.dryRun) {
    writeJson(recordFilePath, recordFile);
    writeJson(manifestPath, manifest);
    writeJson(reportPath, report);
  }
  console.log(JSON.stringify(report, null, 2));
  return { recordFile, manifest, report };
}

async function main() {
  await runBaThanhFullImport({
    dryRun: process.argv.includes("--dry-run"),
    validateOnly: process.argv.includes("--validate-only"),
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
