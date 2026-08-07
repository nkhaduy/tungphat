import { buildColorCodeAliases, normalizeColorCode } from "./normalize";
import type {
  CatalogueRecordPurpose,
  ColorCodeEvidence,
  SupplierColorCode,
  SupplierColorCodeSupplier,
  SupplierColorImage,
  SupplierColorImageRole,
  SupplierColorMaterialType,
} from "./types";

export type SourceCatalogueRecord = Record<string, unknown>;

export type ColorCodeClassification = {
  purpose: CatalogueRecordPurpose;
  reason: string;
  colorCode?: SupplierColorCode;
};

export function stringValue(record: SourceCatalogueRecord, key: string): string {
  const value = record[key];
  return typeof value === "string" ? value.trim() : "";
}

export function stringArray(record: SourceCatalogueRecord, key: string): string[] {
  const value = record[key];
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
}

export function objectValue(record: SourceCatalogueRecord, key: string): Record<string, unknown> {
  const value = record[key];
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function fold(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase();
}

export function decorativeMaterialType(values: string[]): SupplierColorMaterialType | undefined {
  const value = fold(values.filter(Boolean).join(" "));
  if (/core board|cot van|mdf|hdf|hardware|phu kien noi that|keo dan|adhesive/.test(value)) return undefined;
  if (/chi pvc|chi abs|edge band|dan canh/.test(value)) return "edge-banding";
  if (/worktop|mat top|compact top/.test(value)) return "worktop";
  if (/san go|flooring|len tuong|nep cau thang/.test(value)) return "flooring";
  if (/acrylic/.test(value)) return "acrylic";
  if (/laminate|formica|hpl/.test(value)) return "laminate";
  if (/melamine/.test(value)) return "melamine";
  if (/veneer|eco veneer/.test(value)) return "veneer";
  if (/ppet/.test(value)) return "ppet";
  if (/pvc|decal/.test(value)) return "pvc";
  if (/panel|tam 2d|tam 3d|tam acoustic|wall|ceiling|lambri|ngoai troi|fireproof|chong chay/.test(value)) return "panel";
  return undefined;
}

export function nonColorPurpose(record: SourceCatalogueRecord): CatalogueRecordPurpose {
  const recordType = stringValue(record, "recordType");
  if (recordType === "family") return "product-family";
  if (recordType === "document") return "document";
  const value = fold([
    stringValue(record, "category"),
    stringValue(record, "productType"),
    stringValue(record, "productFamily"),
    stringValue(record, "name"),
  ].join(" "));
  if (/core board|cot van|mdf|hdf|technical|thong so/.test(value)) return "technical";
  return "other";
}

function imageRole(value: string): SupplierColorImageRole {
  switch (value) {
    case "swatch":
    case "fullsheet":
    case "actual-photo":
    case "product":
    case "application":
      return value;
    case "full-sheet":
      return "fullsheet";
    case "real-photo":
      return "actual-photo";
    default:
      return "product";
  }
}

export function mapRecordImages(record: SourceCatalogueRecord): SupplierColorImage[] {
  const images = Array.isArray(record.images) ? record.images : [];
  const result: SupplierColorImage[] = [];
  const seen = new Set<string>();
  for (const value of images) {
    if (!value || typeof value !== "object") continue;
    const image = value as Record<string, unknown>;
    const sourceUrl = typeof image.sourceUrl === "string" ? image.sourceUrl.trim() : "";
    if (!sourceUrl || seen.has(sourceUrl)) continue;
    seen.add(sourceUrl);
    result.push({
      role: imageRole(typeof image.mediaType === "string" ? image.mediaType : "product"),
      sourceUrl,
      localPath: typeof image.localPath === "string" ? image.localPath : undefined,
      mimeType: typeof image.mimeType === "string" ? image.mimeType : undefined,
      width: typeof image.width === "number" ? image.width : undefined,
      height: typeof image.height === "number" ? image.height : undefined,
      checksum: typeof image.checksum === "string" ? image.checksum : undefined,
      rightsStatus: "UNCONFIRMED",
    });
  }
  return result;
}

export function canonicalSourceUrls(record: SourceCatalogueRecord): string[] {
  const urls = [
    stringValue(record, "sourceUrl"),
    stringValue(record, "canonicalSourceUrl"),
    ...stringArray(record, "sourceUrls"),
  ].filter(Boolean);
  return [...new Set(urls)];
}

export function verifiedColorCode(input: {
  supplier: SupplierColorCodeSupplier;
  record: SourceCatalogueRecord;
  codeRaw: string;
  materialType: SupplierColorMaterialType;
  evidence: ColorCodeEvidence;
  images: SupplierColorImage[];
  patternType?: string;
  colorFamily?: string;
  surfaceEffect?: string;
  collection?: string;
  sourceColorMapUrl?: string;
}): SupplierColorCode {
  const sourceUrls = canonicalSourceUrls(input.record);
  const sourceUrl = sourceUrls[0];
  if (!sourceUrl) throw new Error(`Verified ${input.supplier} color code is missing a source URL: ${input.codeRaw}`);
  const status = stringValue(input.record, "seoStatus");
  const seoStatus = status === "READY_TO_INDEX" || status === "NOINDEX_USEFUL" || status === "NEEDS_ENRICHMENT"
    ? status
    : "NEEDS_ENRICHMENT";
  return {
    recordType: "color-code",
    supplier: input.supplier,
    codeRaw: input.codeRaw,
    codeNormalized: normalizeColorCode(input.codeRaw),
    searchAliases: buildColorCodeAliases(input.codeRaw),
    displayName: stringValue(input.record, "name") || undefined,
    materialType: input.materialType,
    patternType: input.patternType || undefined,
    colorFamily: input.colorFamily || undefined,
    surfaceEffect: input.surfaceEffect || undefined,
    collection: input.collection || undefined,
    sourceUrl,
    sourceColorMapUrl: input.sourceColorMapUrl,
    sourceUrls,
    images: input.images,
    searchable: true,
    colorCodeEvidence: input.evidence,
    confidence: "verified",
    seoStatus,
  };
}
