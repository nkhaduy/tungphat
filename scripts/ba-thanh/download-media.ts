import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import sharp from "sharp";
import { fetchBytes } from "./http";
import { MEDIA_DIR } from "./config";

export type DownloadedMedia = {
  localPath: string;
  thumbnailLocalPath?: string;
  thumbnailWidth?: number;
  thumbnailHeight?: number;
  checksum: string;
  width: number;
  height: number;
  mime: string;
  variant: string;
};

const MEDIA_VARIANT = "webp-1200-q92-thumb480-q92-v2";
const MAX_IMAGE_DIMENSION = 1200;
const THUMBNAIL_WIDTH = 480;

export function buildCatalogMediaPaths(slug: string, type: "swatch" | "real-photo" | "application" | "other") {
  const filename = `ba-thanh-melamine-${slug}-${type}.webp`;
  const localPath = `/catalog/ba-thanh/${filename}`;
  if (type !== "swatch") return { localPath };
  return {
    localPath,
    thumbnailLocalPath: `/catalog/ba-thanh/ba-thanh-melamine-${slug}-${type}-thumb.webp`,
  };
}

async function fileExists(file: string) {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}

export async function downloadCatalogImage(input: {
  url: string;
  slug: string;
  type: "swatch" | "real-photo" | "application" | "other";
  dryRun?: boolean;
  existing?: { checksum?: string; localPath?: string; variant?: string };
}): Promise<DownloadedMedia | { error: string }> {
  try {
    const source = await fetchBytes(input.url);
    const checksum = crypto.createHash("sha256").update(source).digest("hex");
    const image = sharp(source, { failOn: "error" });
    const metadata = await image.metadata();
    if (!metadata.format || !["jpeg", "png", "webp", "avif", "tiff"].includes(metadata.format)) {
      throw new Error(`MIME ảnh không được hỗ trợ: ${metadata.format || "unknown"}`);
    }
    if (!metadata.width || !metadata.height || metadata.width < 100 || metadata.height < 60) {
      throw new Error("Ảnh quá nhỏ hoặc thiếu kích thước");
    }
    const paths = buildCatalogMediaPaths(input.slug, input.type);
    const localPath = paths.localPath;
    const target = path.join(MEDIA_DIR, path.basename(localPath));
    const thumbnailTarget = paths.thumbnailLocalPath
      ? path.join(MEDIA_DIR, path.basename(paths.thumbnailLocalPath))
      : undefined;
    const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(metadata.width, metadata.height));
    const width = Math.max(1, Math.round(metadata.width * scale));
    const height = Math.max(1, Math.round(metadata.height * scale));
    const thumbnailScale = paths.thumbnailLocalPath ? Math.min(1, THUMBNAIL_WIDTH / metadata.width) : undefined;
    const thumbnailWidth = thumbnailScale ? Math.max(1, Math.round(metadata.width * thumbnailScale)) : undefined;
    const thumbnailHeight = thumbnailScale ? Math.max(1, Math.round(metadata.height * thumbnailScale)) : undefined;
    const targetsExist = await fileExists(target) && (!thumbnailTarget || await fileExists(thumbnailTarget));
    if (!input.dryRun && targetsExist && input.existing?.checksum === checksum && input.existing.localPath === localPath && input.existing.variant === MEDIA_VARIANT) {
      return {
        localPath,
        ...(paths.thumbnailLocalPath ? { thumbnailLocalPath: paths.thumbnailLocalPath, thumbnailWidth, thumbnailHeight } : {}),
        checksum,
        width,
        height,
        mime: "image/webp",
        variant: MEDIA_VARIANT,
      };
    }
    if (!input.dryRun) {
      await fs.mkdir(MEDIA_DIR, { recursive: true });
      await sharp(source, { failOn: "error" })
        .resize({ width: MAX_IMAGE_DIMENSION, height: MAX_IMAGE_DIMENSION, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 92, effort: 5, smartSubsample: false })
        .toFile(target);
      if (thumbnailTarget) {
        await sharp(source, { failOn: "error" })
          .resize({ width: THUMBNAIL_WIDTH, fit: "inside", withoutEnlargement: true })
          .webp({ quality: 92, effort: 5, smartSubsample: false })
          .toFile(thumbnailTarget);
      }
    }
    return {
      localPath,
      ...(paths.thumbnailLocalPath ? { thumbnailLocalPath: paths.thumbnailLocalPath, thumbnailWidth, thumbnailHeight } : {}),
      checksum,
      width,
      height,
      mime: "image/webp",
      variant: MEDIA_VARIANT,
    };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}
