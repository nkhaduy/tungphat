import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { classifyAnCuongRecord } from "../../lib/catalog/color-codes/an-cuong";
import { classifyBaThanhRecord } from "../../lib/catalog/color-codes/ba-thanh";
import type {
  ColorCodeClassification,
  SourceCatalogueRecord,
} from "../../lib/catalog/color-codes/classify";
import { classifyThanhThuyRecord } from "../../lib/catalog/color-codes/thanh-thuy";
import { supplierPriority } from "../../lib/catalog/core/registry";
import {
  applyColorMediaToIndex,
} from "./merge-color-media";
import type { ColorMediaDiscoveryArtifact } from "./color-media";
import type {
  CatalogueRecordPurpose,
  PublicSupplierColorCode,
  SupplierColorCode,
  SupplierColorCodeSupplier,
} from "../../lib/catalog/color-codes/types";

type SupplierAuditTotal = {
  previousRecords: number;
  verifiedColorCodes: number;
  scopeExcluded: number;
  productFamiliesRemoved: number;
  technicalRemoved: number;
  documentsRemoved: number;
  otherRemoved: number;
  duplicateAliases: number;
};

const anCuongPublicMaterialTypes = new Set<SupplierColorCode["materialType"]>([
  "melamine",
  "laminate",
  "acrylic",
  "veneer",
  "ppet",
  "pvc",
  "worktop",
  "edge-banding",
]);

export type SupplierColorCodeIndexArtifact = {
  schemaVersion: 1;
  generatedAt: string;
  previousSearchableRecords: number;
  removedFromPublicColorIndex: number;
  duplicateAliases: number;
  purposeTotals: Record<CatalogueRecordPurpose, number>;
  totals: Record<SupplierColorCodeSupplier, SupplierAuditTotal>;
  records: PublicSupplierColorCode[];
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

function readRecords(root: string, relative: string): SourceCatalogueRecord[] {
  const parsed = JSON.parse(fs.readFileSync(path.join(root, relative), "utf8")) as
    | SourceCatalogueRecord[]
    | { records: SourceCatalogueRecord[] };
  return Array.isArray(parsed) ? parsed : parsed.records;
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([, child]) => child !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => [key, stableValue(child)]),
  );
}

