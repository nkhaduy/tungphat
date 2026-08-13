import fs from "node:fs";
import path from "node:path";
import type { PublicSupplierColorCode } from "../../lib/catalog/color-codes/types";
import { normalizeColorCode } from "../../lib/catalog/color-codes/normalize";
import {
  type ColorMediaDiscoveryArtifact,
  type ColorMediaDiscoveryEntry,
  writeColorMediaArtifact,
} from "../catalog-suppliers/color-media";
import { selectBaThanhDetailMedia } from "./detail-media";

export type BaThanhMapMedia = {
  codeNormalized: string;
  detailUrl: string;
  sourceUrl: string;
};

export function classifyBaThanhFallbackMedia(
  codeNormalized: string,
  sourceUrl?: string,
): Pick<
  ColorMediaDiscoveryEntry,
  "previewSourceUrl" | "sourceHasMedia" | "reasonCode"
> {
  if (!sourceUrl) {
    return {
      previewSourceUrl: undefined,
      sourceHasMedia: false,
      reasonCode: "SOURCE_NO_IMAGE",
    };
  }
  const isComingSoon = /\/soon(?:-[^/]*)?\.(?:png|jpe?g|webp)(?:\?|$)/i.test(
    sourceUrl,
  );
  const isWrongBt103 =
    codeNormalized !== "BT103" &&
    /\/BT-103(?:-e\d+)?\.jpe?g(?:\?|$)/i.test(sourceUrl);
  if (isComingSoon || isWrongBt103) {
    return {
      previewSourceUrl: undefined,
      sourceHasMedia: false,
      reasonCode: "INVALID_IMAGE",
    };
  }
  return {
    previewSourceUrl: sourceUrl,
    sourceHasMedia: true,
    reasonCode: "SOURCE_HAS_IMAGE_DOWNLOAD_FAILED",
  };
}

export function applyBaThanhFallbackMedia(
  entry: ColorMediaDiscoveryEntry,
  sourceUrl?: string,
): ColorMediaDiscoveryEntry {
  if (entry.previewSourceUrl) return entry;
  if (entry.localPath) {
    const fallback = classifyBaThanhFallbackMedia(
      entry.codeNormalized,
      sourceUrl,
    );
    return {
      ...entry,
      previewSourceUrl: fallback.previewSourceUrl,
      sourceHasMedia: true,
    };
  }
  return {
    ...entry,
    ...classifyBaThanhFallbackMedia(entry.codeNormalized, sourceUrl),
  };
}

function attribute(html: string, name: string): string {
  return html.match(new RegExp(`${name}=["']([^"']+)["']`, "i"))?.[1]?.trim() ?? "";
}

function responsivePreview(imgHtml: string): string {
  const srcset = attribute(imgHtml, "srcset");
  const candidates = srcset
    .split(",")
    .map((part) => part.trim().match(/^(\S+)\s+(\d+)w$/))
    .filter((value): value is RegExpMatchArray => Boolean(value))
    .map((value) => ({ url: value[1]!, width: Number(value[2]) }))
    .filter((value) => Number.isFinite(value.width));
  const bounded = candidates.filter((value) => value.width <= 1600).sort((left, right) => right.width - left.width)[0];
  return bounded?.url ?? attribute(imgHtml, "src");
}

