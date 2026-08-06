import { checksumFullSourceManifest } from "../../lib/catalog/full-import/manifest";
import type {
  AccountedSourceRecord,
  CatalogueImage,
  CatalogueRecord,
  FullSourceManifest,
  SeoStatus,
} from "../../lib/catalog/full-import/types";
import { normalizeCatalogSearch } from "../../lib/catalog/core/search";
import { stableChecksum } from "./lib";
import type { SourceManifest, ThanhThuyCatalog, ThanhThuyProduct } from "./types";

export const THANH_THUY_DOCUMENT_SOURCES = [
  {
    url: "https://www.gothanhthuy.com/catalog/osb-faced-melamine-2025/",
    title: "OSB Faced Melamine 2025",
    documentType: "catalogue" as const,
    coverSourceUrl: "https://www.gothanhthuy.com/assets/2025/11/catalog_03.webp",
  },
  {
    url: "https://www.gothanhthuy.com/catalog/mfc-woodgrain-collection-2025/",
    title: "MFC Woodgrain Collection 2025",
    documentType: "catalogue" as const,
    coverSourceUrl: "https://www.gothanhthuy.com/assets/2025/11/catalog_02.webp",
  },
  {
    url: "https://www.gothanhthuy.com/catalog/finger-joint-board-2025/",
    title: "Finger Joint Board 2025",
    documentType: "catalogue" as const,
    coverSourceUrl: "https://www.gothanhthuy.com/assets/2025/11/catalog_01.webp",
  },
  {
    url: "https://www.gothanhthuy.com/catalog/melamine-decor-exquisite-2024/",
    title: "Melamine Decor Exquisite 2024",
    documentType: "catalogue" as const,
    coverSourceUrl: "https://www.gothanhthuy.com/assets/2025/11/Thanh-Thuy-MELAMINE-E-CTL-2024-1-scaled.webp",
  },
  {
    url: "https://www.gothanhthuy.com/colormap/",
    title: "Bản đồ màu Thanh Thuỳ",
    documentType: "color-map" as const,
    coverSourceUrl: "https://www.gothanhthuy.com/assets/2025/11/catalog_03.webp",
  },
] as const;

function canonicalUrl(value: string): string {
  return new URL(value).toString();
}

function recordId(record: CatalogueRecord): string {
  if (record.recordType === "sku") return `thanh-thuy:sku:${record.sourceProductId ?? record.normalizedCode}`;
  return `thanh-thuy:${record.recordType}:${record.slug}`;
}

function recordImages(product: ThanhThuyProduct): CatalogueImage[] {
  if (!product.image?.sourceUrl) return [];
  return [{
    sourceUrl: product.image.sourceUrl,
    localPath: product.image.src,
    mimeType: product.image.mimeType,
    width: product.image.width,
    height: product.image.height,
    checksum: product.image.checksum,
    mediaType: "swatch",
    rightsStatus: "UNCONFIRMED",
    importedAt: product.importedAt,
  }];
}

function productSeoStatus(product: ThanhThuyProduct): SeoStatus {
  if (product.seoStatus === "READY_TO_INDEX") return "READY_TO_INDEX";
  if (product.seoStatus === "DATA_INVALID") return "INVALID";
  return product.code ? "NEEDS_ENRICHMENT" : "NOINDEX_USEFUL";
}

function productAttributes(product: ThanhThuyProduct): Record<string, string | number | boolean | string[]> {
  const attributes: Record<string, string | number | boolean | string[]> = {};
  if (product.color) attributes.color = product.color;
  if (product.pattern) attributes.pattern = product.pattern;
  if (product.dimensions.length) attributes.dimensions = product.dimensions;
  if (product.thicknesses.length) attributes.thicknesses = product.thicknesses;
  if (product.seriesName) attributes.series = product.seriesName;
  return attributes;
}

