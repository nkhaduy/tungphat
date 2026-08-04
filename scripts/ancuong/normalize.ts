import { createHash } from "node:crypto";
import type { AnCuongMedia, AnCuongProduct, RawProductDetail } from "./types";
import { ANCUONG_PARSER_VERSION } from "./types";
import { stableStringify } from "./stable-json";

export function normalizeProductCode(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/[‐‑‒–—−]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

export function sha256(value: string | Uint8Array): string {
  return createHash("sha256").update(value).digest("hex");
}

function unique(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function facet(detail: RawProductDetail, ...labels: string[]): string[] {
  const normalizedLabels = labels.map((label) => label.toLocaleLowerCase("vi"));
  return unique(
    Object.entries(detail.facets)
      .filter(([label]) => normalizedLabels.includes(label.toLocaleLowerCase("vi")))
      .flatMap(([, values]) => values)
  );
}

function media(sourceUrl: string, alt?: string): AnCuongMedia {
  return { sourceUrl, ...(alt ? { alt } : {}) };
}

export function normalizeProduct(detail: RawProductDetail): AnCuongProduct {
  const dimensions = facet(detail, "Kich Thuoc (mm)", "Kích Thước (mm)");
  const product: Omit<AnCuongProduct, "normalizedHash"> = {
    source: "ancuong",
    brand: "An Cường",
    supplierSource: "An Cường",
    sourceUrl: detail.sourceUrl,
    sourceId: detail.sourceId,
    name: detail.name,
    productCode: detail.productCode,
    normalizedProductCode: normalizeProductCode(detail.productCode),
    category: detail.category,
    categorySlug: detail.categorySlug,
    productType: facet(detail, "Loai San Pham", "Loại Sản Phẩm")[0],
    productLine: detail.productLines[0]?.name,
    dimensions,
    thicknesses: unique(detail.productLines.flatMap((line) => line.dimensionThicknessMatrix.flatMap((row) => row.thicknesses))),
    dimensionThicknessMatrix: detail.productLines.flatMap((line) => line.dimensionThicknessMatrix),
    materialPattern: facet(detail, "Loai Van", "Loại Vân")[0],
    woodPatternType: facet(detail, "Loai Van Go", "Loại Vân Gỗ")[0],
    fabricPatternType: facet(detail, "Loai Van Vai, Da, May", "Loại Vân Vải, Da, Mây")[0],
    stonePatternType: facet(detail, "Loai Van Da", "Loại Vân Đá")[0],
    otherPatternType: facet(detail, "Loai Van Khac", "Loại Vân Khác")[0],
    colors: facet(detail, "Mau Sac", "Màu Sắc"),
    surfaces: facet(detail, "Be Mat", "Bề Mặt"),
    surfaceEffects: facet(detail, "Hieu Ung Be Mat", "Hiệu Ứng Bề Mặt"),
    specialFeatures: facet(detail, "Tinh Nang Dac Biet", "Tính Năng Đặc Biệt"),
    collections: facet(detail, "Bo Suu Tap", "Bộ Sưu Tập"),
    solutions: facet(detail, "Giai Phap", "Giải Pháp"),
    edgeBandingTypes: facet(detail, "Chi Dan Canh", "Chỉ Dán Cạnh"),
    profiles: facet(detail, "Bien Dang", "Biên Dạng"),
    priceGroup: facet(detail, "Nhom Gia", "Nhóm Giá")[0],
    standards: unique(detail.productLines.flatMap((line) => line.standards)),
    features: unique(detail.productLines.flatMap((line) => line.features)),
    descriptions: {},
    contentUsageStatus: "technical-data",
    primaryImage: detail.primaryImageUrl ? media(detail.primaryImageUrl, detail.name) : undefined,
    gallery: detail.galleryUrls.map((url) => media(url, detail.name)),
    relatedProducts: detail.relatedProducts,
    sameColorProducts: detail.sameColorProducts,
    applicationProducts: detail.applicationProducts,
    technicalWarnings: unique(detail.productLines.flatMap((line) => line.technicalWarnings)),
    discoveredAt: detail.discoveredAt,
    fetchedAt: detail.fetchedAt,
    sourceHash: detail.sourceHash,
    parserVersion: ANCUONG_PARSER_VERSION,
    status: "active"
  };
  return { ...product, normalizedHash: sha256(stableStringify(product)) };
}
