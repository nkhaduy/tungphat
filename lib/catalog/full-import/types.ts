import type { SupplierId } from "../core/types";

export type DiscoveryMethod =
  | "sitemap"
  | "html-link"
  | "api"
  | "pagination"
  | "json-ld"
  | "catalogue-document"
  | "search";

export type SourcePageType =
  | "product"
  | "product-family"
  | "category"
  | "collection"
  | "catalogue"
  | "unknown";

export type SourceLocale = "vi" | "en" | "unknown";

export type SourceOutcome =
  | "imported"
  | "duplicate"
  | "redirected"
  | "removed"
  | "non-product"
  | "invalid"
  | "blocked";

export type EditorialStatus =
  | "READY"
  | "NEEDS_EDITORIAL_REVIEW"
  | "SOURCE_ONLY"
  | "INVALID";

export type SeoStatus =
  | "READY_TO_INDEX"
  | "NOINDEX_USEFUL"
  | "NEEDS_ENRICHMENT"
  | "SOURCE_ONLY"
  | "INVALID";

export type ProductFormat = {
  widthMm?: number;
  lengthMm?: number;
  thicknessMm?: number;
  label?: string;
};

export type CatalogueImage = {
  sourceUrl: string;
  localPath?: string;
  mimeType?: string;
  width?: number;
  height?: number;
  checksum?: string;
  mediaType: "swatch" | "full-sheet" | "product" | "application" | "technical-diagram" | "catalogue-cover" | "other";
  rightsStatus: "UNCONFIRMED";
  importedAt?: string;
};

export type CatalogueDocumentLink = {
  sourceUrl: string;
  localPath?: string;
  title: string;
  mimeType?: string;
  checksum?: string;
};

type CatalogueRecordBase = {
  supplier: SupplierId;
  name: string;
  slug: string;
  category: string;
  images: CatalogueImage[];
  documents: CatalogueDocumentLink[];
  sourceUrls: string[];
  sourceChecksum: string;
  editorialStatus: EditorialStatus;
  seoStatus: SeoStatus;
};

export type SupplierSkuRecord = CatalogueRecordBase & {
  recordType: "sku";
  sourceProductId?: string;
  code: string;
  normalizedCode: string;
  productFamily: string;
  collections: string[];
  attributes: Record<string, string | number | boolean | string[]>;
  formats: ProductFormat[];
  canonicalSourceUrl: string;
  importedAt: string;
  completenessScore: number;
};

export type SupplierFamilyRecord = CatalogueRecordBase & {
  recordType: "family";
  variants?: string[];
  specifications: Record<string, unknown>;
};

export type SupplierDocumentRecord = CatalogueRecordBase & {
  recordType: "document";
  documentType: "catalogue" | "technical-document" | "color-map" | "other";
  needsEditorialReview: boolean;
};

export type CatalogueRecord = SupplierSkuRecord | SupplierFamilyRecord | SupplierDocumentRecord;

export type DiscoveredSourceUrl = {
  supplier: SupplierId;
  url: string;
  canonicalUrl?: string;
  discoveredFrom: DiscoveryMethod;
  sourceParent?: string;
  locale?: SourceLocale;
  pageType: SourcePageType;
  status?: number;
  checksum?: string;
};

export type AccountedSourceRecord = DiscoveredSourceUrl & {
  outcome?: SourceOutcome;
  reason?: string;
  recordIds?: string[];
};

export type FullSourceManifest = {
  schemaVersion: 1;
  supplier: SupplierId;
  generatedAt: string;
  records: AccountedSourceRecord[];
  checksum: string;
};

export type ManifestValidationIssue = {
  code: string;
  message: string;
  url?: string;
};

export type CoverageSummary = {
  totalDiscovered: number;
  accounted: number;
  unaccounted: number;
  coveragePercentage: number;
  outcomes: Partial<Record<SourceOutcome, number>>;
};
