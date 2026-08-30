import fs from "node:fs";
import path from "node:path";
import { resolveMediaSrcSet, resolveMediaUrl } from "@/lib/media";

export type ThanhThuySeoStatus =
  | "READY_TO_INDEX"
  | "NEEDS_ENRICHMENT"
  | "MEDIA_MISSING"
  | "DATA_INVALID"
  | "DUPLICATE"
  | "SOURCE_UNAVAILABLE";

export type ThanhThuyProduct = {
  id?: string | number;
  slug: string;
  code: string;
  name: string;
  categorySlug: string;
  categoryName: string;
  seriesSlug?: string;
  seriesName?: string;
  image: string;
  imageAlt: string;
  imageWidth?: number;
  imageHeight?: number;
  imageSrcSet?: string;
  description: string;
  applications: string[];
  selectionGuidance?: string;
  dimensions?: string[];
  thicknesses?: string[];
  color?: string;
  pattern?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoStatus: ThanhThuySeoStatus;
  published: boolean;
  price?: number | null;
  priceCurrency?: string;
  availability?: string;
  sourceName?: string;
  sourceUrl: string;
};

export type ThanhThuyCategory = {
  slug: string;
  name: string;
  parentSlug?: string;
  description: string;
  characteristics?: string[];
  applications?: string[];
  selectionGuidance?: string;
  faq?: Array<{ question: string; answer: string }>;
  productCount: number;
};

export type ThanhThuyCatalog = {
  supplier: string;
  sourceName: string;
  importedAt?: string;
  categories: ThanhThuyCategory[];
  products: ThanhThuyProduct[];
};

type UnknownRecord = Record<string, unknown>;

const CATALOG_PATH = path.join(
  process.cwd(),
  "data",
  "catalogs",
  "thanh-thuy",
  "catalog.json",
);

function objectValue(value: unknown): UnknownRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as UnknownRecord)
    : {};
}

function stringValue(...values: unknown[]): string {
  return values.find((value) => typeof value === "string" && value.trim())?.toString().trim() ?? "";
}

function optionalNumber(...values: unknown[]): number | undefined {
  const value = values.find(
    (candidate) => typeof candidate === "number" && Number.isFinite(candidate),
  );
  return typeof value === "number" ? value : undefined;
}

