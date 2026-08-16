import {
  htmlToText,
  isValidProductRecordUrl,
  slugifyThanhThuy,
  stableChecksum,
} from "./lib";
import type {
  SourceCategory,
  SourceProduct,
  ThanhThuyImage,
  ThanhThuyProduct,
  ThanhThuySeoStatus,
} from "./types";

export interface QualityInput {
  valid: boolean;
  hasImage: boolean;
  hasCode: boolean;
  substantive: boolean;
  duplicate?: boolean;
  sourceAvailable?: boolean;
}

export function classifyQuality(input: QualityInput): ThanhThuySeoStatus {
  if (input.sourceAvailable === false) return "SOURCE_UNAVAILABLE";
  if (input.duplicate) return "DUPLICATE";
  if (!input.valid) return "DATA_INVALID";
  if (!input.hasImage) return "MEDIA_MISSING";
  if (!input.hasCode || !input.substantive) return "NEEDS_ENRICHMENT";
  return "READY_TO_INDEX";
}

export function extractProductCode(title: string, content = ""): string | null {
  const text = htmlToText(title).replace(/[–—-]+/g, " ").replace(/\s+/g, " ").trim().toUpperCase();
  const titleMatch = text.match(/^((?:LP|LE|US|UM|AW|AS|AM|SS|PW|PM|NW|NS|NM)\s+(?:D\d{1,2}[A-Z]?|\d{2,5}(?:\/\d{2,5}[A-Z]{0,3})?[A-Z]{0,3})|D\d{1,2}[A-Z]?|\d{2,5}[A-Z]{0,3})(?=\s|$)/);
  if (titleMatch) return titleMatch[1].replace(/\s*\/\s*/g, "/").replace(/\s+/g, " ");
  const bodyMatch = htmlToText(content).toUpperCase().match(/MÃ SẢN PHẨM\s*:\s*([A-Z]{0,3}\s*(?:D\d{1,2}[A-Z]?|\d{2,5}(?:\/\d{2,5}[A-Z]{0,3})?[A-Z]{0,3}))/);
  return bodyMatch ? bodyMatch[1].replace(/\s*\/\s*/g, "/").replace(/\s+/g, " ").trim() : null;
}

function categoryDepth(category: SourceCategory, byId: Map<number, SourceCategory>): number {
  let depth = 0;
  let current: SourceCategory | undefined = category;
  const visited = new Set<number>();
  while (current?.parent && !visited.has(current.parent)) {
    visited.add(current.parent);
    current = byId.get(current.parent);
    depth += 1;
  }
  return depth;
}

function resolveCategories(product: SourceProduct, categories: SourceCategory[]) {
  const byId = new Map(categories.map((category) => [category.id, category]));
  const assigned = product.categories.map((id) => byId.get(id)).filter((value): value is SourceCategory => Boolean(value));
  const leaf = [...assigned].sort((a, b) => categoryDepth(b, byId) - categoryDepth(a, byId))[0] ?? null;
  let top = leaf;
  const visited = new Set<number>();
  while (top?.parent && !visited.has(top.parent)) {
    visited.add(top.parent);
    top = byId.get(top.parent) ?? top;
  }
  return { top, leaf };
}

function extractFacts(text: string): { dimensions: string[]; thicknesses: string[] } {
  const dimensions = [...text.matchAll(/\b\d{3,4}\s*[x×]\s*\d{3,4}(?:\s*[x×]\s*\d+(?:\.\d+)?)?\s*mm\b/gi)]
    .map((match) => match[0].replace(/\s+/g, " "));
  const thicknesses = [...text.matchAll(/\b\d+(?:\.\d+)?\s*mm\b/gi)]
    .map((match) => match[0].replace(/\s+/g, " "))
    .filter((value) => !dimensions.some((dimension) => dimension.includes(value)));
  return { dimensions: [...new Set(dimensions)], thicknesses: [...new Set(thicknesses)] };
}

function applicationGuidance(categorySlug: string): string[] {
  if (categorySlug === "chi-nep-nhua") return ["Hoàn thiện cạnh ván", "Phối màu bề mặt nội thất"];
  if (categorySlug === "pvc-film") return ["Bề mặt cánh tủ", "Chi tiết nội thất tạo hình"];
  if (categorySlug === "veneer") return ["Bề mặt nội thất", "Vách và đồ gỗ trang trí"];
  return ["Tủ và hệ kệ nội thất", "Bề mặt và vách trang trí"];
}

function normalizeImage(localImage: string | ThanhThuyImage | undefined, product: SourceProduct): ThanhThuyImage | null {
  if (!localImage) return null;
  if (typeof localImage !== "string") {
    return {
      ...localImage,
      sourceUrl: localImage.sourceUrl ?? product.image?.sourceUrl,
      mimeType: localImage.mimeType ?? product.image?.mimeType,
      rightsStatus: "UNCONFIRMED",
      alt: htmlToText(localImage.alt || product.image?.alt || product.title.rendered),
    };
  }
  return {
    src: localImage,
    alt: htmlToText(product.image?.alt || product.title.rendered),
    width: 0,
    height: 0,
    checksum: "",
    variants: [],
  };
}

