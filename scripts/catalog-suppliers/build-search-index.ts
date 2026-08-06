import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { isAnCuongCuratedCategory } from "../../lib/catalog/an-cuong-categories";
import { classifyMaterialTaxonomy } from "../../lib/catalog/material-taxonomy";
import type { CatalogSearchEntry, SupplierId } from "../../lib/catalog/core/types";

type RecordType = "sku" | "family" | "document";
type SourceRecord = Record<string, unknown> & { recordType?: RecordType };

export type SupplierSearchIndexArtifact = {
  schemaVersion: 1;
  sources: Record<string, { records: number; checksum: string }>;
  totals: Record<SupplierId, {
    total: number;
    sku: number;
    family: number;
    document: number;
    retainedMelamineCodes?: number;
  }>;
  records: Array<CatalogSearchEntry & { id: string; recordType: RecordType }>;
  checksum: string;
};

const sourceFiles = {
  anCuongCatalogue: "data/imports/ancuong/normalized/catalogue.json",
  anCuongRelations: "data/imports/ancuong/normalized/relation-only-products.json",
  anCuongFamilies: "data/imports/ancuong/normalized/product-families.json",
  anCuongDocuments: "data/imports/ancuong/normalized/documents.json",
  thanhThuy: "data/imports/thanh-thuy/full-records.json",
  baThanh: "data/imports/ba-thanh/full-records.json",
} as const;

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value as Record<string, unknown>)
    .filter(([, child]) => child !== undefined)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, child]) => [key, stableValue(child)]));
}

function stableJson(value: unknown): string {
  return `${JSON.stringify(stableValue(value))}\n`;
}