function stableJson(value: unknown): string {
  return `${JSON.stringify(stableValue(value), null, 2)}\n`;
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function demandScore(record: SupplierColorCode): number {
  const roleScore = record.images.some((image) => image.role === "swatch")
    ? 24
    : record.images.some((image) => image.role === "fullsheet")
      ? 20
      : record.images.length
        ? 12
        : 0;
  return (record.materialType === "melamine" ? 80 : 0) + roleScore + (record.patternType ? 8 : 0);
}

function publicRecord(record: SupplierColorCode): PublicSupplierColorCode {
  const slug = slugify(record.codeRaw);
  return {
    ...record,
    id: `${record.supplier}:${record.codeNormalized}`,
    slug,
    canonicalRoute: `/catalogue/${record.supplier}/${record.materialType}/${slug}/`,
    demandScore: demandScore(record),
  };
}

function mergeRecords(left: PublicSupplierColorCode, right: SupplierColorCode): PublicSupplierColorCode {
  const images = [...left.images];
  const imageUrls = new Set(images.map((image) => image.sourceUrl));
  for (const image of right.images) {
    if (!imageUrls.has(image.sourceUrl)) {
      imageUrls.add(image.sourceUrl);
      images.push(image);
    }
  }
  const sourceUrls = [...new Set([...left.sourceUrls, ...right.sourceUrls])];
  const searchAliases = [...new Set([...left.searchAliases, ...right.searchAliases])];
  const seoRank = { READY_TO_INDEX: 3, NOINDEX_USEFUL: 2, NEEDS_ENRICHMENT: 1 } as const;
  const seoStatus = seoRank[right.seoStatus] > seoRank[left.seoStatus]
    ? right.seoStatus
    : left.seoStatus;
  return {
    ...left,
    displayName: left.displayName || right.displayName,
    patternType: left.patternType || right.patternType,
    colorFamily: left.colorFamily || right.colorFamily,
    surfaceEffect: left.surfaceEffect || right.surfaceEffect,
    collection: left.collection || right.collection,
    sourceColorMapUrl: left.sourceColorMapUrl || right.sourceColorMapUrl,
    sourceUrls,
    searchAliases,
    images,
    seoStatus,
    demandScore: demandScore({ ...left, images, sourceUrls, searchAliases, seoStatus }),
  };
}

function emptyPurposeTotals(): Record<CatalogueRecordPurpose, number> {
  return { "color-code": 0, "product-family": 0, technical: 0, document: 0, other: 0 };
}

function emptySupplierTotal(): SupplierAuditTotal {
  return {
    previousRecords: 0,
    verifiedColorCodes: 0,
    scopeExcluded: 0,
    productFamiliesRemoved: 0,
    technicalRemoved: 0,
    documentsRemoved: 0,
    otherRemoved: 0,
    duplicateAliases: 0,
  };
}

function readColorMediaArtifacts(root: string): ColorMediaDiscoveryArtifact[] {
  return ["an-cuong", "ba-thanh"]
    .map((supplier) => path.join(root, `data/imports/${supplier}/color-media-discovery.json`))
    .filter((file) => fs.existsSync(file))
    .map((file) => JSON.parse(fs.readFileSync(file, "utf8")) as ColorMediaDiscoveryArtifact);
}

export function buildSupplierColorCodeIndex(root = process.cwd()): SupplierColorCodeIndexArtifact {
  const sources = {
    anCuong: [
      ...readRecords(root, sourceFiles.anCuongCatalogue),
      ...readRecords(root, sourceFiles.anCuongRelations),
      ...readRecords(root, sourceFiles.anCuongFamilies),
      ...readRecords(root, sourceFiles.anCuongDocuments),
    ],
    thanhThuy: readRecords(root, sourceFiles.thanhThuy),
    baThanh: readRecords(root, sourceFiles.baThanh),
  };
  const purposeTotals = emptyPurposeTotals();
  const totals: SupplierColorCodeIndexArtifact["totals"] = {
    "an-cuong": emptySupplierTotal(),
    "thanh-thuy": emptySupplierTotal(),
    "ba-thanh": emptySupplierTotal(),
  };
  const canonical = new Map<string, PublicSupplierColorCode>();
  let duplicateAliases = 0;

  const consume = (
    supplier: SupplierColorCodeSupplier,
    records: SourceCatalogueRecord[],
    classify: (record: SourceCatalogueRecord) => ColorCodeClassification,
  ) => {
    for (const source of records) {
      totals[supplier].previousRecords += 1;
      const result = classify(source);
      purposeTotals[result.purpose] += 1;
      if (!result.colorCode) {
        if (result.purpose === "product-family") totals[supplier].productFamiliesRemoved += 1;
        else if (result.purpose === "technical") totals[supplier].technicalRemoved += 1;
        else if (result.purpose === "document") totals[supplier].documentsRemoved += 1;
        else totals[supplier].otherRemoved += 1;
        continue;
      }
      if (
        supplier === "an-cuong" &&
        !anCuongPublicMaterialTypes.has(result.colorCode.materialType)
      ) {
        totals[supplier].scopeExcluded += 1;
        continue;
      }
      const key = `${supplier}:${result.colorCode.codeNormalized}`;
      const existing = canonical.get(key);
      if (existing) {
        duplicateAliases += 1;
        totals[supplier].duplicateAliases += 1;
        canonical.set(key, mergeRecords(existing, result.colorCode));
      } else {
        canonical.set(key, publicRecord(result.colorCode));
      }
    }
  };

  consume("an-cuong", sources.anCuong, classifyAnCuongRecord);
  consume("thanh-thuy", sources.thanhThuy, classifyThanhThuyRecord);
  consume("ba-thanh", sources.baThanh, classifyBaThanhRecord);

  let records = [...canonical.values()].sort(
    (left, right) =>
      supplierPriority(left.supplier) - supplierPriority(right.supplier) ||
      right.demandScore - left.demandScore ||
      left.codeNormalized.localeCompare(right.codeNormalized),
  );
  records = applyColorMediaToIndex(records, readColorMediaArtifacts(root));
  for (const supplier of Object.keys(totals) as SupplierColorCodeSupplier[]) {
    totals[supplier].verifiedColorCodes = records.filter((record) => record.supplier === supplier).length;
  }
  const previousSearchableRecords = Object.values(totals).reduce((sum, total) => sum + total.previousRecords, 0);
  const core = {
    schemaVersion: 1 as const,
    generatedAt: "2026-08-07T00:00:00.000Z",
    previousSearchableRecords,
    removedFromPublicColorIndex: previousSearchableRecords - records.length,
    duplicateAliases,
    purposeTotals,
    totals,
    records,
  };
  return { ...core, checksum: sha256(JSON.stringify(stableValue(core))) };
}

export function writeSupplierColorCodeIndex(root = process.cwd()) {
  const artifact = buildSupplierColorCodeIndex(root);
  const target = path.join(root, "data/catalogs/supplier-color-codes.json");
  const temporary = `${target}.${process.pid}.tmp`;
  fs.writeFileSync(temporary, stableJson(artifact));
  fs.renameSync(temporary, target);
  return artifact;
}

if (process.argv[1]?.endsWith("build-color-code-index.ts")) {
  const artifact = writeSupplierColorCodeIndex();
  console.log(JSON.stringify({ records: artifact.records.length, totals: artifact.totals, checksum: artifact.checksum }, null, 2));
}
