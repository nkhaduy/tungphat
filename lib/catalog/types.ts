export type CatalogCategory = {
  slug: string;
  sourceLabel: string;
};

export type CatalogImage = {
  type: "swatch" | "real-photo" | "application" | "other";
  src: string;
  localPath?: string;
  thumbnailSrc?: string;
  thumbnailWidth?: number;
  thumbnailHeight?: number;
  originalUrl?: string;
  originalPath?: string;
  originalWidth?: number;
  originalHeight?: number;
  originalBytes?: number;
  originalMimeType?: string;
  originalChecksum?: string;
  checksum?: string;
  variant?: string;
  alt: string;
  width?: number;
  height?: number;
};

export type SeoStatus =
  | "READY_TO_INDEX"
  | "NEEDS_ENRICHMENT"
  | "MEDIA_MISSING"
  | "DATA_INVALID"
  | "DUPLICATE"
  | "SOURCE_UNAVAILABLE";

export type SupplierColorCode = {
  id: string;
  supplier: "ba-thanh";
  brandName: "Ba Thanh";
  codeRaw: string;
  codeNormalized: string;
  displayName: string;
  slug: string;
  category: string;
  patternGroup?: string;
  colorFamily?: string;
  substrate?: string;
  dimensions?: Array<{
    widthMm?: number;
    lengthMm?: number;
    thicknessMm?: number;
    raw: string;
  }>;
  surface?: string;
  sourceUrl: string;
  sourceIndexUrl: string;
  sourceImportedAt: string;
  sourceChecksum: string;
  sourceData: Record<string, unknown>;
  images: CatalogImage[];
  sourceDisclaimer?: string;
  editorialDescription?: string;
  applications?: string[];
  relatedServices?: string[];
  seoStatus: SeoStatus;
  published: boolean;
};
