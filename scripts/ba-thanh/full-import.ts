import { createHash } from "node:crypto";
import type {
  AccountedSourceRecord,
  CatalogueImage,
  CatalogueRecord,
  DiscoveredSourceUrl,
  FullSourceManifest,
  SupplierFamilyRecord,
} from "@/lib/catalog/full-import/types";
import { checksumFullSourceManifest } from "@/lib/catalog/full-import/manifest";
import type { CatalogImage, SupplierColorCode } from "@/lib/catalog/types";

export type BaThanhFullSourceItem = {
  materialType?: "melamine" | "laminate";
  sourceUrl: string;
  sourceImageUrl?: string;
  category: string;
  sourceCategoryLabel: string;
  codeRaw: string;
  codeNormalized: string;
  displayName: string;
  slug: string;
  confident: boolean;
  status: "PARSED" | "REJECTED" | "FAILED";
  heading?: string;
  text?: string;
  images?: string[];
  discoveredAt: string;
  pageChecksum?: string;
};

export type BaThanhSourceClassification = {
  outcome: "imported" | "duplicate" | "non-product" | "blocked";
  reason: string;
  canonicalUrl?: string;
  canonicalUrls?: string[];
  recordIds?: string[];
  recordGroup?: "melamine" | "laminate" | "families" | "all";
  recordCode?: string;
  evidence: {
    kind: "http-html" | "api-record" | "infrastructure";
    status: number;
    checksum: string;
  };
};

export type BaThanhDiscoveredSourceUrl = DiscoveredSourceUrl & {
  classification?: BaThanhSourceClassification;
};

type MediaMetadata = {
  sourceUrl: string;
  localPath: string;
  mimeType: string;
  width?: number;
  height?: number;
  checksum: string;
  importedAt: string;
};

