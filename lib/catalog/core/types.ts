export type SupplierId = "thanh-thuy" | "ba-thanh" | "an-cuong";

export type SupplierRecordKind = "product" | "color-code" | "catalogue-item";

export type SupplierDefinition = {
  id: SupplierId;
  displayName: string;
  brandName: string;
  recordKind: SupplierRecordKind;
  brandPath: string;
  cataloguePath: string;
};

export type CatalogSearchEntry = {
  id?: string;
  supplierId: SupplierId;
  supplierName: string;
  kind: SupplierRecordKind;
  recordType?: "sku" | "family" | "document" | "color-code";
  code: string;
  normalizedCode?: string;
  aliases?: string[];
  name: string;
  thumbnail: string;
  canonicalRoute: string;
  category?: string;
  series?: string;
  group?: string;
  material?: string;
  seoStatus?: string;
  indexable?: boolean;
  formats?: string[];
  demandScore?: number;
};

export type CatalogRouteClaim = {
  supplierId: SupplierId;
  path: string;
  kind: "brand" | "catalogue" | "category" | "detail";
  indexable: boolean;
};

export type CatalogSitemapEntry = {
  supplierId: SupplierId;
  path: string;
  indexable: boolean;
  lastModified?: string;
  changeFrequency?: "daily" | "weekly" | "monthly" | "yearly";
  priority?: number;
};

export type SupplierCatalogAdapter = {
  definition: SupplierDefinition;
  getSearchEntries(): CatalogSearchEntry[];
  getRouteClaims(): CatalogRouteClaim[];
  getSitemapEntries(): CatalogSitemapEntry[];
};
