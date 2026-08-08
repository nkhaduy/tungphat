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

const VENEER_COLLECTION_URL = "https://www.gothanhthuy.com/products/veneer/";
const officialVeneerSurfaces = new Map([
  ["VENEER CHEERY", "https://www.gothanhthuy.com/product/veneer/veneer-cheery/"],
  ["VENEER OAK", "https://www.gothanhthuy.com/product/veneer/veneer-oak/"],
  ["VENEER WALNUT", "https://www.gothanhthuy.com/product/veneer/veneer-walnut/"],
]);

function classifyOfficialVeneerSurface(
  record: SourceCatalogueRecord,
): ColorCodeClassification | undefined {
  if (stringValue(record, "recordType") !== "family") return undefined;
  const name = stringValue(record, "name");
  const officialUrl = officialVeneerSurfaces.get(name);
  const images = mapRecordImages(record);
  if (
    !officialUrl ||
    !/veneer/i.test(stringValue(record, "category")) ||
    !stringArray(record, "sourceUrls").includes(officialUrl) ||
    images.length === 0
  ) {
    return undefined;
  }
  return {
    purpose: "color-code",
    reason: "verified-official-surface-collection",
    colorCode: verifiedColorCode({
      supplier: "thanh-thuy",
      record,
      codeRaw: name,
      materialType: "veneer",
      evidence: "official-color-map",
      sourceColorMapUrl: VENEER_COLLECTION_URL,
      images,
      collection: "Tấm Veneer",
    }),
  };
}

export function classifyThanhThuyRecord(record: SourceCatalogueRecord): ColorCodeClassification {
  const officialVeneerSurface = classifyOfficialVeneerSurface(record);
  if (officialVeneerSurface) return officialVeneerSurface;
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
