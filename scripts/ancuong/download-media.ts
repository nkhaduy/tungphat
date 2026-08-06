import { createHash, randomUUID } from "node:crypto";
import { access, mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { atomicWriteJson, readJsonIfExists } from "./stable-json";
import { paths } from "./config";
import type { CliOptions } from "./types";
import { createHttpClient, HttpStatusError, SourceBlockedError } from "./http-client";

export type MediaRole = "primary" | "gallery" | "application";
export type MediaDownloadStatus = "discovered" | "downloaded" | "duplicate" | "missing" | "invalid" | "failed" | "dry-run";

export interface MediaDownloadInput {
  sourceUrl: string;
  productSourceId?: string;
  productCode: string;
  categorySlug?: string;
  role: MediaRole;
  alt?: string;
}

export interface MediaManifestRecord extends MediaDownloadInput {
  status: MediaDownloadStatus;
  filename?: string;
  localPath?: string;
  originalFilename?: string;
  mimeType?: string;
  width?: number;
  height?: number;
  bytes?: number;
  sha256?: string;
  duplicateOf?: string;
  httpStatus?: number;
  error?: string;
}

export interface MediaManifest {
  records: MediaManifestRecord[];
  summary: Record<MediaDownloadStatus, number> & { total: number; totalBytes: number };
}

export interface DownloadMediaOptions {
  outputDir: string;
  fetchImpl?: typeof fetch;
  concurrency?: number;
  force?: boolean;
  dryRun?: boolean;
  manifestPath?: string;
}

const MIME_EXTENSION: Record<string, string> = {
  "image/avif": "avif",
  "image/gif": "gif",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function pngInfo(bytes: Buffer) {
  if (bytes.length < 24 || !bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return undefined;
  return { mimeType: "image/png", width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

function gifInfo(bytes: Buffer) {
  const signature = bytes.subarray(0, 6).toString("ascii");
  if (bytes.length < 10 || (signature !== "GIF87a" && signature !== "GIF89a")) return undefined;
  return { mimeType: "image/gif", width: bytes.readUInt16LE(6), height: bytes.readUInt16LE(8) };
}

function jpegInfo(bytes: Buffer) {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return undefined;
  let offset = 2;
  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) { offset += 1; continue; }
    const marker = bytes[offset + 1]!;
    if (marker === 0xd9 || marker === 0xda) break;
    const length = bytes.readUInt16BE(offset + 2);
    if (length < 2 || offset + length + 2 > bytes.length) break;
    if ((marker >= 0xc0 && marker <= 0xc3) || (marker >= 0xc5 && marker <= 0xc7) || (marker >= 0xc9 && marker <= 0xcb) || (marker >= 0xcd && marker <= 0xcf)) {
      return { mimeType: "image/jpeg", width: bytes.readUInt16BE(offset + 7), height: bytes.readUInt16BE(offset + 5) };
    }
    offset += length + 2;
  }
  throw new Error("JPEG image has no readable dimensions");
}

function webpInfo(bytes: Buffer) {
  if (bytes.length < 30 || bytes.subarray(0, 4).toString("ascii") !== "RIFF" || bytes.subarray(8, 12).toString("ascii") !== "WEBP") return undefined;
  const format = bytes.subarray(12, 16).toString("ascii");
  if (format === "VP8X") {
    return {
      mimeType: "image/webp",
      width: 1 + bytes.readUIntLE(24, 3),
      height: 1 + bytes.readUIntLE(27, 3),
    };
  }
  if (format === "VP8L" && bytes[20] === 0x2f) {
    const bits = bytes.readUInt32LE(21);
    return { mimeType: "image/webp", width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
  }
  throw new Error("WEBP image has no readable dimensions");
}

export function inspectImageBytes(bytes: Buffer, declaredMime?: string): { mimeType: string; width: number; height: number } {
  const prefix = bytes.subarray(0, Math.min(bytes.length, 512)).toString("utf8").trimStart().toLowerCase();
  if (prefix.startsWith("<!doctype html") || prefix.startsWith("<html") || prefix.includes("attention required") || prefix.includes("captcha")) {
    throw new Error("Response is an HTML challenge, not an image");
  }
  const detected = pngInfo(bytes) ?? gifInfo(bytes) ?? jpegInfo(bytes) ?? webpInfo(bytes);
  if (!detected) throw new Error(`Unsupported or corrupt image payload${declaredMime ? ` (${declaredMime})` : ""}`);
  if (detected.width < 1 || detected.height < 1) throw new Error("Image dimensions are invalid");
  return detected;
}

async function exists(filePath: string): Promise<boolean> {
  try { await access(filePath); return true; } catch { return false; }
}

async function atomicWriteBinary(filePath: string, bytes: Buffer): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  const temporary = path.join(path.dirname(filePath), `.${path.basename(filePath)}.${randomUUID()}.tmp`);
  try {
    await writeFile(temporary, bytes);
    await rename(temporary, filePath);
  } catch (error) {
    await rm(temporary, { force: true });
    throw error;
  }
}

function originalFilename(sourceUrl: string): string | undefined {
  try {
    const value = path.basename(new URL(sourceUrl).pathname);
    return value || undefined;
  } catch {
    return undefined;
  }
}

function emptySummary(): MediaManifest["summary"] {
  return { total: 0, totalBytes: 0, discovered: 0, downloaded: 0, duplicate: 0, missing: 0, invalid: 0, failed: 0, "dry-run": 0 };
}

function buildManifest(records: MediaManifestRecord[]): MediaManifest {
  const summary = emptySummary();
  summary.total = records.length;
  for (const record of records) {
    summary[record.status] += 1;
    if (record.status === "downloaded") summary.totalBytes += record.bytes ?? 0;
  }
  return { records, summary };
}

function mediaIdentity(record: Pick<MediaDownloadInput, "sourceUrl" | "productSourceId" | "productCode" | "role">): string {
  return `${record.sourceUrl}|${record.productSourceId ?? ""}|${record.productCode}|${record.role}`;
}

type NormalizedMediaProduct = {
  sourceUrl?: string;
  sourceId?: string;
  productCode?: string;
  name?: string;
  categorySlug?: string;
  primaryImage?: { sourceUrl?: string; alt?: string };
  gallery?: Array<{ sourceUrl?: string; alt?: string }>;
};

function galleryRole(sourceUrl: string): MediaRole {
  try {
    return /\/Upload\/MaterialApp\//i.test(new URL(sourceUrl).pathname) ? "application" : "gallery";
  } catch {
    return "gallery";
  }
}

export function buildMediaInputs(products: NormalizedMediaProduct[]): MediaDownloadInput[] {
  const inputs: MediaDownloadInput[] = [];
  for (const product of products) {
    if (!product.productCode) continue;
    if (product.primaryImage?.sourceUrl) inputs.push({
      sourceUrl: product.primaryImage.sourceUrl,
      productSourceId: product.sourceId,
      productCode: product.productCode,
      categorySlug: product.categorySlug,
      role: "primary",
      alt: product.primaryImage.alt ?? product.name,
    });
    for (const media of product.gallery ?? []) if (media.sourceUrl) inputs.push({
      sourceUrl: media.sourceUrl,
      productSourceId: product.sourceId,
      productCode: product.productCode,
      categorySlug: product.categorySlug,
      role: galleryRole(media.sourceUrl),
      alt: media.alt ?? product.name,
    });
  }
  return inputs;
}

export function buildMediaDiscoveryManifest(inputs: MediaDownloadInput[]): MediaManifest {
  return buildManifest(inputs.map((input) => ({
    ...input,
    status: "discovered" as const,
    originalFilename: originalFilename(input.sourceUrl),
  })));
}

export async function downloadMedia(inputs: MediaDownloadInput[], options: DownloadMediaOptions): Promise<MediaManifest> {
  const orderedInputs = inputs;
  const manifestPath = options.manifestPath ?? path.join(options.outputDir, "media-manifest.json");
  const previous = options.force ? undefined : await readJsonIfExists<MediaManifest>(manifestPath);
  const previousByIdentity = new Map(previous?.records.map((record) => [mediaIdentity(record), record]));
  const records = new Array<MediaManifestRecord>(orderedInputs.length);
  const checksumPaths = new Map<string, string>();
  const checksumWrites = new Map<string, Promise<string>>();
  for (const record of previous?.records ?? []) {
    if (record.sha256 && record.localPath) checksumPaths.set(record.sha256, record.localPath);
  }
  const fetchImpl = options.fetchImpl;
  const httpClient = fetchImpl ? undefined : createHttpClient();
  let cursor = 0;
  const worker = async () => {
    while (cursor < orderedInputs.length) {
      const index = cursor++;
      const input = orderedInputs[index]!;
      const cached = previousByIdentity.get(mediaIdentity(input));
      if (cached?.localPath && cached.sha256 && await exists(path.join(options.outputDir, cached.localPath))) {
        records[index] = { ...cached, ...input };
        continue;
      }
      if (options.dryRun) {
        records[index] = { ...input, status: "dry-run", originalFilename: originalFilename(input.sourceUrl) };
        continue;
      }
      try {
        let httpStatus: number;
        let declaredMime: string | undefined;
        let bytes: Buffer;
        if (fetchImpl) {
          const response = await fetchImpl(input.sourceUrl, { headers: { Accept: "image/avif,image/webp,image/png,image/jpeg,image/gif" } });
          httpStatus = response.status;
          declaredMime = response.headers.get("content-type") ?? undefined;
          if (response.status === 404 || response.status === 410) {
            records[index] = { ...input, status: "missing", httpStatus: response.status, originalFilename: originalFilename(input.sourceUrl) };
            continue;
          }
          if (!response.ok) {
            records[index] = { ...input, status: "failed", httpStatus: response.status, error: `HTTP ${response.status}`, originalFilename: originalFilename(input.sourceUrl) };
            continue;
          }
          bytes = Buffer.from(await response.arrayBuffer());
        } else {
          const response = await httpClient!.fetchBytes(input.sourceUrl);
          httpStatus = response.status;
          declaredMime = response.contentType;
          bytes = Buffer.from(response.body);
        }
        const info = inspectImageBytes(bytes, declaredMime);
        const sha256 = createHash("sha256").update(bytes).digest("hex");
        const existingPath = checksumPaths.get(sha256);
        if (existingPath) {
          records[index] = { ...input, ...info, status: "duplicate", bytes: bytes.length, sha256, filename: path.basename(existingPath), localPath: existingPath, duplicateOf: existingPath, originalFilename: originalFilename(input.sourceUrl), httpStatus };
          continue;
        }
        const filename = `${sha256}.${MIME_EXTENSION[info.mimeType]}`;
        const localPath = path.posix.join("files", filename);
        const existingWrite = checksumWrites.get(sha256);
        if (existingWrite) {
          const duplicatePath = await existingWrite;
          records[index] = { ...input, ...info, status: "duplicate", bytes: bytes.length, sha256, filename: path.basename(duplicatePath), localPath: duplicatePath, duplicateOf: duplicatePath, originalFilename: originalFilename(input.sourceUrl), httpStatus };
        } else {
          const writePromise = atomicWriteBinary(path.join(options.outputDir, localPath), bytes).then(() => localPath);
          checksumWrites.set(sha256, writePromise);
          await writePromise;
          checksumWrites.delete(sha256);
          checksumPaths.set(sha256, localPath);
          records[index] = { ...input, ...info, status: "downloaded", bytes: bytes.length, sha256, filename, localPath, originalFilename: originalFilename(input.sourceUrl), httpStatus };
        }
      } catch (error) {
        if (error instanceof SourceBlockedError) throw error;
        if (error instanceof HttpStatusError && (error.status === 404 || error.status === 410)) {
          records[index] = { ...input, status: "missing", httpStatus: error.status, originalFilename: originalFilename(input.sourceUrl) };
          continue;
        }
        const message = error instanceof Error ? error.message : String(error);
        records[index] = { ...input, status: /challenge|image payload|dimensions/i.test(message) ? "invalid" : "failed", error: message, originalFilename: originalFilename(input.sourceUrl) };
      }
    }
  };
  const concurrency = Math.max(1, Math.min(options.concurrency ?? 3, 8, orderedInputs.length || 1));
  await Promise.all(Array.from({ length: concurrency }, worker));
  const manifest = buildManifest(records);
  if (!options.dryRun) await atomicWriteJson(manifestPath, manifest);
  return manifest;
}

export async function verifyMediaFile(filePath: string, expectedSha256: string): Promise<boolean> {
  const bytes = await readFile(filePath);
  inspectImageBytes(bytes);
  return createHash("sha256").update(bytes).digest("hex") === expectedSha256;
}

export async function run(options: CliOptions): Promise<MediaManifest> {
  const normalized = await readJsonIfExists<unknown>(path.join(paths.normalized, "catalogue.json"));
  const products = Array.isArray(normalized) ? normalized : (normalized && typeof normalized === "object" && Array.isArray((normalized as { records?: unknown[] }).records) ? (normalized as { records: unknown[] }).records : []);
  const inputs = buildMediaInputs(products as NormalizedMediaProduct[]);
  if (options.manifestOnly) {
    const manifest = buildMediaDiscoveryManifest(inputs);
    if (!options.dryRun) await atomicWriteJson(path.join(paths.normalized, "media-manifest.json"), manifest);
    return manifest;
  }
  return downloadMedia(inputs, { outputDir: paths.media, manifestPath: path.join(paths.normalized, "media-manifest.json"), concurrency: options.concurrency, force: options.force, dryRun: options.dryRun });
}
