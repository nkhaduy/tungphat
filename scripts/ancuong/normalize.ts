import { createHash } from "node:crypto";
import type { AnCuongMedia, AnCuongProduct, CategoryRecord, DiscoveryManifest, ListingProduct, RawProductDetail } from "./types";
import { ANCUONG_PARSER_VERSION } from "./types";
import type { CliOptions } from "./types";
import { paths } from "./config";
import { atomicWriteJson, readJsonIfExists, stableStringify } from "./stable-json";
import { join } from "node:path";
import { buildRelationOnlySkuRecords } from "./relation-only";
import type { RelationRecord } from "./crawl-relations";
import { enrichProductLineFamilyRecords } from "./crawl-product-lines";
import type { SupplierFamilyRecord } from "../../lib/catalog/full-import/types";

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

export type RejectedProductDetail = {
  sourceUrl: string;
  sourceId?: string;
  sourceHash: string;
  outcome: "invalid";
  reason: string;
};

export function partitionProductDetails(details: RawProductDetail[]): {
  accepted: RawProductDetail[];
  rejected: RejectedProductDetail[];
} {
  const accepted: RawProductDetail[] = [];
  const rejected: RejectedProductDetail[] = [];
  for (const detail of details) {
    const custom404 = detail.name.trim() === "404" &&
      !detail.productCode.trim() &&
      !detail.primaryImageUrl &&
      detail.galleryUrls.length === 0 &&
      Object.keys(detail.facets).length === 0;
    if (custom404) {
      rejected.push({
        sourceUrl: detail.sourceUrl,
        ...(detail.sourceId ? { sourceId: detail.sourceId } : {}),
        sourceHash: detail.sourceHash,
        outcome: "invalid",
        reason: "The sitemap URL resolved to the supplier custom 404 page",
      });
      continue;
    }
    accepted.push(detail);
  }
  return {
    accepted: accepted.sort((left, right) => left.sourceUrl.localeCompare(right.sourceUrl)),
    rejected: rejected.sort((left, right) => left.sourceUrl.localeCompare(right.sourceUrl)),
  };
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
    sourceContent: detail.sourceContent,
    sourceFacets: detail.facets,
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
  const volatileFields = new Set(["discoveredAt", "fetchedAt", "sourceHash", "status", "parserVersion"]);
  const normalizedContent = Object.fromEntries(Object.entries(product).filter(([key]) => !volatileFields.has(key)));
  return { ...product, normalizedHash: sha256(stableStringify(normalizedContent)) };
}

function productIdentity(product: AnCuongProduct): string {
  return product.sourceId ? `id:${product.sourceId}` : `url:${product.sourceUrl}`;
}

export function stabilizeUnchangedProducts(current: AnCuongProduct[], previous: AnCuongProduct[]): AnCuongProduct[] {
  const priorByIdentity = new Map(previous.map((product) => [productIdentity(product), product]));
  return current.map((product) => {
    const prior = priorByIdentity.get(productIdentity(product));
    return prior?.normalizedHash === product.normalizedHash ? prior : product;
  });
}

export function dedupeProducts(products: AnCuongProduct[]): { products: AnCuongProduct[]; duplicates: AnCuongProduct[] } {
  const kept = new Map<string, AnCuongProduct>();
  const duplicates: AnCuongProduct[] = [];
  for (const product of products) {
    const key = product.sourceId
      ? `id:${product.sourceId}`
      : product.sourceUrl
        ? `url:${new URL(product.sourceUrl).toString()}`
        : `code:${product.normalizedProductCode}|category:${product.categorySlug}|hash:${product.sourceHash}`;
    const previous = kept.get(key);
    if (!previous) {
      kept.set(key, product);
      continue;
    }
    const currentWins = product.fetchedAt.localeCompare(previous.fetchedAt) >= 0;
    duplicates.push(currentWins ? previous : product);
    if (currentWins) kept.set(key, product);
  }
  return {
    products: [...kept.values()].sort((left, right) => left.categorySlug.localeCompare(right.categorySlug) || left.normalizedProductCode.localeCompare(right.normalizedProductCode) || left.sourceUrl.localeCompare(right.sourceUrl)),
    duplicates: duplicates.sort((left, right) => left.sourceUrl.localeCompare(right.sourceUrl))
  };
}

export function buildNormalizedCategories(categories: CategoryRecord[], listings: ListingProduct[]): CategoryRecord[] {
  const counts = new Map<string, number>();
  for (const listing of listings) counts.set(listing.categorySlug, (counts.get(listing.categorySlug) ?? 0) + 1);
  return categories
    .map((category) => ({ ...category, productCount: counts.get(category.slug) ?? 0 }))
    .sort((left, right) => left.slug.localeCompare(right.slug));
}

function proposedSlug(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/đ/gi, "d")
    .toLocaleLowerCase("vi")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function sourceFacet(product: AnCuongProduct, ...labels: string[]): string[] {
  const wanted = labels.map((label) => label.toLocaleLowerCase("vi"));
  const values = Object.entries(product.sourceFacets ?? {})
    .filter(([label]) => wanted.includes(label.toLocaleLowerCase("vi")))
    .flatMap(([, entries]) => entries);
  if (values.length > 0) return unique(values);
  return product.materialPattern ? [product.materialPattern] : [];
}

