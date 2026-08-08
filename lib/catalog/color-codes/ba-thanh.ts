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

const MELAMINE_MAP = "https://bathanh.com.vn/map-ma-melamine";
const LAMINATE_MAP = "https://bathanh.com.vn/map-mau-laminate";

export function classifyBaThanhRecord(record: SourceCatalogueRecord): ColorCodeClassification {
  if (stringValue(record, "recordType") !== "sku") {
    return { purpose: nonColorPurpose(record), reason: "non-sku-record" };
  }
  const codeRaw = stringValue(record, "code");
  const materialType = decorativeMaterialType([
    stringValue(record, "category"),
    stringValue(record, "productFamily"),
    stringValue(record, "name"),
  ]);
  if (!codeRaw || (materialType !== "melamine" && materialType !== "laminate")) {
    return { purpose: nonColorPurpose(record), reason: !codeRaw ? "missing-code" : "not-an-official-color-map-material" };
  }
  const attributes = objectValue(record, "attributes");
  const mapUrl = materialType === "melamine" ? MELAMINE_MAP : LAMINATE_MAP;
  return {
    purpose: "color-code",
    reason: "verified-official-color-map",
    colorCode: verifiedColorCode({
      supplier: "ba-thanh",
      record,
      codeRaw,
      materialType,
      evidence: "official-color-map",
      images: mapRecordImages(record),
      patternType: typeof attributes.patternGroup === "string" ? attributes.patternGroup : undefined,
      collection: stringArray(record, "collections")[0],
      sourceColorMapUrl: mapUrl,
    }),
  };
}
