import fs from "node:fs";
import path from "node:path";
import type { PublicSupplierColorCode } from "../../lib/catalog/color-codes/types";
import { normalizeColorCode } from "../../lib/catalog/color-codes/normalize";
import {
  type ColorMediaDiscoveryArtifact,
  type ColorMediaDiscoveryEntry,
  writeColorMediaArtifact,
} from "../catalog-suppliers/color-media";

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
    >
  >,
  mapMedia: BaThanhMapMedia[],
): ColorMediaDiscoveryEntry[] {
  const byCode = new Map(mapMedia.map((media) => [media.codeNormalized, media]));
  return entries.map((entry) => {
    const map = byCode.get(entry.codeNormalized);
    const sourceHasMedia = Boolean(entry.localPath || map?.sourceUrl);
    return {
      ...entry,
      id: `ba-thanh:${entry.codeNormalized}`,
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
  const rawArtifact = JSON.parse(fs.readFileSync(path.join(root, "data/imports/ba-thanh/full-records.json"), "utf8")) as { records?: Array<{ normalizedCode?: string; images?: Array<{ sourceUrl?: string }> }> } | Array<{ normalizedCode?: string; images?: Array<{ sourceUrl?: string }> }>;
  const raw = Array.isArray(rawArtifact) ? rawArtifact : rawArtifact.records ?? [];
  const rawMediaByCode = new Map(raw.map((record) => [record.normalizedCode, record.images?.[0]?.sourceUrl]));
  const pages = await Promise.all([
    fetch("https://bathanh.com.vn/map-ma-melamine").then((response) => response.text()),
    fetch("https://bathanh.com.vn/map-mau-laminate").then((response) => response.text()),
  ]);
  const mapMedia = pages.flatMap(parseBaThanhColorMap);
  const entries = mergeBaThanhMapMedia(
    records.map((record) => {
      const localPreview = record.images.find((image) => image.localPath);
      const localAssets = record.images
        .filter((image) => image.localPath && image.role === "swatch")
        .map((image) => ({
          role: "swatch" as const,
          sourceUrl: image.sourceUrl,
          localPath: image.localPath!,
          checksum: image.checksum,
          mimeType: image.mimeType,
          width: image.width,
          height: image.height,
        }));
      return {
        codeNormalized: record.codeNormalized,
        codeRaw: record.codeRaw,
        sourceUrl: record.sourceUrl,
        localPath: localPreview?.localPath,
        checksum: localPreview?.checksum,
        mimeType: localPreview?.mimeType,
        width: localPreview?.width,
        height: localPreview?.height,
        localAssets: localAssets.length ? localAssets : undefined,
      };
    }),
    mapMedia,
  );
  for (const entry of entries) {
    const record = records.find((value) => value.codeNormalized === entry.codeNormalized);
    Object.assign(
      entry,
      applyBaThanhFallbackMedia(entry, record?.images[0]?.sourceUrl ?? rawMediaByCode.get(entry.codeNormalized)),
    );
  }
  return { schemaVersion: 1, supplier: "ba-thanh", generatedAt: "2026-08-07T00:00:00.000Z", entries };
}

if (process.argv[1]?.endsWith("media-discover.ts")) {
  discoverBaThanhColorMedia().then((artifact) => {
    writeColorMediaArtifact(process.cwd(), "data/imports/ba-thanh/color-media-discovery.json", artifact);
  });
}