const FAMILY_SOURCES = [
  {
    name: "Ván MDF",
    slug: "van-mdf",
    category: "MDF/HDF",
    sourceUrl: "https://bathanh.com.vn/portfolio/gioi-thieu-qui-cach-van-mdf",
    imageUrl: "https://bathanh.com.vn/wp-content/uploads/2017/07/QUICACH.jpg",
    variants: ["MDF thường"],
    specifications: {
      availableThicknessesMm: [3, 5, 9, 12, 15, 17, 25],
      thicknessRangeMm: [2.5, 25],
    },
  },
  {
    name: "Ván HDF",
    slug: "van-hdf",
    category: "MDF/HDF",
    sourceUrl: "https://bathanh.com.vn/portfolio/van-mdf-hdf",
    imageUrl: "https://bathanh.com.vn/wp-content/uploads/2019/03/all-new.jpg",
    variants: ["HDF"],
    specifications: {
      thicknessRangeMm: [2.5, 25],
      sourceDefinition: "Ván gỗ ép có tỉ trọng cao",
    },
  },
  {
    name: "Ván MDF chống ẩm HMR",
    slug: "van-mdf-chong-am-hmr",
    category: "MDF/HDF",
    sourceUrl: "https://bathanh.com.vn/phan-biet-hdf-va-mdf-loi-xanh.html",
    imageUrl: "https://bathanh.com.vn/wp-content/uploads/2019/03/all-new.jpg",
    variants: ["HMR", "MMR", "LMR"],
    specifications: {
      material: "MDF kháng ẩm",
      sourceAliases: ["HMR", "MMR", "LMR"],
    },
  },
  {
    name: "Ván gỗ ghép",
    slug: "van-go-ghep",
    category: "Gỗ ghép",
    sourceUrl: "https://bathanh.com.vn/portfolio/van-go-ghep",
    imageUrl: "https://bathanh.com.vn/wp-content/uploads/2019/07/home-1680800.jpg",
    variants: ["Cao su", "Thông", "Tràm", "Xoan mộc"],
    specifications: {
      woodSpecies: ["Cao su", "Thông", "Tràm", "Xoan mộc"],
      grades: ["AA", "AB", "AC"],
      availableThicknessesMm: [8, 10, 12, 15, 18, 20, 22, 25, 30],
      moisturePercent: [8, 12],
      glueStandard: "F4",
      widthsMm: [1000, 1200, 1220],
      lengthsMm: [2000, 2400, 2440],
    },
  },
  {
    name: "Ván OKAL/MFC",
    slug: "van-okal-mfc",
    category: "MFC/OKAL",
    sourceUrl: "https://bathanh.com.vn/portfolio/vanokal",
    imageUrl: "https://bathanh.com.vn/wp-content/uploads/2017/09/OKAL123-1.jpg",
    variants: ["OKAL thường", "OKAL chống ẩm", "MFC"],
    specifications: {
      densityKgM3: [650, 750],
      formatsMm: ["1220 x 2440", "1830 x 2440"],
      availableThicknessesMm: [17, 18, 25],
      coreOptions: ["Thường", "Chống ẩm"],
    },
  },
  {
    name: "Ván phủ Melamine",
    slug: "van-phu-melamine",
    category: "Ván phủ",
    sourceUrl: "https://bathanh.com.vn/portfolio/van-phu-melamine",
    imageUrl: "https://bathanh.com.vn/wp-content/uploads/2019/03/all-new.jpg",
    variants: ["MFC", "MDF phủ Melamine", "HDF phủ Melamine"],
    specifications: { surface: "Melamine" },
  },
  {
    name: "Ván phủ Veneer",
    slug: "van-phu-veneer",
    category: "Veneer",
    sourceUrl: "https://bathanh.com.vn/portfolio/van-phu-veneer",
    imageUrl: "https://bathanh.com.vn/wp-content/uploads/2017/09/phuveneer.jpg",
    variants: ["MDF/HDF phủ Veneer", "Gỗ ghép phủ Veneer", "OKAL phủ Veneer"],
    specifications: {
      veneerThicknessMm: [0.3, 0.6],
      standardFormatMm: "1200 x 2400",
      coreOptions: ["MDF", "HDF", "Gỗ ghép", "OKAL"],
    },
  },
  {
    name: "Ván phủ giấy",
    slug: "van-phu-giay",
    category: "Ván phủ",
    sourceUrl: "https://bathanh.com.vn/portfolio/van-phu-giay-melamine",
    imageUrl: "https://bathanh.com.vn/wp-content/uploads/2017/09/giayphu.jpg",
    variants: ["Giấy PU", "Giấy Amino"],
    specifications: {
      coreOptions: ["MDF", "OKAL"],
      patterns: ["Đơn sắc", "Vân gỗ"],
      surfaceOptions: ["Nhám", "Bóng", "Sọc"],
    },
  },
  {
    name: "Chỉ dán cạnh Veneer/PVC",
    slug: "chi-dan-canh-veneer-pvc",
    category: "Chỉ dán cạnh",
    sourceUrl: "https://bathanh.com.vn/portfolio/chi-vien-veneer-pvc",
    imageUrl: "https://bathanh.com.vn/wp-content/uploads/2017/09/CV-1.jpg",
    variants: ["PVC", "Veneer"],
    specifications: {
      pvcThicknessesMm: [1, 2],
      pvcWidthsMm: [21, 28, 35, 50],
      veneerThicknessMm: 0.5,
      veneerWidthsMm: [21, 35, 45],
      veneerSpecies: ["Sồi", "Ash", "Walnut", "Xoan đào", "Veneer kỹ thuật"],
    },
  },
  {
    name: "Ván sàn Dongwha Natus",
    slug: "van-san-dongwha-natus",
    category: "Ván sàn",
    sourceUrl: "https://bathanh.com.vn/portfolio/van-mdf-chong-am-hmr-mmr",
    imageUrl: "https://bathanh.com.vn/wp-content/uploads/2017/08/banner-san-go-dongwha-vn.jpg",
    variants: ["Natus"],
    specifications: {
      collection: "Natus",
      sourceClaims: ["Lõi HDF", "Hệ thống uniclick", "Bề mặt phủ Bio-ceramic"],
    },
  },
  {
    name: "Ván sàn Dongwha Sanus",
    slug: "van-san-dongwha-sanus",
    category: "Ván sàn",
    sourceUrl: "https://bathanh.com.vn/catalogue-van-san-dongwha",
    imageUrl: "https://bathanh.com.vn/wp-content/uploads/2023/02/FLOOR-01.jpg",
    variants: ["Sanus"],
    specifications: {
      collection: "Sanus",
      sourceClaims: ["Bề mặt nano bạc", "Bề mặt theo vân", "Kháng ẩm"],
    },
  },
] as const;

