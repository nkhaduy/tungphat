import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const MEDIA_EXTENSIONS = new Set([".avif", ".gif", ".jpeg", ".jpg", ".mov", ".mp4", ".pdf", ".png", ".svg", ".webm", ".webp"]);
const GENERATED_SEGMENTS = ["/catalog/", "/gallery/", "/thumbnails/", "/uploads-thumbnails/", "/vendor/"];

export type MediaClassification = {
  externalize: boolean;
  runtimeCritical: boolean;
  seoCritical: boolean;
};

export type MediaInput = {
  path: string;
  bytes: number;
  sha256: string;
  mimeType: string;
  referenced: boolean;
};

export type MediaManifestEntry = {
  logicalPath: string;
  objectKey: string;
  sourcePath: string;
  sha256: string;
  bytes: number;
  mimeType: string;
};

export type MediaManifest = {
  version: 1;
  generatedAt: string;
  entries: MediaManifestEntry[];
  aliases: Record<string, string>;
  summary: {
    files: number;
    bytes: number;
    uniqueObjects: number;
    uniqueBytes: number;
    duplicateFiles: number;
    reclaimableBytes: number;
  };
};

export function isMediaPath(filePath: string): boolean {
  return MEDIA_EXTENSIONS.has(path.extname(filePath).toLowerCase());
}

export function classifyMediaPath(filePath: string, bytes: number): MediaClassification {
  const normalized = `/${filePath.replaceAll("\\", "/").replace(/^\/+/, "")}`;
  const catalogue = normalized.startsWith("/public/catalog/");
  const generated = catalogue || GENERATED_SEGMENTS.some((segment) => normalized.includes(segment));
  const largeDocument = /\.(pdf|mov|mp4|webm)$/i.test(normalized);
  const largeSvg = normalized.endsWith(".svg") && bytes > 100_000;
  return {
    externalize: generated || largeDocument || largeSvg,
    runtimeCritical: normalized.startsWith("/public/"),
    seoCritical: catalogue || /(?:^|\/)(?:og-|logo|favicon|android-chrome)/i.test(normalized),
  };
}

export function logicalObjectKey(filePath: string): string {
  const normalized = filePath.replaceAll("\\", "/");
  if (!normalized.startsWith("public/")) throw new Error(`Media path must be inside public/: ${filePath}`);
  const key = normalized.slice("public/".length);
  if (!key || key.startsWith("/") || key.split("/").includes("..") || !/^[a-zA-Z0-9][a-zA-Z0-9._/-]*$/.test(key)) {
    throw new Error(`Unsafe media object key: ${key}`);
  }
  return key;
}

export function extractCatalogueReferences(text: string): Set<string> {
  const references = new Set<string>();
  for (const match of text.matchAll(/(?:https:\/\/[^\s"'<>]+)?\/catalog\/[^\s"'<>?#)]+/giu)) {
    const value = match[0]!;
    const pathname = value.startsWith("https://") ? new URL(value).pathname : value;
    references.add(pathname.replace(/^\//, ""));
  }
  return references;
}

export function contentTypeForPath(filePath: string): string {
  const types: Record<string, string> = {
    ".avif": "image/avif", ".gif": "image/gif", ".jpeg": "image/jpeg", ".jpg": "image/jpeg",
    ".mov": "video/quicktime", ".mp4": "video/mp4", ".pdf": "application/pdf", ".png": "image/png",
    ".svg": "image/svg+xml", ".webm": "video/webm", ".webp": "image/webp",
  };
  return types[path.extname(filePath).toLowerCase()] ?? "application/octet-stream";
}

export function sha256File(filePath: string): string {
  return createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

export function buildMediaManifest(files: MediaInput[], generatedAt = new Date().toISOString()): MediaManifest {
  const canonicalByHash = new Map<string, MediaManifestEntry>();
  const entries: MediaManifestEntry[] = [];
  const aliases: Record<string, string> = {};
  let reclaimableBytes = 0;
  for (const file of [...files].sort((a, b) => a.path.localeCompare(b.path))) {
    const logicalPath = logicalObjectKey(file.path);
    const canonical = canonicalByHash.get(file.sha256);
    if (canonical) {
      aliases[logicalPath] = canonical.objectKey;
      reclaimableBytes += file.bytes;
      continue;
    }
    const entry = { logicalPath, objectKey: logicalPath, sourcePath: file.path, sha256: file.sha256, bytes: file.bytes, mimeType: file.mimeType };
    canonicalByHash.set(file.sha256, entry);
    entries.push(entry);
  }
  return {
    version: 1,
    generatedAt,
    entries,
    aliases,
    summary: {
      files: files.length,
      bytes: files.reduce((sum, file) => sum + file.bytes, 0),
      uniqueObjects: entries.length,
      uniqueBytes: entries.reduce((sum, entry) => sum + entry.bytes, 0),
      duplicateFiles: Object.keys(aliases).length,
      reclaimableBytes,
    },
  };
}
