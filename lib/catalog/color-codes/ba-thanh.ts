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

const LAMINATE_PRINTED_CODES: Record<string, string> = {
  P1010: "SC 013 MW",
  P1150: "SC 015 MW",
  P2001: "SC 014 MW",
  P2002: "SC 016 MW",
  P2052: "SC 017 MW",
  P2061: "SC 018 MW",
  P2660: "SC 013 M",
  P3190: "SC 012 MW",
  P4600: "SC 015 M",
  P4640: "SC 016 M",
  P7700: "SC 009 MW",
  P7740: "SC 010 MW",
  P7790: "SC 017 M",
  P9120: "SC 011 MW",
  P9340: "SC 018 M",
  P9660: "SC 014 M",
  S4600: "BT S9",
  S7382: "BT S8",
  S7402: "BT 164",
  S7403: "BT 165",
  W0304: "BT 162",
  W0502: "BT 163",
  W0504: "BT 161",
  W5220: "BT 158",
  W7020: "BT 166",
  W7393: "BT 167",
  W7412: "BT 159",
  W9630: "BT 160",
  F0022: "BT 117",
  F3292: "BT 118",
  F3293: "BT 52",
  F3294: "BT 146",
  F3295: "BT 90",
};

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
  const printedCode = materialType === "laminate"
    ? LAMINATE_PRINTED_CODES[codeRaw]
    : undefined;
  const colorCode = verifiedColorCode({
    supplier: "ba-thanh",
    record,
    codeRaw: printedCode ?? codeRaw,
    materialType,
    evidence: "official-color-map",
    images: mapRecordImages(record),
    patternType: typeof attributes.patternGroup === "string" ? attributes.patternGroup : undefined,
    collection: stringArray(record, "collections")[0],
    sourceColorMapUrl: mapUrl,
  });
  return {
    purpose: "color-code",
    reason: "verified-official-color-map",
    colorCode: printedCode
      ? { ...colorCode, displayName: `Laminate Ba Thanh ${printedCode}` }
      : colorCode,
  };
}
