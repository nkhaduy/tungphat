import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { normalizeSupplierCode } from "@/lib/catalog/normalize-code";
import { mergeCatalogRecords } from "@/lib/catalog/import-utils";
import { assertRobotsAllowed } from "@/lib/catalog/robots-policy";
import type { CatalogImage, SupplierColorCode } from "@/lib/catalog/types";
import { COLOR_DISCLAIMER, CATALOG_PATH, IMPORT_DIR, MEDIA_DIR, READY_EDITORIAL, SOURCE_INDEX_URL, USER_AGENT } from "./config";
import { downloadCatalogImage } from "./download-media";
import { selectBaThanhDetailMedia } from "./detail-media";

export {
  buildBaThanhCatalogueRecords,
  buildBaThanhFullSourceManifest,
  checksumBaThanhRecords,
} from "./full-import";

type SourceItem = {
  sourceUrl: string;
  sourceImageUrl: string;
  category: string;
  sourceCategoryLabel: string;
  codeRaw: string;
  codeNormalized: string;
  displayName: string;
  slug: string;
  confident: boolean;
  status?: string;
  pageChecksum?: string;
  heading?: string;
  text?: string;
  images?: string[];
};

function extractDimensions(text = "") {
  const dimensions: NonNullable<SupplierColorCode["dimensions"]> = [];
  for (const match of text.matchAll(/(\d{3,4})\s*mm\s*[x×]\s*(\d{3,4})\s*mm/gi)) {
    const raw = match[0].replace(/\s+/g, " ");
    if (!dimensions.some((item) => item.raw === raw)) {
      dimensions.push({ widthMm: Number(match[1]), lengthMm: Number(match[2]), raw });
    }
  }
  return dimensions;
}

function classifyDetailImage(url: string): CatalogImage["type"] {
  if (/(?:THUC|REAL|Mau-?thuc-?te|actual)/i.test(url)) return "real-photo";
  if (/(?:APP|APPLICATION|THIET-?KE|DESIGN)/i.test(url)) return "application";
  return "other";
}

export function buildSourceChecksum(item: SourceItem) {
  return crypto.createHash("sha256").update(JSON.stringify({
    sourceUrl: item.sourceUrl,
    sourceImageUrl: item.sourceImageUrl,
    codeNormalized: item.codeNormalized,
    category: item.category,
    heading: item.heading || "",
    text: item.text || "",
    images: item.images || [],
  })).digest("hex");
}

async function readExisting() {
  try {
    return JSON.parse(await fs.readFile(CATALOG_PATH, "utf8")) as SupplierColorCode[];
  } catch {
    return [];
  }
}

