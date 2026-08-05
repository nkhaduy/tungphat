export const ANCUONG_SOURCE_ROOT =
  "https://ancuong.com/online-catalogue/catalogue-vat-lieu.html";
export const ANCUONG_SCHEMA_VERSION = "1.0.0";
export const ANCUONG_PARSER_VERSION = "1.0.0";

export type ProductStatus =
  | "active"
  | "changed"
  | "missing"
  | "invalid"
  | "duplicate"
  | "source-unavailable";

export type ContentUsageStatus =
  | "technical-data"
  | "reference-only"
  | "requires-rewrite"
  | "do-not-publish";

export type CheckpointStatus =
  | "discovered"
  | "queued"
  | "fetching"
  | "fetched"
  | "parsed"
  | "normalized"
  | "media-complete"
  | "failed-retryable"
  | "failed-final";

export interface AnCuongMedia {
  sourceUrl: string;
  localPath?: string;
  originalFilename?: string;
  mimeType?: string;
  width?: number;
  height?: number;
  bytes?: number;
  sha256?: string;
  alt?: string;
}

export type RelationType =
  | "same-color"
  | "same-line"
  | "application"
  | "edge-band"
  | "related";

export interface AnCuongProductRelation {
  relationType: RelationType;
  sourceUrl?: string;
  sourceId?: string;
  productCode?: string;
  name?: string;
}

export interface DimensionThickness {
  dimension: string;
  thicknesses: string[];
}

export interface SourceDescription {
  value: string;
  classification: "FACTUAL_DATA" | "TECHNICAL_DATA" | "SOURCE_MARKETING_COPY";
  contentUsageStatus: ContentUsageStatus;
}

export interface AnCuongProduct {
  source: "ancuong";
  brand: "An Cường";
  supplierSource: "An Cường";
  sourceUrl: string;
  sourceId?: string;
  sourceCategoryUrl?: string;
  name: string;
  productCode: string;
  normalizedProductCode: string;
  category: string;
  categorySlug: string;
  productType?: string;
  productLine?: string;
  dimensions: string[];
  thicknesses?: string[];
  dimensionThicknessMatrix?: DimensionThickness[];
  materialPattern?: string;
  woodPatternType?: string;
  fabricPatternType?: string;
  stonePatternType?: string;
  otherPatternType?: string;
  colors: string[];
  surfaces: string[];
  surfaceEffects: string[];
  specialFeatures: string[];
  collections: string[];
  solutions: string[];
  edgeBandingTypes: string[];
  profiles: string[];
  priceGroup?: string;
  standards: string[];
  features: string[];
  descriptions: {
    sourceShort?: string;
    sourceTechnical?: string;
  };
  contentUsageStatus: ContentUsageStatus;
  sourceContent?: SourceDescription[];
  sourceFacets?: Record<string, string[]>;
  primaryImage?: AnCuongMedia;
  gallery: AnCuongMedia[];
  relatedProducts: AnCuongProductRelation[];
  sameColorProducts: AnCuongProductRelation[];
  applicationProducts: AnCuongProductRelation[];
  technicalWarnings?: string[];
  discoveredAt: string;
  fetchedAt: string;
  sourceUpdatedAt?: string;
  sourceHash: string;
  normalizedHash: string;
  parserVersion: string;
  status: ProductStatus;
}

export interface CategoryRecord {
  name: string;
  slug: string;
  sourceUrl: string;
  catalogueUrls: string[];
  productCount?: number;
}

export interface ListingProduct {
  sourceUrl: string;
  sourceId: string;
  category: string;
  categorySlug: string;
  productCode: string;
  name: string;
  imageUrl?: string;
  facetKeys: Record<string, string[]>;
}

export interface RawProductDetail {
  sourceUrl: string;
  sourceId: string;
  category: string;
  categorySlug: string;
  name: string;
  productCode: string;
  facets: Record<string, string[]>;
  primaryImageUrl?: string;
  galleryUrls: string[];
  relatedProducts: AnCuongProductRelation[];
  sameColorProducts: AnCuongProductRelation[];
  applicationProducts: AnCuongProductRelation[];
  productLines: Array<{
    name: string;
    sourceUrl?: string;
    description?: string;
    features: string[];
    standards: string[];
    dimensionThicknessMatrix: DimensionThickness[];
    technicalWarnings: string[];
  }>;
  sourceContent?: SourceDescription[];
  sourceHash: string;
  discoveredAt: string;
  fetchedAt: string;
}

export interface DiscoveryManifest {
  schemaVersion: string;
  parserVersion: string;
  sourceRoot: string;
  generatedAt: string;
  categories: CategoryRecord[];
  productUrls: string[];
  duplicateUrls: string[];
  excludedUrls: string[];
}

export interface CliOptions {
  dryRun: boolean;
  resume: boolean;
  force: boolean;
  category?: string;
  product?: string;
  limit?: number;
  concurrency: number;
  changedOnly: boolean;
  manifestOnly?: boolean;
  skipMedia: boolean;
  verbose: boolean;
}

export type DiffClassification =
  | "NEW"
  | "UPDATED"
  | "UNCHANGED"
  | "MISSING_FROM_SOURCE"
  | "INVALID"
  | "DUPLICATE"
  | "RELATION_CHANGED"
  | "MEDIA_CHANGED";

export interface DiffRecord {
  key: string;
  classification: DiffClassification;
  sourceUrl?: string;
  productCode?: string;
  details?: string[];
}

export interface FetchMetadata {
  url: string;
  status: number;
  fetchedAt: string;
  etag?: string;
  lastModified?: string;
  contentType?: string;
  contentHash: string;
  parserVersion: string;
}
