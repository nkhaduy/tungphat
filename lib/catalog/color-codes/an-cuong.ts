import {
  canonicalSourceUrls,
  decorativeMaterialType,
  mapRecordImages,
  nonColorPurpose,
  objectValue,
  stringArray,
  stringValue,
  verifiedColorCode,
  type ColorCodeClassification,
  type SourceCatalogueRecord,
} from "./classify";
import type { SupplierColorImage } from "./types";

function anCuongImages(record: SourceCatalogueRecord): SupplierColorImage[] {
  const images = mapRecordImages(record);
  const seen = new Set(images.map((image) => image.sourceUrl));
  const add = (value: unknown, role: SupplierColorImage["role"]) => {
    if (!value || typeof value !== "object") return;
    const sourceUrl = (value as Record<string, unknown>).sourceUrl;
    if (typeof sourceUrl !== "string" || !sourceUrl.trim() || seen.has(sourceUrl)) return;
    seen.add(sourceUrl);
    images.push({ role, sourceUrl, rightsStatus: "UNCONFIRMED" });
  };
  add(record.primaryImage, "fullsheet");
  if (Array.isArray(record.gallery)) {
    for (const value of record.gallery) {
      const sourceUrl = value && typeof value === "object" ? (value as Record<string, unknown>).sourceUrl : undefined;
      const role = typeof sourceUrl === "string" && new URL(sourceUrl).hostname === "acshopping.ancuong.com"
        ? "application"
        : typeof sourceUrl === "string" && sourceUrl.includes("products-thumb")
          ? "swatch"
          : "fullsheet";
      add(value, role);
    }
  }
  return images;
}

export function classifyAnCuongRecord(record: SourceCatalogueRecord): ColorCodeClassification {
  const attributes = objectValue(record, "attributes");
  const codeRaw = stringValue(record, "productCode") || stringValue(record, "normalizedProductCode") || stringValue(record, "code");
  const matchingColor = attributes.sourceEvidence === "same-color-relation";
  const materialType = decorativeMaterialType([
    stringValue(record, "category"),
    stringValue(record, "productType"),
    stringValue(record, "productFamily"),
    codeRaw,
  ]);
  const images = anCuongImages(record);
  const visualMetadata = Boolean(
    stringValue(record, "materialPattern") ||
      stringArray(record, "colors").length ||
      stringArray(record, "surfaces").length ||
      stringArray(record, "surfaceEffects").length ||
      images.length,
  );

  if (!codeRaw || !materialType || (!matchingColor && !visualMetadata) || !canonicalSourceUrls(record).length) {
    const purpose = nonColorPurpose(record);
    return { purpose, reason: !codeRaw ? "missing-code" : !materialType ? "non-decorative-material" : "missing-decorative-evidence" };
  }

  return {
    purpose: "color-code",
    reason: matchingColor ? "verified-matching-color" : "verified-decorative-product-detail",
    colorCode: verifiedColorCode({
      supplier: "an-cuong",
      record,
      codeRaw,
      materialType,
      evidence: matchingColor ? "matching-color" : "decorative-product-detail",
      images,
      patternType: stringValue(record, "materialPattern"),
      colorFamily: stringArray(record, "colors")[0],
      surfaceEffect: stringArray(record, "surfaceEffects")[0] || stringArray(record, "surfaces")[0],
      collection: stringArray(record, "collections")[0],
    }),
  };
}
