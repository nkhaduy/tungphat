import type { SeoStatus } from "../full-import/types";

export type CatalogueRecordPurpose =
  | "color-code"
  | "product-family"
  | "technical"
  | "document"
  | "other";

export type SupplierColorCodeSupplier =
  | "an-cuong"
  | "thanh-thuy"
  | "ba-thanh";

export type SupplierColorMaterialType =
  | "melamine"
  | "laminate"
  | "acrylic"
  | "veneer"
  | "ppet"
  | "pvc"
  | "worktop"
  | "flooring"
  | "edge-banding"
  | "panel"
  | "other-decorative";

export type ColorCodeEvidence =
  | "official-color-map"
  | "decorative-product-detail"
  | "matching-color";

export type SupplierColorImageRole =
  | "swatch"
  | "fullsheet"
  | "actual-photo"
  | "product"
  | "application";

export type SupplierColorImage = {
  role: SupplierColorImageRole;
  sourceUrl: string;
  localPath?: string;
  mimeType?: string;
  width?: number;
  height?: number;
  checksum?: string;
  rightsStatus: "UNCONFIRMED";
};

export type SupplierColorCode = {
  recordType: "color-code";
  supplier: SupplierColorCodeSupplier;
  codeRaw: string;
  codeNormalized: string;
  searchAliases: string[];
  displayName?: string;
  materialType: SupplierColorMaterialType;
  patternType?: string;
  colorFamily?: string;
  surfaceEffect?: string;
  collection?: string;
  sourceUrl: string;
  sourceColorMapUrl?: string;
  sourceUrls: string[];
  images: SupplierColorImage[];
  searchable: true;
  colorCodeEvidence: ColorCodeEvidence;
  confidence: "verified";
  seoStatus: Extract<SeoStatus, "READY_TO_INDEX" | "NOINDEX_USEFUL" | "NEEDS_ENRICHMENT">;
};

export type PublicSupplierColorCode = SupplierColorCode & {
  id: string;
  slug: string;
  canonicalRoute: string;
  demandScore: number;
};
