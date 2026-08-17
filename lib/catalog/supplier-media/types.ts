export type SupplierMediaType =
  | "texture"
  | "swatch"
  | "detail"
  | "board"
  | "edge"
  | "room"
  | "application"
  | "other";

export type MediaCandidateSet = {
  src?: string;
  srcset?: string;
  lightboxHref?: string;
  dataFull?: string;
  dataLarge?: string;
  dataOriginal?: string;
  dataZoomImage?: string;
};

export type ResolvedMediaCandidate = {
  selectedUrl: string;
  suspectedCrop: boolean;
  selectionReason: "lightbox" | "data-full" | "data-large" | "data-original" | "zoom" | "srcset" | "src";
};

export type RetainedSupplierMedia = {
  sourceUrl: string;
  selectedUrl: string;
  type: SupplierMediaType;
  checksum: string;
  width: number;
  height: number;
  suspectedCrop: boolean;
};

