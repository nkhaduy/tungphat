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
import { buildColorCodeAliases } from "./normalize";
import { BA_THANH_LAMINATE_WAY_BY_ROUTE } from "../ba-thanh-laminate-way";

const MELAMINE_MAP = "https://bathanh.com.vn/map-ma-melamine";
const LAMINATE_MAP = "https://bathanh.com.vn/map-mau-laminate";

const LAMINATE_CATALOGUE_CODES: Record<string, string> = {
  P1010: "P 1010 G",
  P1150: "P 1150 G",
  P2001: "P 2001 G",
  P2002: "P 2002 G",
  P2052: "P 2052 G",
  P2061: "P 2061 G",
  P2660: "P 2660 G",
  P3190: "P 3190 CY",
  P4600: "P 4600 R",
  P4640: "P 4640 R",
  P7700: "P 7700 CY",
  P7740: "P 7740 R",
  P7790: "P 7790 R",
  P9120: "P 9120 CY",
  P9340: "P 9340 R",
  P9660: "P 9660 G",
  S4600: "S 4600 G",
  S7382: "S 7382 G",
  S7402: "S 7402 G",
  S7403: "S 7403 G",
  W0304: "W 0304 Z",
  W0502: "W 0502 Z",
  W0504: "W 0504 Z",
  W5220: "W 5220 N",
  W7020: "W 7020 Z",
  W7393: "W 7393 Z",
  W7412: "W 7412 Z",
  W9630: "W 9630 Z",
  F0022: "F 0022 X",
  F3292: "F 3292 X",
  F3293: "F 3293 X",
  F3294: "F 3294 X",
  F3295: "F 3295 X",
};

const LAMINATE_MATCHING_MELAMINE: Record<string, string> = {
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
  const officialLaminate = BA_THANH_LAMINATE_WAY_BY_ROUTE.get(codeRaw);
  const mapUrl = materialType === "melamine" ? MELAMINE_MAP : LAMINATE_MAP;
  const catalogueCode = materialType === "laminate"
    ? stringValue(attributes, "catalogueCode") || officialLaminate?.catalogueCode || LAMINATE_CATALOGUE_CODES[codeRaw] || codeRaw
    : codeRaw;
  const matchingMelamineCode = materialType === "laminate"
    ? stringValue(attributes, "matchingMelamineCode") || officialLaminate?.matchingMelamineCode || LAMINATE_MATCHING_MELAMINE[codeRaw] || ""
    : "";
  const colorCode = verifiedColorCode({
    supplier: "ba-thanh",
    record,
    codeRaw: catalogueCode,
    materialType,
    evidence: "official-color-map",
    images: mapRecordImages(record),
    patternType: typeof attributes.patternGroup === "string" ? attributes.patternGroup : undefined,
    collection: stringArray(record, "collections")[0],
    sourceColorMapUrl: mapUrl,
  });
  if (matchingMelamineCode) {
    colorCode.searchAliases = [
      ...new Set([
        ...colorCode.searchAliases,
        ...buildColorCodeAliases(matchingMelamineCode),
      ]),
    ];
  }
  if (materialType === "laminate" && catalogueCode !== codeRaw) {
    colorCode.searchAliases = [
      ...new Set([
        ...colorCode.searchAliases,
        ...buildColorCodeAliases(codeRaw),
        catalogueCode.replace(/^([A-Z]+)\s+(\d+)/, "$1$2"),
      ]),
    ];
  }
  return {
    purpose: "color-code",
    reason: "verified-official-color-map",
    colorCode,
  };
}