export function parseBaThanhColorMap(html: string): BaThanhMapMedia[] {
  const records: BaThanhMapMedia[] = [];
  for (const match of html.matchAll(/<a\b[^>]*href=["']\s*(https:\/\/bathanh\.com\.vn\/way-([^"']+))["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    const imgHtml = match[3]?.match(/<img\b[^>]*>/i)?.[0] ?? "";
    const sourceUrl = responsivePreview(imgHtml);
    if (!sourceUrl) continue;
    records.push({
      codeNormalized: normalizeColorCode(match[2] ?? ""),
      detailUrl: match[1]!,
      sourceUrl,
    });
  }
  return records;
}

export function mergeBaThanhMapMedia(
  entries: Array<
    Pick<
      ColorMediaDiscoveryEntry,
      | "codeNormalized"
      | "codeRaw"
      | "sourceUrl"
      | "localPath"
      | "checksum"
      | "mimeType"
      | "width"
      | "height"
      | "localAssets"
    > & { id?: string }
  >,
  mapMedia: BaThanhMapMedia[],
): ColorMediaDiscoveryEntry[] {
  const byCode = new Map(mapMedia.map((media) => [media.codeNormalized, media]));
  const byDetailUrl = new Map(mapMedia.map((media) => [media.detailUrl, media]));
  return entries.map((entry) => {
    const map = byCode.get(entry.codeNormalized) ?? byDetailUrl.get(entry.sourceUrl);
    const sourceHasMedia = Boolean(entry.localPath || map?.sourceUrl);
    return {
      ...entry,
      id: entry.id ?? `ba-thanh:${entry.codeNormalized}`,
      previewSourceUrl: map?.sourceUrl,
      sourceHasMedia,
      reasonCode: entry.localPath
        ? "DUPLICATE_IMAGE"
        : map?.sourceUrl
          ? "SOURCE_HAS_IMAGE_BUT_PARSER_MISSED"
          : "SOURCE_NO_IMAGE",
    };
  });
}

export async function discoverBaThanhColorMedia(root = process.cwd()): Promise<ColorMediaDiscoveryArtifact> {
  const artifact = JSON.parse(fs.readFileSync(path.join(root, "data/catalogs/supplier-color-codes.json"), "utf8")) as { records: PublicSupplierColorCode[] };
  const records = artifact.records.filter((record) => record.supplier === "ba-thanh");
  type SourceItem = { codeNormalized: string; sourceUrl: string; sourceImageUrl?: string; images?: string[] };
  const sourceItems: SourceItem[] = [
    ...JSON.parse(fs.readFileSync(path.join(root, "data/imports/ba-thanh/discovered-codes.json"), "utf8")) as SourceItem[],
    ...JSON.parse(fs.readFileSync(path.join(root, "data/imports/ba-thanh/discovered-laminate-codes.json"), "utf8")) as SourceItem[],
  ];
  const sourceByUrl = new Map(sourceItems.map((item) => [item.sourceUrl, item]));
  const entries = records.map((record): ColorMediaDiscoveryEntry => {
    const source = sourceByUrl.get(record.sourceUrl);
    const routeCode = source?.codeNormalized ?? record.codeNormalized;
    const selected = selectBaThanhDetailMedia({
      codeNormalized: routeCode,
      materialType: record.materialType === "laminate" ? "laminate" : "melamine",
      sourceImageUrl: source?.sourceImageUrl,
      detailImageUrls: source?.images,
    });
    const preview = selected.find((image) => image.role === "swatch");
    const applications = selected.filter((image) => image.role === "application").map((image) => image.sourceUrl);
    const actualPhotos = selected.filter((image) => image.role === "actual-photo").map((image) => image.sourceUrl);
    return {
      id: record.id,
      codeNormalized: record.codeNormalized,
      codeRaw: record.codeRaw,
      sourceUrl: record.sourceUrl,
      previewSourceUrl: preview?.sourceUrl,
      applicationSourceUrls: applications.length ? applications : undefined,
      actualPhotoSourceUrls: actualPhotos.length ? actualPhotos : undefined,
      localAssets: undefined,
      sourceHasMedia: selected.length > 0,
      reasonCode: selected.length > 0 ? "SOURCE_HAS_IMAGE_DOWNLOAD_FAILED" : source?.images?.length ? "INVALID_IMAGE" : "SOURCE_NO_IMAGE",
    };
  });
  return { schemaVersion: 1, supplier: "ba-thanh", generatedAt: "2026-08-07T00:00:00.000Z", entries };
}

if (process.argv[1]?.endsWith("media-discover.ts")) {
  discoverBaThanhColorMedia().then((artifact) => {
    writeColorMediaArtifact(process.cwd(), "data/imports/ba-thanh/color-media-discovery.json", artifact);
  });
}
