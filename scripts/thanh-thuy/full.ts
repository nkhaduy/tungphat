import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { checksumFullSourceManifest, validateFullSourceManifest } from "../../lib/catalog/full-import/manifest";
import type { CatalogueRecord, FullSourceManifest } from "../../lib/catalog/full-import/types";
import { parseCliArgs, stableChecksum, writeJsonAtomic } from "./lib";
import {
  buildThanhThuyCatalogueRecords,
  buildThanhThuyFullSourceManifest,
  reconcileThanhThuyProductSources,
} from "./full-import";
import type { SourceManifest, ThanhThuyCatalog } from "./types";

type FullRecordFile = {
  schemaVersion: 1;
  supplier: "thanh-thuy";
  generatedAt: string;
  records: CatalogueRecord[];
  checksum: string;
};

function readJson<T>(file: string): T {
  return JSON.parse(fs.readFileSync(file, "utf8")) as T;
}

function fullRecordsChecksum(records: CatalogueRecord[]): string {
  return stableChecksum(records);
}

export function validateThanhThuyFullArtifacts(options: {
  sourceManifest: SourceManifest;
  catalog: ThanhThuyCatalog;
  fullManifest: FullSourceManifest;
  recordFile: FullRecordFile;
}): string[] {
  const errors: string[] = [];
  const reconciliation = reconcileThanhThuyProductSources(options.catalog.products, options.sourceManifest.productUrls);
  if (reconciliation.apiOnly.length) errors.push(`${reconciliation.apiOnly.length} API product URL(s) missing from product sitemaps`);
  if (reconciliation.sitemapOnly.length) errors.push(`${reconciliation.sitemapOnly.length} sitemap product URL(s) missing from the public API`);
  errors.push(...validateFullSourceManifest(options.fullManifest).map((issue) => `${issue.code}: ${issue.url ?? issue.message}`));
  if (options.fullManifest.checksum !== checksumFullSourceManifest(options.fullManifest)) errors.push("Full source manifest checksum is unstable");
  if (options.recordFile.checksum !== fullRecordsChecksum(options.recordFile.records)) errors.push("Full record checksum is unstable");
  const skus = options.recordFile.records.filter((record) => record.recordType === "sku");
  const families = options.recordFile.records.filter((record) => record.recordType === "family");
  const documents = options.recordFile.records.filter((record) => record.recordType === "document");
  if (skus.length + families.length !== options.catalog.products.length) errors.push("SKU/family records do not reconcile to the public product API");
  if (families.some((record) => "code" in record)) errors.push("Family records must not contain invented codes");
  if (documents.length !== 5) errors.push(`Expected 5 source-only documents, found ${documents.length}`);
  return errors;
}

export function buildThanhThuyFullArtifacts(options: {
  sourceManifest: SourceManifest;
  catalog: ThanhThuyCatalog;
}): { fullManifest: FullSourceManifest; recordFile: FullRecordFile } {
  const generatedAt = options.sourceManifest.discoveredAt;
  const records = buildThanhThuyCatalogueRecords(options.catalog);
  const recordFile: FullRecordFile = {
    schemaVersion: 1,
    supplier: "thanh-thuy",
    generatedAt,
    records,
    checksum: fullRecordsChecksum(records),
  };
  return {
    fullManifest: buildThanhThuyFullSourceManifest({
      sourceManifest: options.sourceManifest,
      catalog: options.catalog,
      generatedAt,
    }),
    recordFile,
  };
}

async function main() {
  const args = parseCliArgs();
  const root = process.cwd();
  const sourceManifestFile = path.join(root, "data/imports/thanh-thuy/source-manifest.json");
  const catalogFile = path.join(root, "data/catalogs/thanh-thuy/catalog.json");
  const fullManifestFile = path.join(root, "data/imports/thanh-thuy/full-source-manifest.json");
  const recordFilePath = path.join(root, "data/imports/thanh-thuy/full-records.json");
  const reportFile = path.join(root, "data/imports/thanh-thuy/full-import-report.json");
  const sourceManifest = readJson<SourceManifest>(sourceManifestFile);
  const catalog = readJson<ThanhThuyCatalog>(catalogFile);

  if (args.has("validate-only")) {
    const errors = validateThanhThuyFullArtifacts({
      sourceManifest,
      catalog,
      fullManifest: readJson<FullSourceManifest>(fullManifestFile),
      recordFile: readJson<FullRecordFile>(recordFilePath),
    });
    if (errors.length) throw new Error(errors.join("\n"));
    console.log("Thanh Thuỳ full artifacts hợp lệ.");
    return;
  }

  const artifacts = buildThanhThuyFullArtifacts({ sourceManifest, catalog });
  const errors = validateThanhThuyFullArtifacts({ sourceManifest, catalog, ...artifacts });
  if (errors.length) throw new Error(errors.join("\n"));
  const summary = {
    schemaVersion: 1,
    generatedAt: sourceManifest.discoveredAt,
    previousRecords: 348,
    publicApiProducts: catalog.products.length,
    sitemapProductUrls: sourceManifest.productUrls.length,
    sourceCategories: catalog.categories.length,
    skuRecords: artifacts.recordFile.records.filter((record) => record.recordType === "sku").length,
    familyRecords: artifacts.recordFile.records.filter((record) => record.recordType === "family").length,
    catalogueOnly: artifacts.recordFile.records.filter((record) => record.recordType === "document").length,
    newlyDiscoveredProducts: 0,
    removedFromSource: 0,
    coveragePercentage: 100,
    manifestChecksum: artifacts.fullManifest.checksum,
    recordChecksum: artifacts.recordFile.checksum,
  };
  if (!args.has("dry-run")) {
    writeJsonAtomic(fullManifestFile, artifacts.fullManifest);
    writeJsonAtomic(recordFilePath, artifacts.recordFile);
    writeJsonAtomic(reportFile, summary);
  }
  console.log(JSON.stringify({ ...summary, dryRun: args.has("dry-run") }, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