const DOCUMENT_SOURCES = [
  {
    name: "Catalogue Melamine Ba Thanh 2025",
    slug: "catalogue-melamine-ba-thanh-2025",
    sourceUrl: "https://bathanh.com.vn/catalogue-pdf",
    driveUrl: "https://drive.google.com/file/d/1EKz9dMo80sIRQU13lKcGg47mwVYa2a8p/view?usp=sharing",
    pageUrls: Array.from({ length: 24 }, (_, index) => {
      const page = String(index + 1).padStart(2, "0");
      if (index === 4) return "https://bathanh.com.vn/wp-content/uploads/2017/07/PDF-MELAMINE-BA-THANH-7.2025-05.jpg";
      if (index === 21) return "https://bathanh.com.vn/wp-content/uploads/2017/07/CATALOGUE-MELAMINE-BA-THANH-2025-22.jpg";
      return `https://bathanh.com.vn/wp-content/uploads/2025/07/PDF-MELAMINE-BA-THANH-7.2025-${page}.jpg`;
    }),
  },
  {
    name: "Catalogue ván sàn Dongwha",
    slug: "catalogue-van-san-dongwha",
    sourceUrl: "https://bathanh.com.vn/catalogue-van-san-dongwha",
    driveUrl: "https://drive.google.com/file/d/1wEb3dHWK18TIFCB7_KTnYrTtPAwEJ7A7/view?usp=sharing",
    pageUrls: Array.from({ length: 14 }, (_, index) =>
      `https://bathanh.com.vn/wp-content/uploads/2023/02/FLOOR-${String(index + 1).padStart(2, "0")}.jpg`),
  },
] as const;

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([, child]) => child !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => [key, stableValue(child)]),
  );
}

function checksum(value: unknown) {
  return createHash("sha256").update(JSON.stringify(stableValue(value))).digest("hex");
}

export function recordId(record: CatalogueRecord): string {
  if (record.recordType === "sku") return `ba-thanh:sku:${record.normalizedCode}`;
  return `ba-thanh:${record.recordType}:${record.slug}`;
}

export function checksumBaThanhRecords(records: CatalogueRecord[]): string {
  return checksum([...records].sort((left, right) => recordId(left).localeCompare(recordId(right))));
}

function legacyImage(record: SupplierColorCode, image: CatalogImage, index: number): CatalogueImage {
  const mediaSources = Array.isArray(record.sourceData.mediaSourceUrls)
    ? record.sourceData.mediaSourceUrls.filter((url): url is string => typeof url === "string")
    : [];
  const sourceUrl = mediaSources[index]
    ?? (typeof record.sourceData.sourceImageUrl === "string" ? record.sourceData.sourceImageUrl : record.sourceUrl);
  return {
    sourceUrl,
    localPath: image.localPath ?? image.src,
    mimeType: "image/webp",
    width: image.width,
    height: image.height,
    checksum: image.checksum,
    mediaType: image.type === "swatch" ? "swatch" : image.type === "application" ? "application" : "product",
    rightsStatus: "UNCONFIRMED",
    importedAt: record.sourceImportedAt,
  };
}