function stringList(...values: unknown[]): string[] {
  for (const value of values) {
    if (Array.isArray(value)) {
      return value
        .map((item) => stringValue(item))
        .filter(Boolean);
    }
    if (typeof value === "string" && value.trim()) {
      return value
        .split(/[,;|\n]/)
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }
  return [];
}

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeStatus(value: unknown): ThanhThuySeoStatus {
  const status = stringValue(value).toUpperCase();
  const allowed: ThanhThuySeoStatus[] = [
    "READY_TO_INDEX",
    "NEEDS_ENRICHMENT",
    "MEDIA_MISSING",
    "DATA_INVALID",
    "DUPLICATE",
    "SOURCE_UNAVAILABLE",
  ];
  return allowed.includes(status as ThanhThuySeoStatus)
    ? (status as ThanhThuySeoStatus)
    : "NEEDS_ENRICHMENT";
}

function normalizeProduct(value: unknown): ThanhThuyProduct | undefined {
  const raw = objectValue(value);
  const category = objectValue(raw.category);
  const series = objectValue(raw.series);
  const image = objectValue(raw.image);
  const code = stringValue(raw.code, raw.productCode, raw.sku);
  const name = stringValue(raw.name, raw.title, code);
  const categoryName = stringValue(
    raw.categoryName,
    category.name,
    raw.topLevelCategoryName,
    "Sản phẩm Thanh Thùy",
  );
  const categorySlug = stringValue(
    raw.categorySlug,
    category.slug,
    raw.topLevelCategorySlug,
    slugify(categoryName),
  );
  const slug = stringValue(
    raw.slug,
    raw.routeSlug,
    raw.productSlug,
    slugify(["thanh-thuy", code, name].filter(Boolean).join(" ")),
  );
  if (!slug || !name || !categorySlug) return undefined;

  const price = optionalNumber(raw.price);
  const imageVariants = Array.isArray(image.variants)
    ? image.variants.map(objectValue).map((variant) => ({ src: resolveMediaUrl(stringValue(variant.src)), width: optionalNumber(variant.width) })).filter((variant) => variant.src && variant.width)
    : [];
  const imageReference = stringValue(
    raw.imagePath,
    raw.localImage,
    image.path,
    image.src,
    image.publicPath,
  );
  return {
    id:
      typeof raw.id === "string" || typeof raw.id === "number"
        ? raw.id
        : undefined,
    slug,
    code,
    name,
    categorySlug,
    categoryName,
    seriesSlug: stringValue(raw.seriesSlug, series.slug) || undefined,
    seriesName: stringValue(raw.seriesName, series.name) || undefined,
    image: resolveMediaUrl(imageReference),
    imageAlt: stringValue(raw.imageAlt, image.alt, `Mẫu ${name}`),
    imageWidth: optionalNumber(raw.imageWidth, image.width),
    imageHeight: optionalNumber(raw.imageHeight, image.height),
    imageSrcSet: imageVariants.length ? resolveMediaSrcSet(imageVariants.map((variant) => `${variant.src} ${variant.width}w`).join(", ")) : undefined,
    description: stringValue(
      raw.description,
      raw.originalDescription,
      `Thông tin mã ${code || name} được Tùng Phát tổng hợp để khách hàng tham khảo trước khi kiểm tra mẫu và quy cách thực tế.`,
    ),
    applications: stringList(raw.applications, raw.applicationGuidance),
    selectionGuidance:
      stringValue(raw.selectionGuidance, raw.serviceGuidance) || undefined,
    dimensions: stringList(raw.dimensions, raw.sizes),
    thicknesses: stringList(raw.thicknesses, raw.thickness),
    color: stringValue(raw.color, raw.colorName) || undefined,
    pattern: stringValue(raw.pattern, raw.patternName) || undefined,
    seoTitle: stringValue(raw.seoTitle) || undefined,
    seoDescription: stringValue(raw.seoDescription) || undefined,
    seoStatus: normalizeStatus(raw.seoStatus ?? raw.qualityStatus ?? raw.status),
    published: raw.published !== false,
    price: price ?? null,
    priceCurrency: stringValue(raw.priceCurrency) || undefined,
    availability: stringValue(raw.availability) || undefined,
    sourceName: stringValue(raw.sourceName) || undefined,
    sourceUrl: stringValue(raw.sourceUrl),
  };
}

function normalizeCategory(
  value: unknown,
  products: ThanhThuyProduct[],
): ThanhThuyCategory | undefined {
  const raw = objectValue(value);
  const name = stringValue(raw.name, raw.title);
  const slug = stringValue(raw.slug, slugify(name));
  if (!name || !slug) return undefined;
  return {
    slug,
    name,
    parentSlug: stringValue(raw.parentSlug, objectValue(raw.parent).slug) || undefined,
    description: stringValue(raw.description),
    characteristics: stringList(raw.characteristics),
    applications: stringList(raw.applications),
    selectionGuidance: stringValue(raw.selectionGuidance) || undefined,
    faq: Array.isArray(raw.faq)
      ? raw.faq
          .map((item) => objectValue(item))
          .map((item) => ({
            question: stringValue(item.question),
            answer: stringValue(item.answer),
          }))
          .filter((item) => item.question && item.answer)
      : undefined,
    productCount: products.filter(
      (product) =>
        product.categorySlug === slug || product.seriesSlug === slug,
    ).length,
  };
}

function deriveCategories(products: ThanhThuyProduct[]): ThanhThuyCategory[] {
  const categories = new Map<string, ThanhThuyCategory>();
  for (const product of products) {
    for (const item of [
      { slug: product.categorySlug, name: product.categoryName },
      product.seriesSlug && product.seriesName
        ? { slug: product.seriesSlug, name: product.seriesName }
        : undefined,
    ]) {
      if (!item || categories.has(item.slug)) continue;
      categories.set(item.slug, {
        ...item,
        description: "",
        productCount: products.filter(
          (candidate) =>
            candidate.categorySlug === item.slug ||
            candidate.seriesSlug === item.slug,
        ).length,
      });
    }
  }
  return [...categories.values()];
}

function readCatalog(): ThanhThuyCatalog {
  let raw: unknown = {};
  try {
    raw = JSON.parse(fs.readFileSync(CATALOG_PATH, "utf8"));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  const root = objectValue(raw);
  const rawProducts = Array.isArray(raw) ? raw : root.products;
  const products = (Array.isArray(rawProducts) ? rawProducts : [])
    .map(normalizeProduct)
    .filter((product): product is ThanhThuyProduct => Boolean(product));
  const configuredCategories = (Array.isArray(root.categories)
    ? root.categories
    : []
  )
    .map((category) => normalizeCategory(category, products))
    .filter((category): category is ThanhThuyCategory => Boolean(category));
  const derivedCategories = deriveCategories(products);
  const categoryMap = new Map(
    [...derivedCategories, ...configuredCategories].map((category) => [
      category.slug,
      category,
    ]),
  );
  return {
    supplier: stringValue(root.supplier, "Thanh Thùy"),
    sourceName: stringValue(root.sourceName, "Gỗ Thanh Thuỳ"),
    importedAt: stringValue(root.importedAt, root.generatedAt) || undefined,
    categories: [...categoryMap.values()],
    products,
  };
}

export function getThanhThuyCatalog(): ThanhThuyCatalog {
  return readCatalog();
}

export function getThanhThuyCategories(): ThanhThuyCategory[] {
  return getThanhThuyCatalog().categories;
}

export function getThanhThuyTopCategories(): ThanhThuyCategory[] {
  const order = ["laminate", "melamine", "acrylic", "pvc-film", "veneer", "chi-nep-nhua"];
  return getThanhThuyCategories()
    .filter((category) => !category.parentSlug)
    .sort((left, right) => order.indexOf(left.slug) - order.indexOf(right.slug));
}

export function getThanhThuyCategory(slug: string): ThanhThuyCategory | undefined {
  return getThanhThuyCategories().find((category) => category.slug === slug);
}

export function getThanhThuyProductsForCategory(
  slug: string,
): ThanhThuyProduct[] {
  return getThanhThuyCatalog().products.filter(
    (product) =>
      product.categorySlug === slug || product.seriesSlug === slug,
  );
}

export function getThanhThuyProduct(
  categorySlug: string,
  productSlug: string,
): ThanhThuyProduct | undefined {
  return getThanhThuyProductsForCategory(categorySlug).find(
    (product) => product.slug === productSlug,
  );
}

export function isThanhThuyIndexable(product: ThanhThuyProduct): boolean {
  return product.published && product.seoStatus === "READY_TO_INDEX";
}

export function getThanhThuyIndexableProducts(): ThanhThuyProduct[] {
  return getThanhThuyCatalog().products.filter(isThanhThuyIndexable);
}

export function thanhThuyPath(
  categorySlug?: string,
  productSlug?: string,
): string {
  if (!categorySlug) return "/thuong-hieu/thanh-thuy/";
  if (!productSlug) return `/san-pham/${categorySlug}/`;
  return `/san-pham/${categorySlug}/${productSlug}/`;
}
