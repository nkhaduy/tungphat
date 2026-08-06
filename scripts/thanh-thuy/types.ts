export const thanhThuySeoStatuses = [
  "READY_TO_INDEX",
  "NEEDS_ENRICHMENT",
  "MEDIA_MISSING",
  "DATA_INVALID",
  "DUPLICATE",
  "SOURCE_UNAVAILABLE",
] as const;

export type ThanhThuySeoStatus = (typeof thanhThuySeoStatuses)[number];

export interface SourceCategory {
  id: number;
  name: string;
  slug: string;
  parent: number | null;
  sourceUrl: string;
  count: number;
}

export interface SourceImage {
  sourceUrl: string;
  alt: string;
  mimeType: string;
}

export interface SourceProduct {
  id: number;
  slug: string;
  link: string;
  title: { rendered: string };
  content: { rendered: string };
  excerpt: { rendered: string };
  categories: number[];
  image?: SourceImage;
  modified?: string;
}

export interface WordPressCategory {
  id: number;
  count: number;
  name: string;
  slug: string;
  parent: number;
  link: string;
}

export interface WordPressProduct {
  id: number;
  slug: string;
  link: string;
  modified?: string;
  title?: { rendered?: string };
  content?: { rendered?: string };
  excerpt?: { rendered?: string };
  product_cat?: number[];
  _embedded?: {
    "wp:featuredmedia"?: Array<{
      source_url?: string;
      alt_text?: string;
      mime_type?: string;
    }>;
  };
}

export interface ThanhThuyCategory {
  id: number;
  name: string;
  slug: string;
  parentId: number | null;
  parentSlug: string | null;
  sourceUrl: string;
  productCount: number;
}

export interface ThanhThuyImage {
  src: string;
  sourceUrl?: string;
  mimeType?: string;
  rightsStatus?: "UNCONFIRMED";
  alt: string;
  width: number;
  height: number;
  checksum: string;
  variants: Array<{ src: string; width: number; height: number; checksum: string }>;
}

export interface ThanhThuyProduct {
  id: string;
  sourceId: number;
  slug: string;
  code: string | null;
  name: string;
  supplier: "Thanh Thuỳ";
  sourceName: "Gỗ Thanh Thuỳ";
  categoryId: number | null;
  categoryName: string;
  categorySlug: string;
  seriesId: number | null;
  seriesName: string | null;
  seriesSlug: string | null;
  color: string | null;
  pattern: string | null;
  dimensions: string[];
  thicknesses: string[];
  description: string;
  applications: string[];
  image: ThanhThuyImage | null;
  seoStatus: ThanhThuySeoStatus;
  published: boolean;
  sourceUrl: string;
  sourceUpdatedAt: string | null;
  importedAt: string;
  checksum: string;
}

export interface ThanhThuyCatalog {
  schemaVersion: 1;
  supplier: "Thanh Thuỳ";
  sourceName: "Gỗ Thanh Thuỳ";
  importedAt: string;
  checksum: string;
  categories: ThanhThuyCategory[];
  products: ThanhThuyProduct[];
}

export interface SourceManifest {
  schemaVersion: 1;
  discoveredAt: string;
  robotsUrl: string;
  sitemapIndexUrl: string;
  productSitemaps: string[];
  categorySitemap: string;
  pageSitemap: string;
  catalogSitemap: string;
  productApi: string;
  categoryApi: string;
  productCount: number;
  productUrls: string[];
  productUrlSources: Record<string, string>;
  categoryUrls: string[];
  pageUrls: string[];
  catalogueUrls: string[];
  productApiPages: string[];
  categoryApiPages: string[];
  checksum: string;
}

export interface ImportReport {
  schemaVersion: 1;
  importedAt: string;
  dryRun: boolean;
  sourceProducts: number;
  catalogProducts: number;
  categories: number;
  uniqueSourceImages: number;
  localImages: number;
  created: number;
  updated: number;
  unchanged: number;
  statuses: Record<ThanhThuySeoStatus, number>;
  catalogChecksum: string;
  backup: string | null;
}