function mediaImage(sourceUrl: string, mediaType: CatalogueImage["mediaType"], media?: MediaMetadata): CatalogueImage {
  return {
    sourceUrl,
    ...(media ? {
      localPath: media.localPath,
      mimeType: media.mimeType,
      width: media.width,
      height: media.height,
      checksum: media.checksum,
      importedAt: media.importedAt,
    } : {}),
    mediaType,
    rightsStatus: "UNCONFIRMED",
  };
}

function laminateMediaMatchesCode(url: string, code: string) {
  const basename = decodeURIComponent(new URL(url).pathname.split("/").pop() ?? "").toUpperCase();
  const visibleCodes = [
    ...basename.matchAll(/(?:BTSC|SC|BTS|BT)[-_ ]?\d{1,4}[A-Z]{0,2}|(?:W|P|S|F)[-_ ]?\d{4}/g),
  ].map((match) => match[0].replace(/[-_ ]/g, ""));
  return visibleCodes.length === 0 || visibleCodes.includes(code);
}

function familyRecords(mediaByUrl: Map<string, MediaMetadata>): SupplierFamilyRecord[] {
  return FAMILY_SOURCES.map((source) => ({
    recordType: "family",
    supplier: "ba-thanh",
    name: source.name,
    slug: source.slug,
    category: source.category,
    variants: [...source.variants],
    specifications: source.specifications,
    images: [mediaImage(source.imageUrl, "product", mediaByUrl.get(source.imageUrl))],
    documents: [],
    sourceUrls: [source.sourceUrl],
    sourceChecksum: checksum(source),
    editorialStatus: "NEEDS_EDITORIAL_REVIEW",
    seoStatus: "NOINDEX_USEFUL",
  }));
}

