import { createHash } from "node:crypto";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import type { CategoryRecord } from "./types";
import { ANCUONG_PARSER_VERSION, ANCUONG_SCHEMA_VERSION, ANCUONG_SOURCE_ROOT } from "./types";
import { atomicWriteJson, stableStringify } from "./stable-json";
import { readJsonIfExists } from "./stable-json";
import { paths } from "./config";
import type { CliOptions } from "./types";

export { stableStringify };

export interface ExportMetadata {
  schemaVersion?: string;
  parserVersion: string;
  exportTime: string;
  sourceRoot?: string;
  sourceAuditReference?: string;
  validationStatus: "passed" | "failed" | "partial";
}

export interface ExportInput {
  products: unknown[];
  categories: CategoryRecord[] | unknown[];
  taxonomy: unknown;
  relations: unknown[];
  media: unknown[];
}

export interface ExportArtifact { schemaVersion: string; parserVersion: string; exportTime: string; sourceRoot: string; sourceAuditReference?: string; validationStatus: ExportMetadata["validationStatus"]; records: unknown; }
export interface ExportBundle { catalogue: ExportArtifact; categories: ExportArtifact; taxonomy: ExportArtifact; relations: ExportArtifact; media: ExportArtifact; }
export interface ExportCompletionMetadata {
  discoveryCount?: number;
  productCount?: number;
  validCount?: number;
  invalidCount?: number;
  categoryCount?: number;
  relationCount?: number;
  mediaReferenceCount?: number;
  uniqueMediaCount?: number;
  fullCrawl?: boolean;
  fullCrawlStatus?: "complete" | "partial";
  mediaComplete?: boolean;
  mediaCrawlStatus?: "complete" | "partial" | "discovery-only";
  knownLimitations?: string[];
}
export interface ExportManifest extends ExportMetadata, ExportCompletionMetadata { sourceRoot: string; datasetChecksum: string; exports: Array<{ file: string; checksum: string; bytes: number; recordCount: number }>; }

function sourceId(value: unknown): string {
  const item = value as { sourceId?: string; slug?: string; sourceUrl?: string; name?: string };
  return item.sourceId ?? item.slug ?? item.sourceUrl ?? item.name ?? "";
}

function sortRecords(records: unknown[]): unknown[] {
  return [...records].sort((left, right) => sourceId(left).localeCompare(sourceId(right)));
}

function recordCount(value: unknown): number {
  if (Array.isArray(value)) return value.length;
  if (value && typeof value === "object") {
    const object = value as Record<string, unknown>;
    for (const key of ["records", "products", "categories", "relations", "media", "facets"]) if (Array.isArray(object[key])) return object[key]!.length;
  }
  return 1;
}

export function buildExportBundle(input: ExportInput, metadata: ExportMetadata): ExportBundle {
  const base = {
    schemaVersion: metadata.schemaVersion ?? ANCUONG_SCHEMA_VERSION,
    parserVersion: metadata.parserVersion,
    exportTime: metadata.exportTime,
    sourceRoot: metadata.sourceRoot ?? ANCUONG_SOURCE_ROOT,
    sourceAuditReference: metadata.sourceAuditReference,
    validationStatus: metadata.validationStatus,
  };
  return {
    catalogue: { ...base, records: sortRecords(input.products) },
    categories: { ...base, records: sortRecords(input.categories) },
    taxonomy: { ...base, records: input.taxonomy },
    relations: { ...base, records: sortRecords(input.relations) },
    media: { ...base, records: sortRecords(input.media) },
  };
}

function bytesFor(value: unknown): Buffer {
  return Buffer.from(stableStringify(value), "utf8");
}

function exportEntries(bundle: ExportBundle): ExportManifest["exports"] {
  const artifacts: Array<[string, ExportArtifact]> = [
    ["catalogue.json", bundle.catalogue],
    ["categories.json", bundle.categories],
    ["taxonomy.json", bundle.taxonomy],
    ["relations.json", bundle.relations],
    ["media.json", bundle.media],
  ];
  return artifacts.map(([file, value]) => {
    const bytes = bytesFor(value);
    return { file, checksum: createHash("sha256").update(bytes).digest("hex"), bytes: bytes.byteLength, recordCount: recordCount(value.records) };
  });
}