export function buildThanhThuyCatalogueRecords(catalog: ThanhThuyCatalog): CatalogueRecord[] {
  const productRecords: CatalogueRecord[] = catalog.products.map((product) => {
    const common = {
      supplier: "thanh-thuy" as const,
      name: product.name,
      slug: product.slug,
      category: product.categoryName,
      images: recordImages(product),
      documents: [],
      sourceUrls: [product.sourceUrl],
      sourceChecksum: product.checksum,
      editorialStatus: product.code ? "READY" as const : "NEEDS_EDITORIAL_REVIEW" as const,
      seoStatus: productSeoStatus(product),
    };
    if (!product.code) {
      return {
        ...common,
        recordType: "family" as const,
        variants: [...new Set([...product.dimensions, ...product.thicknesses])],
        specifications: productAttributes(product),
      };
    }
    return {
      ...common,
      recordType: "sku" as const,
      sourceProductId: String(product.sourceId),
      code: product.code,
      normalizedCode: normalizeCatalogSearch(product.code),
      productFamily: product.seriesName ?? product.categoryName,
      collections: product.seriesName ? [product.seriesName] : [],
      attributes: productAttributes(product),
      formats: [
        ...product.dimensions.map((label) => ({ label })),
        ...product.thicknesses.map((label) => ({ label })),
      ],
      canonicalSourceUrl: product.sourceUrl,
      importedAt: product.importedAt,
      completenessScore: Math.min(100, 55 + (product.image ? 20 : 0) + (product.description ? 15 : 0) + (product.dimensions.length ? 10 : 0)),
    };
  });

  const documentRecords: CatalogueRecord[] = THANH_THUY_DOCUMENT_SOURCES.map((source) => ({
    recordType: "document",
    supplier: "thanh-thuy",
    name: source.title,
    slug: source.url.split("/").filter(Boolean).at(-1) ?? "catalogue",
    category: source.documentType === "color-map" ? "Color Map" : "Catalogue",
    images: [{
      sourceUrl: source.coverSourceUrl,
      mediaType: "catalogue-cover",
      rightsStatus: "UNCONFIRMED",
    }],
    documents: [{ sourceUrl: source.url, title: source.title, mimeType: "text/html" }],
    sourceUrls: [source.url],
    sourceChecksum: stableChecksum(source),
    editorialStatus: "SOURCE_ONLY",
    seoStatus: "SOURCE_ONLY",
    documentType: source.documentType,
    needsEditorialReview: true,
  }));

  return [...productRecords, ...documentRecords];
}

export function reconcileThanhThuyProductSources(
  products: Array<{ sourceUrl: string }>,
  productUrls: string[],
  evidence: SourceManifest["productUrlEvidence"],
): { matched: number; apiOnly: string[]; sitemapOnly: string[] } {
  const api = new Set(products.map((product) => canonicalUrl(product.sourceUrl)));
  const accountedCanonicalUrls = new Set(
    productUrls
      .map((url) => evidence[url])
      .filter((item) => item?.status === 200)
      .map((item) => canonicalUrl(item.canonicalUrl)),
  );
  return {
    matched: [...api].filter((url) => accountedCanonicalUrls.has(url)).length,
    apiOnly: [...api].filter((url) => !accountedCanonicalUrls.has(url)).sort(),
    sitemapOnly: productUrls.filter((url) => {
      const item = evidence[url];
      return !item || item.status !== 200 || !api.has(canonicalUrl(item.canonicalUrl));
    }).sort(),
  };
}

function nonProduct(url: string, discoveredFrom: AccountedSourceRecord["discoveredFrom"], reason: string, sourceParent?: string): AccountedSourceRecord {
  return {
    supplier: "thanh-thuy",
    url,
    discoveredFrom,
    sourceParent,
    locale: "vi",
    pageType: "unknown",
    outcome: "non-product",
    reason,
  };
}

