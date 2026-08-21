import artifact from "@/data/catalogs/supplier-color-codes.json";
import fullArtifact from "@/data/catalogs/supplier-search-index.json";
import {
  classifyCatalogGroup,
  materialTaxonomyOptions,
} from "../material-taxonomy";
import type { PublicSupplierColorCode } from "../color-codes/types";
import type { CatalogSearchEntry, SupplierId } from "../core/types";

type SearchIndexRecord = CatalogSearchEntry & {
  id: string;
  recordType: "color-code" | "family";
};

type SupplierTotals = Record<
  SupplierId,
  {
    total: number;
    colorCodes: number;
    withLocalPreview: number;
    sourceMediaMissing: number;
    sku: number;
    family: number;
    document: number;
    retainedMelamineCodes?: number;
  }
>;

const source = artifact as {
  schemaVersion: 1;
  checksum: string;
  records: PublicSupplierColorCode[];
};

function supplierName(supplier: SupplierId): string {
  return supplier === "an-cuong"
    ? "An Cường"
    : supplier === "thanh-thuy"
      ? "Thanh Thuỳ"
      : "Ba Thanh";
}

function materialSlug(record: PublicSupplierColorCode): string {
  switch (record.materialType) {
    case "edge-banding":
      return "edge-banding";
    case "panel":
      return "panel";
    case "pvc":
    case "ppet":
      return "pvc-ppet";
    case "worktop":
      return "worktop";
    case "melamine":
    case "laminate":
    case "acrylic":
    case "veneer":
      return record.materialType;
    default:
      return "other-decorative";
  }
}

function localThumbnail(record: PublicSupplierColorCode): string {
  const rolePriority = ["swatch", "fullsheet", "actual-photo", "product", "application"] as const;
  for (const role of rolePriority) {
    const image = record.images.find((candidate) => candidate.role === role && candidate.localPath);
    if (image?.thumbnailSrc || image?.localPath) return image.thumbnailSrc || image.localPath || "";
  }
  return "";
}

function toSearchRecord(record: PublicSupplierColorCode): SearchIndexRecord {
  return {
    id: record.id,
    supplierId: record.supplier,
    supplierName: supplierName(record.supplier),
    kind: "color-code",
    recordType: "color-code",
    code: record.codeRaw,
    normalizedCode: record.codeNormalized,
    aliases: record.searchAliases,
    name: record.displayName?.trim() || record.codeRaw,
    thumbnail: localThumbnail(record),
    canonicalRoute: record.canonicalRoute,
    category: record.materialType,
    series: record.collection,
    group: record.patternType,
    sourceGroup: record.patternType,
    canonicalGroup: classifyCatalogGroup([
      record.patternType,
      record.collection,
      record.displayName,
    ]),
    material: materialSlug(record),
    seoStatus: record.seoStatus,
    indexable: record.seoStatus === "READY_TO_INDEX",
    demandScore: record.demandScore,
  };
}

function buildTotals(records: SearchIndexRecord[]): SupplierTotals {
  return Object.fromEntries(
    (["an-cuong", "thanh-thuy", "ba-thanh"] as SupplierId[]).map((supplier) => {
      const scoped = records.filter((record) => record.supplierId === supplier);
      return [supplier, {
        total: scoped.length,
        colorCodes: scoped.length,
        withLocalPreview: scoped.filter((record) => Boolean(record.thumbnail)).length,
        sourceMediaMissing: scoped.filter((record) => !record.thumbnail).length,
        sku: scoped.length,
        family: 0,
        document: 0,
        ...(supplier === "ba-thanh"
          ? { retainedMelamineCodes: scoped.filter((record) => record.material === "melamine").length }
          : {}),
      }];
    }),
  ) as SupplierTotals;
}

const colorCodeRecords = source.records.map(toSearchRecord);
const fullRecords = (fullArtifact as {
  records: Array<CatalogSearchEntry & { id: string; recordType: string }>;
}).records;
const familyRecords: SearchIndexRecord[] = fullRecords
  .filter((record) => record.recordType === "family")
  .map((record) => ({
    ...record,
    recordType: "family",
    sourceGroup: record.sourceGroup ?? record.group,
    canonicalGroup:
      record.canonicalGroup ??
      classifyCatalogGroup([
        record.sourceGroup,
        record.group,
        record.series,
        record.name,
      ]),
  }));
const colorCodeIds = new Set(colorCodeRecords.map((record) => record.id));
const familySourceUrls = new Set(
  colorCodeRecords.flatMap((record) =>
    record.supplierId === "thanh-thuy" && record.canonicalRoute
      ? [record.canonicalRoute]
      : [],
  ),
);
const uniqueFamilyRecords = familyRecords.filter((record) => {
  if (record.supplierId !== "thanh-thuy") return true;
  if (/^VENEER (?:CHEERY|OAK|WALNUT)$/i.test(record.name)) return false;
  return !familySourceUrls.has(record.canonicalRoute);
});
if (uniqueFamilyRecords.some((record) => colorCodeIds.has(record.id))) {
  throw new Error("Supplier family index collides with a public color-code ID");
}
const records = [...colorCodeRecords, ...uniqueFamilyRecords];
const sharedCatalogueRecords = records.filter(
  (record) =>
    record.material !== "panel" && record.material !== "other-decorative",
);
const index = {
  schemaVersion: 1 as const,
  checksum: source.checksum,
  // Keep `records` backward-compatible for supplier hubs; shared catalogue uses allRecords.
  records: colorCodeRecords,
  allRecords: records,
  sharedCatalogueRecords,
  totals: buildTotals(colorCodeRecords),
};

export function getSupplierSearchIndex() {
  return index;
}

export function getAllSupplierSearchEntries(): SearchIndexRecord[] {
  return index.sharedCatalogueRecords;
}

export function getSupplierTotals(): SupplierTotals {
  return index.totals;
}

export function getMaterialTaxonomyOptions(entries: CatalogSearchEntry[] = index.records) {
  return materialTaxonomyOptions(entries);
}