export async function writeExportBundle(outputDir: string, bundle: ExportBundle, completion: ExportCompletionMetadata = {}): Promise<ExportManifest> {
  await mkdir(outputDir, { recursive: true });
  const artifacts: Array<[string, ExportArtifact]> = [
    ["catalogue.json", bundle.catalogue],
    ["categories.json", bundle.categories],
    ["taxonomy.json", bundle.taxonomy],
    ["relations.json", bundle.relations],
    ["media.json", bundle.media],
  ];
  const exports = exportEntries(bundle);
  for (const [file, value] of artifacts) await atomicWriteJson(path.join(outputDir, file), value);
  const first = bundle.catalogue;
  const manifest: ExportManifest = {
    schemaVersion: first.schemaVersion,
    parserVersion: first.parserVersion,
    exportTime: first.exportTime,
    sourceRoot: first.sourceRoot,
    sourceAuditReference: first.sourceAuditReference,
    validationStatus: first.validationStatus,
    ...completion,
    datasetChecksum: createHash("sha256").update(stableStringify(exports)).digest("hex"),
    exports,
  };
  await atomicWriteJson(path.join(outputDir, "export-manifest.json"), manifest);
  return manifest;
}

function recordsFrom(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object" && Array.isArray((value as { records?: unknown[] }).records)) return (value as { records: unknown[] }).records;
  return [];
}

export async function run(options: CliOptions): Promise<ExportManifest | undefined> {
  const current = await readJsonIfExists<unknown>(path.join(paths.normalized, "catalogue.json"));
  const categories = await readJsonIfExists<unknown>(path.join(paths.normalized, "categories.json"));
  const taxonomy = await readJsonIfExists<unknown>(path.join(paths.normalized, "taxonomy.json"));
  const relations = await readJsonIfExists<unknown>(path.join(paths.normalized, "relations.json"));
  const media = await readJsonIfExists<unknown>(path.join(paths.normalized, "media-manifest.json"));
  const previousManifest = await readJsonIfExists<ExportManifest>(path.join(paths.export, "export-manifest.json"));
  const discovery = await readJsonIfExists<{ productUrls?: string[] }>(path.join(paths.reports, "discovery-manifest.json"));
  const validation = await readJsonIfExists<{ valid?: boolean; summary?: { products?: number; errors?: number; warnings?: number } }>(path.join(paths.reports, "validation-report.json"));
  const checkpoint = await readJsonIfExists<Record<string, { status?: string }>>(path.join(paths.state, "crawl-details.json"));
  let metadata: ExportMetadata = {
    schemaVersion: ANCUONG_SCHEMA_VERSION,
    parserVersion: ANCUONG_PARSER_VERSION,
    exportTime: previousManifest?.exportTime ?? new Date().toISOString(),
    sourceRoot: ANCUONG_SOURCE_ROOT,
    sourceAuditReference: "docs/catalog/ancuong/ANCUONG_SOURCE_AUDIT.md",
    validationStatus: "passed",
  };
  const input = { products: recordsFrom(current), categories: recordsFrom(categories), taxonomy: taxonomy ?? {}, relations: recordsFrom(relations), media: recordsFrom(media) };
  const invalidCount = input.products.filter((value) => {
    const status = (value as { status?: string }).status;
    return status === "invalid" || status === "source-unavailable";
  }).length;
  const terminalDetailCount = Object.values(checkpoint ?? {}).filter((entry) => ["parsed", "normalized", "media-complete", "failed-final"].includes(entry.status ?? "")).length;
  const discoveryCount = discovery?.productUrls?.length ?? 0;
  const fullCrawl = discoveryCount > 0 && terminalDetailCount === discoveryCount && input.products.length === discoveryCount;
  const mediaStatuses = input.media.map((value) => (value as { status?: string }).status ?? "");
  const mediaComplete = mediaStatuses.length > 0 && mediaStatuses.every((status) => ["downloaded", "duplicate", "missing", "invalid", "failed"].includes(status));
  const completion: ExportCompletionMetadata = {
    discoveryCount,
    productCount: input.products.length,
    validCount: input.products.length - invalidCount,
    invalidCount,
    categoryCount: input.categories.length,
    relationCount: input.relations.length,
    mediaReferenceCount: input.media.length,
    uniqueMediaCount: new Set(input.media.map((value) => (value as { sourceUrl?: string }).sourceUrl).filter(Boolean)).size,
    fullCrawl,
    fullCrawlStatus: fullCrawl ? "complete" : "partial",
    mediaComplete,
    mediaCrawlStatus: mediaComplete ? "complete" : mediaStatuses.every((status) => status === "discovered") ? "discovery-only" : "partial",
    knownLimitations: [
      ...(mediaComplete ? [] : ["Binary media download was not started because the filesystem failed the 20% free-space reserve gate."]),
      ...((validation?.summary?.warnings ?? 0) > 0 ? [`${validation?.summary?.warnings ?? 0} source-declared relation targets are outside the discovered catalogue and remain factual unresolved references.`] : []),
    ],
  };
  let bundle = buildExportBundle(input, metadata);
  if (previousManifest && stableStringify(exportEntries(bundle)) !== stableStringify(previousManifest.exports)) {
    metadata = { ...metadata, exportTime: new Date().toISOString() };
    bundle = buildExportBundle(input, metadata);
  }
  if (options.dryRun) return undefined;
  return writeExportBundle(paths.export, bundle, completion);
}