export function buildBaThanhCatalogueRecords(options: {
  melamine: SupplierColorCode[];
  melamineSources?: BaThanhFullSourceItem[];
  laminate: BaThanhFullSourceItem[];
  importedAt: string;
  media?: MediaMetadata[];
}): CatalogueRecord[] {
  const mediaByUrl = new Map((options.media ?? []).map((item) => [item.sourceUrl, item]));
  const melamine: CatalogueRecord[] = options.melamine.map((record) => ({
    recordType: "sku",
    supplier: "ba-thanh",
    sourceProductId: record.id,
    code: record.codeNormalized,
    normalizedCode: record.codeNormalized,
    name: `Melamine Ba Thanh ${record.displayName}`,
    slug: record.slug,
    productFamily: "Melamine",
    category: "Melamine",
    collections: record.patternGroup ? [record.patternGroup] : [],
    attributes: {
      sourceGroup: record.category,
      ...(record.patternGroup ? { patternGroup: record.patternGroup } : {}),
      ...(record.surface ? { surface: record.surface } : {}),
    },
    formats: (record.dimensions ?? []).map((format) => ({
      widthMm: format.widthMm,
      lengthMm: format.lengthMm,
      thicknessMm: format.thicknessMm,
      label: format.raw,
    })),
    images: record.images.map((image, index) => legacyImage(record, image, index)),
    documents: [],
    sourceUrls: [record.sourceUrl],
    canonicalSourceUrl: record.sourceUrl,
    importedAt: record.sourceImportedAt,
    sourceChecksum: record.sourceChecksum,
    completenessScore: Math.min(100, 45 + (record.images.length ? 25 : 0) + (record.dimensions?.length ? 10 : 0) + (record.editorialDescription ? 20 : 0)),
    editorialStatus: record.editorialDescription ? "READY" : "NEEDS_EDITORIAL_REVIEW",
    seoStatus: record.seoStatus === "READY_TO_INDEX" ? "READY_TO_INDEX" : "NEEDS_ENRICHMENT",
  }));

  const legacyMelamineCodes = new Set(options.melamine.map((record) => record.codeNormalized));
  const newlyDiscoveredMelamine: CatalogueRecord[] = (options.melamineSources ?? [])
    .filter((item) => item.materialType !== "laminate" && item.status === "PARSED" && item.codeNormalized && !legacyMelamineCodes.has(item.codeNormalized))
    .map((item) => {
      const sourceImages = [item.sourceImageUrl, ...(item.images ?? [])]
        .filter((url): url is string => Boolean(url))
        .filter((url, index, all) => all.indexOf(url) === index);
      return {
        recordType: "sku",
        supplier: "ba-thanh",
        sourceProductId: `ba-thanh:${item.codeNormalized}`,
        code: item.codeNormalized,
        normalizedCode: item.codeNormalized,
        name: `Melamine Ba Thanh ${item.displayName}`,
        slug: item.slug,
        productFamily: "Melamine",
        category: "Melamine",
        collections: [item.sourceCategoryLabel],
        attributes: { sourceGroup: item.category, patternGroup: item.sourceCategoryLabel },
        formats: [],
        images: sourceImages.map((url, index) => mediaImage(url, index === 0 ? "swatch" : "product", mediaByUrl.get(url))),
        documents: [],
        sourceUrls: [item.sourceUrl],
        canonicalSourceUrl: item.sourceUrl,
        importedAt: item.discoveredAt || options.importedAt,
        sourceChecksum: checksum({
          sourceUrl: item.sourceUrl,
          sourceImageUrl: item.sourceImageUrl,
          category: item.category,
          codeNormalized: item.codeNormalized,
          heading: item.heading,
          text: item.text,
          images: item.images ?? [],
        }),
        completenessScore: 45 + (sourceImages.length ? 20 : 0),
        editorialStatus: "NEEDS_EDITORIAL_REVIEW",
        seoStatus: "NOINDEX_USEFUL",
      };
    });

  const laminate: CatalogueRecord[] = options.laminate
    .filter((item) => item.materialType !== "melamine" && item.status === "PARSED" && item.codeNormalized)
    .map((item) => ({
      recordType: "sku",
      supplier: "ba-thanh",
      sourceProductId: `ba-thanh:laminate:${item.codeNormalized}`,
      code: item.codeNormalized,
      normalizedCode: item.codeNormalized,
      name: `Laminate WAY ${item.displayName}`,
      slug: `way-${item.codeNormalized.toLowerCase()}`,
      productFamily: "WAY Laminate",
      category: "Laminate",
      collections: [item.sourceCategoryLabel],
      attributes: { sourceGroup: item.category, patternGroup: item.sourceCategoryLabel, brand: "WAY" },
      formats: [],
      images: [item.sourceImageUrl, ...(item.images ?? [])]
        .filter((url): url is string => Boolean(url))
        .filter((url, index, all) => all.indexOf(url) === index)
        .filter((url) => laminateMediaMatchesCode(url, item.codeNormalized))
        .map((url, index) => mediaImage(url, index === 0 ? "swatch" : "product", mediaByUrl.get(url))),
      documents: [],
      sourceUrls: [item.sourceUrl],
      canonicalSourceUrl: item.sourceUrl,
      importedAt: item.discoveredAt || options.importedAt,
      sourceChecksum: checksum({
        sourceUrl: item.sourceUrl,
        sourceImageUrl: item.sourceImageUrl,
        category: item.category,
        codeNormalized: item.codeNormalized,
        heading: item.heading,
        text: item.text,
        images: item.images ?? [],
      }),
      completenessScore: 55 + (item.images?.length ? 20 : 0),
      editorialStatus: "NEEDS_EDITORIAL_REVIEW",
      seoStatus: "NOINDEX_USEFUL",
    }));

  const documents: CatalogueRecord[] = DOCUMENT_SOURCES.map((source) => ({
    recordType: "document",
    supplier: "ba-thanh",
    name: source.name,
    slug: source.slug,
    category: "Catalogue",
    images: source.pageUrls.map((url) => mediaImage(url, "catalogue-cover", mediaByUrl.get(url))),
    documents: [{ sourceUrl: source.driveUrl, title: source.name, mimeType: "application/pdf" }],
    sourceUrls: [source.sourceUrl],
    sourceChecksum: checksum(source),
    editorialStatus: "SOURCE_ONLY",
    seoStatus: "SOURCE_ONLY",
    documentType: "catalogue",
    needsEditorialReview: true,
  }));

  return [...melamine, ...newlyDiscoveredMelamine, ...laminate, ...familyRecords(mediaByUrl), ...documents];
}