export function buildThanhThuyFullSourceManifest(options: {
  sourceManifest: SourceManifest;
  catalog: ThanhThuyCatalog;
  generatedAt?: string;
}): FullSourceManifest {
  const { sourceManifest, catalog } = options;
  const catalogueRecords = buildThanhThuyCatalogueRecords(catalog);
  const bySourceUrl = new Map<string, CatalogueRecord>();
  for (const record of catalogueRecords) {
    for (const url of record.sourceUrls) bySourceUrl.set(canonicalUrl(url), record);
  }
  const categoryIds = new Map(
    catalog.categories.map((category) => [canonicalUrl(category.sourceUrl), `thanh-thuy:category:${category.slug}`]),
  );
  const records: AccountedSourceRecord[] = [];

  for (const url of sourceManifest.productUrls) {
    const normalized = canonicalUrl(url);
    const evidence = sourceManifest.productUrlEvidence[url];
    const canonicalSourceUrl = evidence?.canonicalUrl;
    const record = canonicalSourceUrl ? bySourceUrl.get(canonicalUrl(canonicalSourceUrl)) : undefined;
    const redirected = Boolean(record && evidence?.redirects.length);
    const verified = Boolean(record && evidence?.status === 200);
    records.push({
      supplier: "thanh-thuy",
      url,
      canonicalUrl: canonicalSourceUrl ? canonicalUrl(canonicalSourceUrl) : normalized,
      discoveredFrom: "sitemap",
      sourceParent: sourceManifest.productUrlSources[url],
      locale: "vi",
      pageType: "product",
      status: evidence?.status,
      checksum: evidence ? stableChecksum(evidence) : undefined,
      outcome: verified ? (redirected ? "redirected" : "imported") : "invalid",
      reason: verified
        ? (redirected ? "Sitemap alias redirects to the canonical public WordPress product URL." : undefined)
        : "Sitemap product URL lacks verified HTTP 200 evidence matching a public WordPress REST record.",
      recordIds: verified && record ? [recordId(record)] : undefined,
    });
  }
  for (const url of sourceManifest.categoryUrls) {
    const categoryId = categoryIds.get(canonicalUrl(url));
    records.push({
      supplier: "thanh-thuy",
      url,
      discoveredFrom: "sitemap",
      sourceParent: sourceManifest.categorySitemap,
      locale: "vi",
      pageType: "category",
      outcome: categoryId ? "imported" : "invalid",
      reason: categoryId ? undefined : "Category sitemap URL has no matching non-empty REST category.",
      recordIds: categoryId ? [categoryId] : undefined,
    });
  }
  for (const url of sourceManifest.catalogueUrls) {
    const record = bySourceUrl.get(canonicalUrl(url));
    records.push({
      supplier: "thanh-thuy",
      url,
      discoveredFrom: "catalogue-document",
      sourceParent: sourceManifest.catalogSitemap,
      locale: "vi",
      pageType: "catalogue",
      outcome: record ? "imported" : "invalid",
      reason: record ? undefined : "Catalogue sitemap URL has no source-only document record.",
      recordIds: record ? [recordId(record)] : undefined,
    });
  }

  const existingUrls = new Set(records.map((record) => canonicalUrl(record.url)));
  for (const url of sourceManifest.pageUrls) {
    if (existingUrls.has(canonicalUrl(url))) continue;
    const pathname = new URL(url).pathname;
    const record = bySourceUrl.get(canonicalUrl(url));
    if (record) {
      records.push({
        supplier: "thanh-thuy",
        url,
        discoveredFrom: "sitemap",
        sourceParent: sourceManifest.pageSitemap,
        locale: "vi",
        pageType: "catalogue",
        outcome: "imported",
        recordIds: [recordId(record)],
      });
    } else if (pathname === "/products/") {
      records.push({
        supplier: "thanh-thuy",
        url,
        discoveredFrom: "sitemap",
        sourceParent: sourceManifest.pageSitemap,
        locale: "vi",
        pageType: "collection",
        outcome: "imported",
        recordIds: [...categoryIds.values()].sort(),
      });
    } else if (pathname === "/catalog/") {
      records.push({
        supplier: "thanh-thuy",
        url,
        discoveredFrom: "sitemap",
        sourceParent: sourceManifest.pageSitemap,
        locale: "vi",
        pageType: "collection",
        outcome: "imported",
        recordIds: catalogueRecords.filter((item) => item.recordType === "document").map(recordId).sort(),
      });
    } else {
      records.push(nonProduct(url, "sitemap", "Public page is not a supplier catalogue product, category, or document.", sourceManifest.pageSitemap));
    }
  }

  const productRecordIds = catalog.products.map((product) => {
    const record = bySourceUrl.get(canonicalUrl(product.sourceUrl));
    if (!record) throw new Error(`Missing normalized Thanh Thuy record for ${product.sourceUrl}`);
    return recordId(record);
  });
  sourceManifest.productApiPages.forEach((url, index) => {
    records.push({
      supplier: "thanh-thuy",
      url,
      discoveredFrom: index === 0 ? "api" : "pagination",
      sourceParent: sourceManifest.productApi,
      locale: "vi",
      pageType: "collection",
      outcome: "imported",
      recordIds: productRecordIds.slice(index * 100, (index + 1) * 100),
    });
  });
  for (const url of sourceManifest.categoryApiPages) {
    records.push({
      supplier: "thanh-thuy",
      url,
      discoveredFrom: "api",
      sourceParent: sourceManifest.categoryApi,
      locale: "vi",
      pageType: "collection",
      outcome: "imported",
      recordIds: [...categoryIds.values()].sort(),
    });
  }
  records.push(
    nonProduct(sourceManifest.robotsUrl, "html-link", "Discovery infrastructure; not a catalogue record."),
    nonProduct(sourceManifest.sitemapIndexUrl, "sitemap", "Sitemap discovery infrastructure; child URLs are accounted separately."),
    ...sourceManifest.productSitemaps.map((url) => nonProduct(url, "sitemap", "Product sitemap infrastructure; contained product URLs are accounted separately.", sourceManifest.sitemapIndexUrl)),
    nonProduct(sourceManifest.categorySitemap, "sitemap", "Category sitemap infrastructure; contained category URLs are accounted separately.", sourceManifest.sitemapIndexUrl),
    nonProduct(sourceManifest.pageSitemap, "sitemap", "Page sitemap infrastructure; contained page URLs are accounted separately.", sourceManifest.sitemapIndexUrl),
    nonProduct(sourceManifest.catalogSitemap, "sitemap", "Catalogue sitemap infrastructure; contained catalogue URLs are accounted separately.", sourceManifest.sitemapIndexUrl),
    nonProduct(sourceManifest.productApi, "api", "API collection endpoint; paginated request URLs are accounted separately."),
    nonProduct(sourceManifest.categoryApi, "api", "API collection endpoint; paginated request URLs are accounted separately."),
  );

  const manifest: FullSourceManifest = {
    schemaVersion: 1,
    supplier: "thanh-thuy",
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    records,
    checksum: "",
  };
  manifest.checksum = checksumFullSourceManifest(manifest);
  return manifest;
}
