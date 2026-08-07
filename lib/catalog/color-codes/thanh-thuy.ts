import {
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

export function classifyThanhThuyRecord(record: SourceCatalogueRecord): ColorCodeClassification {
  if (stringValue(record, "recordType") !== "sku") {
    return { purpose: nonColorPurpose(record), reason: "non-sku-record" };
  }
  const codeRaw = stringValue(record, "code");
  const materialType = decorativeMaterialType([
    stringValue(record, "category"),
    stringValue(record, "productFamily"),
    stringValue(record, "name"),
  ]);
  const attributes = objectValue(record, "attributes");
  const visualMetadata = Boolean(
    (typeof attributes.color === "string" && attributes.color.trim()) ||
      (typeof attributes.pattern === "string" && attributes.pattern.trim()) ||
      mapRecordImages(record).length,
  );
  if (!codeRaw || !materialType || !visualMetadata) {
    return { purpose: nonColorPurpose(record), reason: !codeRaw ? "missing-code" : !materialType ? "non-decorative-material" : "missing-decorative-evidence" };
  }
  return {
    purpose: "color-code",
    reason: "verified-decorative-product-detail",
    colorCode: verifiedColorCode({
      supplier: "thanh-thuy",
      record,
      codeRaw,
      materialType,
      evidence: stringArray(record, "sourceUrls").some((url) => /color-map/i.test(url))
        ? "official-color-map"
        : "decorative-product-detail",
      images: mapRecordImages(record),
      patternType: typeof attributes.pattern === "string" ? attributes.pattern : undefined,
      colorFamily: typeof attributes.color === "string" ? attributes.color : undefined,
      collection: stringArray(record, "collections")[0],
    }),
  };
}
