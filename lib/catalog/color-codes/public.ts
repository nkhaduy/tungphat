import artifact from "@/data/catalogs/supplier-color-codes.json";
import unavailableMedia from "@/data/catalogs/unavailable-color-media.json";
import { createCatalogueCodeSeoIndex } from "@/lib/catalog/code-seo";
import { resolveMediaUrl } from "@/lib/media";
import type { PublicSupplierColorCode, SupplierColorCodeSupplier } from "./types";

function optionalMediaUrl(value: string | undefined): string | undefined {
  return value ? resolveMediaUrl(value) : undefined;
}

// Preserve provenance in the source artifact. Only suppress the exact verified
// missing version; a recovered replacement with a new checksum remains usable.
const missingChecksums = new Map(
  unavailableMedia.entries.map(({ objectKey, sha256 }) => [`/${objectKey}`, sha256]),
);
const records = (artifact.records as PublicSupplierColorCode[]).map((record) => ({
  ...record,
  images: record.images.filter((image) => !(
    image.localPath && missingChecksums.has(image.localPath) &&
    missingChecksums.get(image.localPath) === image.checksum
  )).map((image) => ({
    ...image,
    localPath: optionalMediaUrl(image.localPath),
    thumbnailSrc: optionalMediaUrl(image.thumbnailSrc),
    originalPath: optionalMediaUrl(image.originalPath),
    originalUrl: optionalMediaUrl(image.originalUrl),
  })),
}));
const seoIndex = createCatalogueCodeSeoIndex(records);

export function getPublicColorCodes(): PublicSupplierColorCode[] {
  return records;
}

export function getPublicColorCode(supplier: string, material: string, slug: string) {
  return records.find(
    (record) =>
      record.supplier === supplier &&
      record.materialType === material &&
      record.slug === slug,
  );
}

export function getPublicColorCodesForSupplier(supplier: SupplierColorCodeSupplier) {
  return records.filter((record) => record.supplier === supplier);
}

export function getPublicColorCodesForMaterial(supplier: SupplierColorCodeSupplier, material: string) {
  return records.filter(
    (record) => record.supplier === supplier && record.materialType === material,
  );
}

export function getPublicColorCodeMaterials(supplier: SupplierColorCodeSupplier) {
  return [...new Set(getPublicColorCodesForSupplier(supplier).map((record) => record.materialType))];
}

export function getPublicColorCodeRelatedCodes(record: PublicSupplierColorCode) {
  return seoIndex.relatedFor(record);
}