function recordUrls(record: CatalogueRecord): string[] {
  return [
    ...record.sourceUrls,
    ...record.images.map((image) => image.sourceUrl),
    ...record.documents.map((document) => document.sourceUrl),
  ];
}

export function buildBaThanhFullSourceManifest(options: {
  records: CatalogueRecord[];
  discovered: BaThanhDiscoveredSourceUrl[];
  generatedAt: string;
}): FullSourceManifest {
  const idsByUrl = new Map<string, Set<string>>();
  for (const record of options.records) {
    for (const url of recordUrls(record)) {
      const canonical = new URL(url).toString();
      const ids = idsByUrl.get(canonical) ?? new Set<string>();
      ids.add(recordId(record));
      idsByUrl.set(canonical, ids);
    }
  }
  const idsByFamily = {
    melamine: options.records.filter((record) => record.recordType === "sku" && record.productFamily === "Melamine").map(recordId),
    laminate: options.records.filter((record) => record.recordType === "sku" && record.productFamily === "WAY Laminate").map(recordId),
    families: options.records.filter((record) => record.recordType === "family").map(recordId),
    all: options.records.map(recordId),
  };
  const idsByCode = new Map(options.records
    .filter((record) => record.recordType === "sku")
    .map((record) => [record.normalizedCode, recordId(record)]));
  const availableRecordIds = new Set(options.records.map(recordId));
  const seen = new Set<string>();
  const records: AccountedSourceRecord[] = [];
  for (const discovered of options.discovered) {
    const url = new URL(discovered.url).toString();
    if (seen.has(url)) continue;
    seen.add(url);
    const directIds = [...(idsByUrl.get(url) ?? [])].sort();
    const pathname = new URL(url).pathname.replace(/\/$/, "");
    const collectionIds = pathname === "/map-ma-melamine"
      ? idsByFamily.melamine
      : pathname === "/map-mau-laminate"
        ? idsByFamily.laminate
        : pathname === "/san-pham"
          ? idsByFamily.all
          : pathname === "/portfolio"
            ? idsByFamily.families
            : [];
    const classification = discovered.classification;
    const canonicalIds = [classification?.canonicalUrl, ...(classification?.canonicalUrls ?? [])]
      .filter((value): value is string => Boolean(value))
      .flatMap((value) => [...(idsByUrl.get(new URL(value).toString()) ?? [])]);
    const groupIds = classification?.recordGroup ? idsByFamily[classification.recordGroup] : [];
    const codeId = classification?.recordCode ? idsByCode.get(classification.recordCode) : undefined;
    const classifiedIds = (classification?.recordIds ?? []).filter((id) => availableRecordIds.has(id));
    const recordIds = directIds.length
      ? directIds
      : classifiedIds.length
        ? classifiedIds
        : canonicalIds.length
        ? canonicalIds
        : groupIds.length
          ? groupIds
          : codeId
            ? [codeId]
            : collectionIds;
    const outcome = classification?.outcome ?? (recordIds.length ? "imported" : undefined);
    records.push({
      ...discovered,
      url,
      outcome,
      ...(recordIds.length ? { recordIds: [...recordIds].sort() } : {}),
      ...(classification?.reason ? { reason: classification.reason } : {}),
    });
  }
  const manifest: FullSourceManifest = {
    schemaVersion: 1,
    supplier: "ba-thanh",
    generatedAt: options.generatedAt,
    records,
    checksum: "",
  };
  manifest.checksum = checksumFullSourceManifest(manifest);
  return manifest;
}

export const BA_THANH_FAMILY_SOURCES = FAMILY_SOURCES;
export const BA_THANH_DOCUMENT_SOURCES = DOCUMENT_SOURCES;