const taxonomyFields: Array<[string, (product: AnCuongProduct) => string[]]> = [
  ["Loại Sản Phẩm", (product) => product.productType ? [product.productType] : []],
  ["Kích Thước", (product) => product.dimensions],
  ["Vật Liệu", (product) => sourceFacet(product, "Vật liệu", "Vật Liệu")],
  ["Loại Vân", (product) => sourceFacet(product, "Loại Vân", "Loai Van")],
  ["Loại Vân Gỗ", (product) => product.woodPatternType ? [product.woodPatternType] : []],
  ["Loại Vân Vải, Da, Mây", (product) => product.fabricPatternType ? [product.fabricPatternType] : []],
  ["Loại Vân Đá", (product) => product.stonePatternType ? [product.stonePatternType] : []],
  ["Hiệu Ứng Bề Mặt", (product) => product.surfaceEffects],
  ["Màu Sắc", (product) => product.colors],
  ["Bề Mặt", (product) => product.surfaces],
  ["Tính Năng Đặc Biệt", (product) => product.specialFeatures],
  ["Bộ Sưu Tập", (product) => product.collections],
  ["Giải Pháp", (product) => product.solutions],
  ["Chỉ Dán Cạnh", (product) => product.edgeBandingTypes],
  ["Biên Dạng", (product) => product.profiles],
  ["Nhóm Giá", (product) => product.priceGroup ? [product.priceGroup] : []]
];

export function buildTaxonomy(products: AnCuongProduct[]) {
  const facets = taxonomyFields.map(([facet, extract]) => {
    const counts = new Map<string, { count: number; sourceKeys: Set<string> }>();
    for (const product of products) {
      for (const value of unique(extract(product))) {
        const item = counts.get(value) ?? { count: 0, sourceKeys: new Set<string>() };
        item.count += 1;
        item.sourceKeys.add(product.sourceId ?? product.sourceUrl);
        counts.set(value, item);
      }
    }
    const slugCounts = new Map<string, number>();
    for (const value of counts.keys()) {
      const slug = proposedSlug(value);
      slugCounts.set(slug, (slugCounts.get(slug) ?? 0) + 1);
    }
    return {
      facet,
      values: [...counts.entries()]
        .map(([value, item]) => ({
          value,
          productCount: item.count,
          sourceKeys: [...item.sourceKeys].sort(),
          proposedSlug: proposedSlug(value),
          collision: (slugCounts.get(proposedSlug(value)) ?? 0) > 1
        }))
        .sort((left, right) => left.value.localeCompare(right.value)),
      unknownProductCount: products.filter((product) => extract(product).length === 0).length
    };
  });
  return { parserVersion: ANCUONG_PARSER_VERSION, facets };
}

export async function run(options: CliOptions): Promise<void> {
  const details = await readJsonIfExists<RawProductDetail[]>(join(paths.raw, "details.json"));
  if (!details) throw new Error(`Missing raw product details: ${join(paths.raw, "details.json")}`);
  const discovery = await readJsonIfExists<DiscoveryManifest>(join(paths.reports, "discovery-manifest.json"));
  const listings = await readJsonIfExists<ListingProduct[]>(join(paths.raw, "listings.json"));
  const relations = (await readJsonIfExists<RelationRecord[]>(join(paths.normalized, "relations.json"))) ?? [];
  const productFamilies = (await readJsonIfExists<SupplierFamilyRecord[]>(join(paths.normalized, "product-families.json"))) ?? [];
  const partitioned = partitionProductDetails(details);
  const normalized = partitioned.accepted.map(normalizeProduct);
  const deduped = dedupeProducts(normalized);
  const previous = await readJsonIfExists<AnCuongProduct[]>(join(paths.normalized, "catalogue.json"));
  const stableProducts = stabilizeUnchangedProducts(deduped.products, previous ?? []);
  const importedAt = partitioned.accepted.map((detail) => detail.fetchedAt).sort().at(-1) ?? new Date(0).toISOString();
  const relationOnlyProducts = buildRelationOnlySkuRecords(
    relations,
    partitioned.rejected,
    new Set(stableProducts.map((product) => product.sourceId).filter((value): value is string => Boolean(value))),
    importedAt,
  );
  const enrichedProductFamilies = enrichProductLineFamilyRecords(productFamilies, partitioned.accepted);
  if (options.dryRun) {
    if (options.verbose) console.log(`Would normalize ${stableProducts.length} detail products and ${relationOnlyProducts.length} relation-only products, reject ${partitioned.rejected.length} invalid source pages (${deduped.duplicates.length} duplicates)`);
    return;
  }
  const acceptedUrls = new Set(partitioned.accepted.map((detail) => detail.sourceUrl));
  await atomicWriteJson(join(paths.normalized, "catalogue.json"), stableProducts);
  await atomicWriteJson(join(paths.normalized, "relation-only-products.json"), relationOnlyProducts);
  await atomicWriteJson(join(paths.normalized, "product-families.json"), enrichedProductFamilies);
  await atomicWriteJson(join(paths.normalized, "categories.json"), buildNormalizedCategories(discovery?.categories ?? [], (listings ?? []).filter((listing) => acceptedUrls.has(listing.sourceUrl))));
  await atomicWriteJson(join(paths.normalized, "taxonomy.json"), buildTaxonomy(stableProducts));
  await atomicWriteJson(join(paths.reports, "duplicate-report.json"), deduped.duplicates);
  await atomicWriteJson(join(paths.reports, "detail-rejections.json"), partitioned.rejected);
}