function sha256(value: string | Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

function readSource(root: string, relative: string): { records: SourceRecord[]; checksum: string } {
  const bytes = fs.readFileSync(path.join(root, relative));
  const parsed = JSON.parse(bytes.toString("utf8")) as SourceRecord[] | { records: SourceRecord[] };
  return { records: Array.isArray(parsed) ? parsed : parsed.records, checksum: sha256(bytes) };
}

function text(record: SourceRecord, key: string): string {
  const value = record[key];
  return typeof value === "string" ? value.trim() : "";
}

function object(record: SourceRecord, key: string): Record<string, unknown> {
  const value = record[key];
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function array(record: SourceRecord, key: string): unknown[] {
  const value = record[key];
  return Array.isArray(value) ? value : [];
}

function slugify(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/gi, "d")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function normalizedCode(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/gi, "d")
    .toUpperCase().replace(/[^A-Z0-9]+/g, "");
}

function localThumbnail(record: SourceRecord, fallback: string): string {
  const image = array(record, "images").find((item) => item && typeof item === "object" && typeof (item as Record<string, unknown>).localPath === "string") as Record<string, unknown> | undefined;
  return typeof image?.localPath === "string" ? image.localPath : fallback;
}

function verifiedPublicThumbnail(root: string, record: SourceRecord): string {
  const localPath = localThumbnail(record, "");
  if (!localPath) return "";
  const publicPath = localPath.startsWith("/") ? localPath : `/${localPath}`;
  return fs.existsSync(path.join(root, "public", publicPath.slice(1))) ? publicPath : "";
}

function formats(record: SourceRecord): string[] {
  return [...new Set(array(record, "formats").map((item) => {
    if (!item || typeof item !== "object") return "";
    const value = item as Record<string, unknown>;
    if (typeof value.label === "string") return value.label;
    return [value.widthMm, value.lengthMm, value.thicknessMm].filter((part) => typeof part === "number").join(" x ");
  }).filter(Boolean))].slice(0, 6);
}

function categoryRouteForThanhThuy(category: string): string {
  const categorySlug = slugify(category);
  return ["laminate", "melamine", "acrylic", "pvc-film", "veneer", "chi-nep-nhua"].includes(categorySlug)
    ? `/san-pham/${categorySlug}/`
    : "/thuong-hieu/thanh-thuy/";
}

function totalFor(records: Array<CatalogSearchEntry & { recordType: RecordType }>, supplierId: SupplierId) {
  const supplier = records.filter((record) => record.supplierId === supplierId);
  return {
    total: supplier.length,
    sku: supplier.filter((record) => record.recordType === "sku").length,
    family: supplier.filter((record) => record.recordType === "family").length,
    document: supplier.filter((record) => record.recordType === "document").length,
  };
}

export function buildSupplierSearchIndex(root = process.cwd()): SupplierSearchIndexArtifact {
  const sources = Object.fromEntries(Object.entries(sourceFiles).map(([key, file]) => [key, readSource(root, file)])) as Record<keyof typeof sourceFiles, { records: SourceRecord[]; checksum: string }>;
  const retainedBaThanh = JSON.parse(fs.readFileSync(path.join(root, "data/catalogs/ba-thanh.json"), "utf8")) as Array<{ codeNormalized: string; slug: string; displayName: string; category: string; images: unknown[]; seoStatus: string }>;
  const retainedByCode = new Map(retainedBaThanh.map((record) => [record.codeNormalized, record]));
  const records: Array<CatalogSearchEntry & { id: string; recordType: RecordType }> = [];

  const addAnCuong = (record: SourceRecord, recordType: RecordType, sourceGroup: string) => {
    const code = recordType === "sku" ? text(record, "normalizedProductCode") || text(record, "normalizedCode") || text(record, "productCode") || text(record, "code") : "";
    const category = text(record, "category") || text(record, "productType");
    const series = text(record, "productLine") || text(record, "productFamily");
    const material = classifyMaterialTaxonomy([category, series, text(record, "productType"), text(record, "name")]);
    const identity = text(record, "sourceId") || text(record, "sourceProductId") || text(record, "slug") || text(record, "sourceChecksum") || text(record, "sourceUrl") || text(record, "sourceHash") || text(record, "normalizedHash") || sha256(`${code}|${text(record, "name")}`);
    records.push({
      id: `an-cuong:${recordType}:${sourceGroup}:${identity}`,
      supplierId: "an-cuong", supplierName: "An Cường", kind: "catalogue-item", recordType,
      code, normalizedCode: code ? normalizedCode(code) : undefined,
      name: text(record, "name"), thumbnail: verifiedPublicThumbnail(root, record),
      canonicalRoute: material && isAnCuongCuratedCategory(material) ? `/catalogue/an-cuong/${material}/` : "/catalogue/an-cuong/",
      category, series, group: text(record, "materialPattern"), material,
      seoStatus: text(record, "seoStatus") || "NOINDEX_USEFUL", indexable: false,
      formats: [...new Set([...array(record, "dimensions"), ...array(record, "thicknesses")].filter((value): value is string => typeof value === "string"))].slice(0, 6),
      demandScore: Number(record.completenessScore ?? 0),
    });
  };

  sources.anCuongCatalogue.records.forEach((record) => addAnCuong(record, "sku", "catalogue"));
  sources.anCuongRelations.records.forEach((record) => addAnCuong(record, "sku", "relation"));
  sources.anCuongFamilies.records.forEach((record) => addAnCuong(record, "family", "family"));
  sources.anCuongDocuments.records.forEach((record) => addAnCuong(record, "document", "document"));

  for (const record of sources.thanhThuy.records) {
    const recordType = record.recordType ?? "sku";
    const code = recordType === "sku" ? text(record, "code") : "";
    const category = text(record, "category");
    const attributes = object(record, "attributes");
    const material = classifyMaterialTaxonomy([category, text(record, "productFamily"), text(record, "name")]);
    records.push({
      id: `thanh-thuy:${recordType}:${text(record, "sourceProductId") || text(record, "slug")}`,
      supplierId: "thanh-thuy", supplierName: "Thanh Thuỳ", kind: "product", recordType,
      code, normalizedCode: code ? normalizedCode(text(record, "normalizedCode") || code) : undefined,
      name: text(record, "name"), thumbnail: localThumbnail(record, "/partners/thanh-thuy-logo.webp"),
      canonicalRoute: recordType === "sku" ? `/san-pham/${slugify(category)}/${text(record, "slug")}/` : categoryRouteForThanhThuy(category),
      category, series: text(record, "productFamily") || String(attributes.series ?? ""), group: String(attributes.pattern ?? ""), material,
      seoStatus: text(record, "seoStatus"), indexable: text(record, "seoStatus") === "READY_TO_INDEX",
      formats: formats(record), demandScore: Number(record.completenessScore ?? 0),
    });
  }

  for (const record of sources.baThanh.records) {
    const recordType = record.recordType ?? "sku";
    const code = recordType === "sku" ? text(record, "code") : "";
    const normalized = code ? normalizedCode(text(record, "normalizedCode") || code) : "";
    const category = text(record, "category");
    const attributes = object(record, "attributes");
    const group = typeof attributes.sourceGroup === "string" ? attributes.sourceGroup : "";
    const retained = retainedByCode.get(normalized);
    const material = classifyMaterialTaxonomy([category, text(record, "productFamily"), text(record, "name")]);
    records.push({
      id: `ba-thanh:${recordType}:${text(record, "sourceProductId") || text(record, "slug")}`,
      supplierId: "ba-thanh", supplierName: "Ba Thanh", kind: "color-code", recordType,
      code: retained?.displayName ?? code, normalizedCode: normalized || undefined,
      name: text(record, "name"), thumbnail: localThumbnail(record, "/partners/ba-thanh-logo.webp"),
      canonicalRoute: retained ? `/ma-mau-melamine/ba-thanh/${retained.slug}/` : ["van-go", "don-sac", "van-da", "van-vai"].includes(group) ? `/ma-mau-melamine/ba-thanh/${group}/` : "/ma-mau-melamine/ba-thanh/",
      category, series: text(record, "productFamily"), group, material,
      seoStatus: text(record, "seoStatus"), indexable: Boolean(retained) && text(record, "seoStatus") === "READY_TO_INDEX",
      formats: formats(record),
      demandScore: retained
        ? (retained.seoStatus === "READY_TO_INDEX" ? 100 : 0) + ({ "van-go": 36, "don-sac": 32, "van-da": 24, "van-vai": 18 }[retained.category] ?? 0) + (retained.images.length ? 12 : 0) + 8
        : Number(record.completenessScore ?? 0),
    });
  }

  records.sort((left, right) => left.id.localeCompare(right.id));
  if (new Set(records.map((record) => record.id)).size !== records.length) throw new Error("Supplier search index contains duplicate record IDs");
  const artifactCore = {
    schemaVersion: 1 as const,
    sources: Object.fromEntries(Object.entries(sources).map(([key, source]) => [key, { records: source.records.length, checksum: source.checksum }])),
    totals: {
      "an-cuong": totalFor(records, "an-cuong"),
      "thanh-thuy": totalFor(records, "thanh-thuy"),
      "ba-thanh": { ...totalFor(records, "ba-thanh"), retainedMelamineCodes: retainedByCode.size },
    },
    records,
  };
  return { ...artifactCore, checksum: sha256(JSON.stringify(stableValue(artifactCore))) };
}

export function writeSupplierSearchIndex(root = process.cwd()): SupplierSearchIndexArtifact {
  const artifact = buildSupplierSearchIndex(root);
  const target = path.join(root, "data/catalogs/supplier-search-index.json");
  const temporary = `${target}.${process.pid}.tmp`;
  fs.writeFileSync(temporary, stableJson(artifact));
  fs.renameSync(temporary, target);
  return artifact;
}

if (process.argv[1]?.endsWith("build-search-index.ts")) {
  const artifact = writeSupplierSearchIndex();
  console.log(JSON.stringify({ records: artifact.records.length, totals: artifact.totals, checksum: artifact.checksum }, null, 2));
}