export async function importBaThanhCatalog(options: { dryRun?: boolean; refresh?: boolean } = {}) {
  const source = JSON.parse(await fs.readFile(path.join(IMPORT_DIR, "discovered-codes.json"), "utf8")) as SourceItem[];
  const manifest = JSON.parse(await fs.readFile(path.join(IMPORT_DIR, "source-manifest.json"), "utf8"));
  const robots = String(manifest.robots || "");
  const existing = await readExisting();
  const incoming: SupplierColorCode[] = [];
  let missingMedia = 0;
  let skipped = 0;

  for (const item of source) {
    const normalized = normalizeSupplierCode(item.codeNormalized || item.codeRaw);
    const detailAccepted = item.status === "PARSED";
    const editorial = READY_EDITORIAL[normalized.normalized];
    const localExisting = existing.find((record) => record.id === `ba-thanh:${normalized.normalized}`);
    const images: CatalogImage[] = [];
    const typeCounts = new Map<CatalogImage["type"], number>();
    const selectedDetailMedia = detailAccepted
      ? selectBaThanhDetailMedia({ codeNormalized: normalized.normalized, materialType: "melamine", sourceImageUrl: item.sourceImageUrl, detailImageUrls: item.images })
      : [];
    const mediaSourceUrls: string[] = selectedDetailMedia.map((image) => image.sourceUrl);
    for (const [index, image] of selectedDetailMedia.entries()) {
      const url = image.sourceUrl;
      const type = image.role === "actual-photo" ? "real-photo" : image.role === "application" ? "application" : "swatch";
      const ordinal = (typeCounts.get(type) || 0) + 1;
      typeCounts.set(type, ordinal);
      const previous = localExisting?.images.filter((image) => image.type === type)[ordinal - 1];
      const result = await downloadCatalogImage({
        url,
        slug: normalized.slug,
        type,
        ordinal,
        dryRun: options.dryRun,
        refresh: options.refresh,
        validateUrl: (mediaUrl) => assertRobotsAllowed(robots, USER_AGENT, mediaUrl),
        existing: previous,
      });
      if ("error" in result) {
        if (type === "swatch") missingMedia += 1;
        continue;
      }
      images.push({
        type,
        src: result.localPath,
        localPath: result.localPath,
        ...(result.thumbnailLocalPath ? {
          thumbnailSrc: result.thumbnailLocalPath,
          thumbnailWidth: result.thumbnailWidth,
          thumbnailHeight: result.thumbnailHeight,
        } : {}),
        checksum: result.checksum,
        variant: result.variant,
        alt: `${type === "swatch" ? "Mẫu màu" : type === "real-photo" ? "Ảnh thực tế" : "Hình ứng dụng"} Melamine Ba Thanh mã ${normalized.display}`,
        width: result.width,
        height: result.height,
      });
    }
    const seoStatus = editorial && detailAccepted && images.length > 0 && normalized.confident ? "READY_TO_INDEX" : images.length > 0 ? "NEEDS_ENRICHMENT" : "MEDIA_MISSING";
    if (!detailAccepted && !editorial) skipped += 1;
    incoming.push({
      id: `ba-thanh:${normalized.normalized}`,
      supplier: "ba-thanh",
      brandName: "Ba Thanh",
      codeRaw: item.codeRaw,
      codeNormalized: normalized.normalized,
      displayName: normalized.display,
      slug: normalized.slug,
      category: item.category,
      patternGroup: item.sourceCategoryLabel,
      dimensions: extractDimensions(item.text),
      sourceUrl: item.sourceUrl,
      sourceIndexUrl: SOURCE_INDEX_URL,
      sourceImportedAt: new Date().toISOString(),
      sourceChecksum: buildSourceChecksum(item),
      sourceData: {
        sourceCategoryLabel: item.sourceCategoryLabel,
        sourceImageUrl: item.sourceImageUrl,
        detailHeading: item.heading || "",
        detailText: item.text || "",
        detailImageUrls: item.images || [],
        mediaSourceUrls,
      },
      images,
      sourceDisclaimer: COLOR_DISCLAIMER,
      ...(editorial ? { editorialDescription: editorial.description, applications: editorial.applications } : {}),
      relatedServices: ["Cắt ván theo kích thước", "Dán cạnh đồng màu Melamine", "Gia công CNC ván phủ Melamine"],
      seoStatus,
      published: seoStatus === "READY_TO_INDEX",
    });
  }

  const merged = mergeCatalogRecords(existing, incoming);
  const report = {
    importedAt: new Date().toISOString(),
    dryRun: Boolean(options.dryRun),
    ...merged.report,
    skipped: merged.report.skipped + skipped,
    invalid: incoming.filter((record) => record.seoStatus === "DATA_INVALID").length,
    needsEnrichment: incoming.filter((record) => record.seoStatus === "NEEDS_ENRICHMENT").length,
    missingMedia,
    duplicateMedia: 0,
    readyToIndex: incoming.filter((record) => record.seoStatus === "READY_TO_INDEX").length,
    totalCodes: incoming.length,
  };
  if (!options.dryRun) {
    await fs.mkdir(path.dirname(CATALOG_PATH), { recursive: true });
    await fs.mkdir(MEDIA_DIR, { recursive: true });
    await fs.writeFile(CATALOG_PATH, `${JSON.stringify(merged.records, null, 2)}\n`);
    await fs.writeFile(path.join(IMPORT_DIR, "import-report.json"), `${JSON.stringify(report, null, 2)}\n`);
  }
  return { records: merged.records, report };
}

if (process.argv[1]?.endsWith("import.ts")) {
  const dryRun = process.argv.includes("--dry-run");
  const refresh = process.argv.includes("--refresh");
  importBaThanhCatalog({ dryRun, refresh }).then(({ report }) => {
    console.log(JSON.stringify({ command: "import", ...report }, null, 2));
  }).catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