export interface NormalizeOptions {
  categories: SourceCategory[];
  importedAt: string;
  localImage?: string | ThanhThuyImage;
  duplicate?: boolean;
  sourceAvailable?: boolean;
  slugSuffix?: number;
}

export function normalizeSourceProduct(product: SourceProduct, options: NormalizeOptions): ThanhThuyProduct {
  const name = htmlToText(product.title?.rendered || "");
  const sourceText = htmlToText(product.content?.rendered || "");
  const code = extractProductCode(name, sourceText);
  const { top, leaf } = resolveCategories(product, options.categories);
  const image = normalizeImage(options.localImage, product);
  const valid = Number.isInteger(product.id) && Boolean(name) && Boolean(product.slug) && isValidProductRecordUrl(product.link);
  const substantive = sourceText.length >= 300 || /THÔNG SỐ KỸ THUẬT|MÃ SẢN PHẨM|KÍCH THƯỚC/i.test(sourceText);
  const seoStatus = classifyQuality({
    valid,
    hasImage: Boolean(image),
    hasCode: Boolean(code),
    substantive,
    duplicate: options.duplicate,
    sourceAvailable: options.sourceAvailable,
  });
  const suffix = options.slugSuffix && options.slugSuffix > 1 ? `-${options.slugSuffix}` : "";
  const routeBase = slugifyThanhThuy(name || product.slug) || `source-${product.id}`;
  const facts = extractFacts(sourceText);
  const categoryName = top?.name ?? "Sản phẩm Thanh Thuỳ";
  const categorySlug = top?.slug ?? "thanh-thuy";
  const series = leaf && leaf.id !== top?.id ? leaf : null;
  const color = code ? name.slice(name.toUpperCase().indexOf(code) + code.length).replace(/^\s*[-–—]\s*/, "").trim() || null : null;
  const pattern = series?.name ?? null;
  const checksum = stableChecksum({
    sourceId: product.id,
    sourceUrl: product.link,
    name,
    code,
    categories: product.categories,
    sourceText,
    sourceImage: product.image?.sourceUrl ?? null,
    sourceUpdatedAt: product.modified ?? null,
  });

  return {
    id: `thanh-thuy:${product.id}`,
    sourceId: product.id,
    slug: `thanh-thuy-${routeBase}${suffix}`,
    code,
    name,
    supplier: "Thanh Thuỳ",
    sourceName: "Gỗ Thanh Thuỳ",
    categoryId: top?.id ?? null,
    categoryName,
    categorySlug,
    seriesId: series?.id ?? null,
    seriesName: series?.name ?? null,
    seriesSlug: series?.slug ?? null,
    color,
    pattern,
    dimensions: facts.dimensions,
    thicknesses: facts.thicknesses,
    description: `${name || "Sản phẩm"} thuộc nhóm ${series?.name ?? categoryName} của Thanh Thuỳ. Tùng Phát hỗ trợ kiểm tra mẫu thực tế, quy cách và tình trạng cung ứng trước khi đặt hàng.`,
    applications: applicationGuidance(categorySlug),
    image,
    seoStatus,
    published: valid && Boolean(image) && seoStatus !== "DUPLICATE" && seoStatus !== "SOURCE_UNAVAILABLE",
    sourceUrl: product.link,
    sourceUpdatedAt: product.modified ?? null,
    importedAt: options.importedAt,
    checksum,
  };
}

export function normalizeSourceProducts(
  sourceProducts: SourceProduct[],
  options: { categories: SourceCategory[]; importedAt: string; localImageById: Map<number, string | ThanhThuyImage> },
): ThanhThuyProduct[] {
  const sorted = [...sourceProducts].sort((a, b) => a.id - b.id);
  const seenCodes = new Map<string, number>();
  const seenSlugs = new Map<string, number>();
  return sorted.map((product) => {
    const code = extractProductCode(product.title.rendered, product.content.rendered);
    const codeKey = code?.toUpperCase() ?? null;
    const duplicate = codeKey ? seenCodes.has(codeKey) : false;
    if (codeKey) seenCodes.set(codeKey, (seenCodes.get(codeKey) ?? 0) + 1);
    const base = slugifyThanhThuy(htmlToText(product.title.rendered) || product.slug) || `source-${product.id}`;
    const occurrence = (seenSlugs.get(base) ?? 0) + 1;
    seenSlugs.set(base, occurrence);
    return normalizeSourceProduct(product, {
      categories: options.categories,
      importedAt: options.importedAt,
      localImage: options.localImageById.get(product.id),
      duplicate,
      slugSuffix: occurrence,
    });
  });
}
