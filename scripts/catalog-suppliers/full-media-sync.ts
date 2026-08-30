import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import sharp from "sharp";
import { supplierOriginalKey } from "../../lib/catalog/supplier-media/resolve";
import { resolveMediaUrl } from "../../lib/media";

const execFileAsync = promisify(execFile);
const root = process.cwd();
const inputPath = path.join(root, "data/catalogs/supplier-color-codes.json");
const reportPath = path.join(root, "data/imports/suppliers/media-audit.json");
const cacheDirectory = path.join(root, ".cache/supplier-originals");
const bucket = process.env.MEDIA_R2_BUCKET ?? "tung-phat-media";
const upload = process.argv.includes("--upload");
const retryFailures = process.argv.includes("--retry-failures");

type Supplier = "an-cuong" | "thanh-thuy" | "ba-thanh";
type MediaType = "texture" | "swatch" | "detail" | "board" | "edge" | "room" | "application" | "other";
type ImageRecord = {
  role: string;
  sourceUrl: string;
  localPath?: string;
  width?: number;
  height?: number;
  [key: string]: unknown;
};
type CodeRecord = {
  supplier: Supplier;
  codeRaw: string;
  codeNormalized: string;
  sourceUrl: string;
  images: ImageRecord[];
  [key: string]: unknown;
};

const allowedHosts: Record<Supplier, RegExp> = {
  "an-cuong": /(?:^|\.)(?:ancuong\.com|acshopping\.ancuong\.com)$/i,
  "thanh-thuy": /(?:^|\.)gothanhthuy\.com$/i,
  "ba-thanh": /(?:^|\.)bathanh\.com\.vn$/i,
};

function mediaType(role: string): MediaType {
  if (role === "swatch") return "swatch";
  if (role === "fullsheet") return "board";
  if (role === "actual-photo") return "detail";
  if (role === "application") return "application";
  return "other";
}

function originalCandidates(sourceUrl: string) {
  const candidates = [sourceUrl];
  const url = new URL(sourceUrl);
  url.searchParams.delete("w");
  url.searchParams.delete("width");
  url.searchParams.delete("h");
  url.searchParams.delete("height");
  url.searchParams.delete("fit");
  url.searchParams.delete("crop");
  url.searchParams.delete("resize");
  candidates.push(url.toString());
  candidates.push(url.toString().replace(/-\d{2,4}x\d{2,4}(?=\.[a-z0-9]+$)/i, ""));
  candidates.push(url.toString().replace(/-e\d{8,}(?=\.[a-z0-9]+$)/i, ""));
  return [...new Set(candidates)];
}

async function fetchImage(supplier: Supplier, sourceUrl: string) {
  let best: { url: string; bytes: Buffer; mimeType: string; width: number; height: number; checksum: string } | undefined;
  const rejected: Array<{ url: string; reason: string }> = [];
  for (const candidate of originalCandidates(sourceUrl)) {
    try {
      const parsed = new URL(candidate);
      if (parsed.protocol !== "https:" || !allowedHosts[supplier].test(parsed.hostname)) throw new Error("host-not-allowed");
      const response = await fetch(candidate, { headers: { "User-Agent": "TungPhatMediaAudit/1.0 (+https://mdftungphat.com/lien-he/)" }, signal: AbortSignal.timeout(30_000) });
      if (!response.ok) throw new Error(`http-${response.status}`);
      const declaredMime = response.headers.get("content-type")?.split(";")[0] ?? "";
      if (!declaredMime.startsWith("image/")) throw new Error(`mime-${declaredMime || "missing"}`);
      const bytes = Buffer.from(await response.arrayBuffer());
      if (!bytes.length) throw new Error("empty");
      const metadata = await sharp(bytes, { failOn: "error" }).metadata();
      if (!metadata.width || !metadata.height || !metadata.format) throw new Error("decode-dimensions");
      const mimeType = metadata.format === "jpeg" ? "image/jpeg" : `image/${metadata.format}`;
      const item = { url: candidate, bytes, mimeType, width: metadata.width, height: metadata.height, checksum: createHash("sha256").update(bytes).digest("hex") };
      if (!best || item.width * item.height > best.width * best.height) best = item;
    } catch (error) {
      rejected.push({ url: candidate, reason: error instanceof Error ? error.message : String(error) });
    }
  }
  if (!best) throw new Error(`No decodable source image: ${JSON.stringify(rejected)}`);
  return { ...best, rejected };
}

async function uploadObject(key: string, file: string, mimeType: string) {
  await execFileAsync(path.join(root, "node_modules/.bin/wrangler"), [
    "r2", "object", "put", `${bucket}/${key}`, "--remote", "--file", file,
    "--content-type", mimeType, "--cache-control", "public, max-age=31536000, immutable",
  ], { maxBuffer: 1024 * 1024 });
}

async function concurrentMap<T>(items: T[], concurrency: number, run: (item: T, index: number) => Promise<void>) {
  let index = 0;
  await Promise.all(Array.from({ length: concurrency }, async () => {
    while (index < items.length) {
      const current = index++;
      await run(items[current], current);
    }
  }));
}

async function main() {
  fs.mkdirSync(cacheDirectory, { recursive: true });
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  const artifact = JSON.parse(fs.readFileSync(inputPath, "utf8")) as { records: CodeRecord[]; [key: string]: unknown };
  const allWork = artifact.records.flatMap((record) => record.images.map((image, imageIndex) => ({ record, image, imageIndex })));
  const work = retryFailures ? allWork.filter(({ image }) => !image.originalChecksum) : allWork;
  const sourceCache = new Map<string, Awaited<ReturnType<typeof fetchImage>>>();
  const keyByChecksum = new Map<string, string>(allWork.flatMap(({ image }) =>
    typeof image.originalChecksum === "string" && typeof image.originalPath === "string"
      ? [[image.originalChecksum, image.originalPath.replace(/^\/media\//, "")] as const]
      : []));
  const previousReport = retryFailures && fs.existsSync(reportPath)
    ? JSON.parse(fs.readFileSync(reportPath, "utf8")) as { records?: Array<Record<string, unknown>> }
    : undefined;
  const audit: Array<Record<string, unknown>> = previousReport?.records?.filter((item) => item.uploadStatus !== "FAILED") ?? [];
  let downloadedBytes = 0;
  let uploaded = 0;
  let reusedByHash = 0;
  let failures = 0;

  await concurrentMap(work, Number(process.env.SUPPLIER_MEDIA_CONCURRENCY ?? 30), async ({ record, image, imageIndex }) => {
    try {
      const cacheKey = `${record.supplier}|${image.sourceUrl}`;
      let source = sourceCache.get(cacheKey);
      if (!source) {
        source = await fetchImage(record.supplier, image.sourceUrl);
        sourceCache.set(cacheKey, source);
        downloadedBytes += source.bytes.length;
      }
      const type = mediaType(image.role);
      let objectKey = keyByChecksum.get(source.checksum);
      const duplicate = Boolean(objectKey);
      if (!objectKey) {
        objectKey = supplierOriginalKey({ supplier: record.supplier, code: record.codeNormalized, type, checksum: source.checksum, mimeType: source.mimeType });
        keyByChecksum.set(source.checksum, objectKey);
        const extension = path.extname(objectKey);
        const localFile = path.join(cacheDirectory, `${source.checksum}${extension}`);
        const cachedBeforeRun = fs.existsSync(localFile);
        if (!cachedBeforeRun) fs.writeFileSync(localFile, source.bytes);
        if (upload) {
          if (!cachedBeforeRun || !process.argv.includes("--trust-existing-cache")) {
            await uploadObject(objectKey, localFile, source.mimeType);
            uploaded += 1;
          }
        }
      } else {
        reusedByHash += 1;
      }
      const originalPath = `/media/${objectKey}`;
      Object.assign(image, {
        originalSourceUrl: source.url,
        originalPath,
        originalUrl: resolveMediaUrl(objectKey),
        originalWidth: source.width,
        originalHeight: source.height,
        originalBytes: source.bytes.length,
        originalMimeType: source.mimeType,
        originalChecksum: source.checksum,
        suspectedCrop: source.url !== image.sourceUrl || /(?:-\d{2,4}x\d{2,4}|[?&](?:w|width|h|height|fit|crop|resize)=)/i.test(image.sourceUrl),
        uploadStatus: upload ? (duplicate ? "REUSED_HASH" : "UPLOADED") : "NOT_REQUESTED",
      });
      audit.push({
        supplier: record.supplier,
        code: record.codeRaw,
        normalizedCode: record.codeNormalized,
        sourceProductUrl: record.sourceUrl,
        pageFound: true,
        mediaIndex: imageIndex,
        type,
        originalSourceUrl: image.sourceUrl,
        selectedFullSizeUrl: source.url,
        sourceDimensions: { width: source.width, height: source.height },
        downloadedDimensions: { width: source.width, height: source.height },
        sourceBytes: source.bytes.length,
        downloadedBytes: source.bytes.length,
        mimeType: source.mimeType,
        suspectedCrop: image.suspectedCrop,
        rejectedCandidates: source.rejected,
        checksum: source.checksum,
        r2ObjectKey: objectKey,
        r2Url: resolveMediaUrl(objectKey),
        uploadStatus: image.uploadStatus,
        finalCatalogueReference: originalPath,
      });
    } catch (error) {
      failures += 1;
      audit.push({ supplier: record.supplier, code: record.codeRaw, normalizedCode: record.codeNormalized, sourceProductUrl: record.sourceUrl, pageFound: true, mediaIndex: imageIndex, originalSourceUrl: image.sourceUrl, uploadStatus: "FAILED", rejectionReason: error instanceof Error ? error.message : String(error) });
    }
  });

  const supplierSummary = Object.fromEntries((["an-cuong", "thanh-thuy", "ba-thanh"] as Supplier[]).map((supplier) => {
    const records = artifact.records.filter((record) => record.supplier === supplier);
    const media = audit.filter((item) => item.supplier === supplier && item.uploadStatus !== "FAILED");
    return [supplier, {
      totalCodes: records.length,
      sourcePagesFound: records.length,
      codesWithTexture: records.filter((record) => record.images.some((image) => ["swatch", "fullsheet"].includes(image.role))).length,
      codesWithRoomImages: records.filter((record) => record.images.some((image) => image.role === "application")).length,
      codesWithAnyMedia: records.filter((record) => record.images.length).length,
      textureImages: records.reduce((sum, record) => sum + record.images.filter((image) => ["swatch", "fullsheet"].includes(image.role)).length, 0),
      roomApplicationImages: records.reduce((sum, record) => sum + record.images.filter((image) => image.role === "application").length, 0),
      totalMedia: media.length,
      missing: records.filter((record) => !record.images.length).map((record) => record.codeNormalized),
      suspectedCroppedRemaining: media.filter((item) => item.suspectedCrop && item.selectedFullSizeUrl === item.originalSourceUrl).length,
    }];
  }));
  const report = { schemaVersion: 1, generatedAt: new Date().toISOString(), upload, summary: { media: allWork.length, retried: work.length, uniqueSourceUrls: sourceCache.size, uniqueContent: keyByChecksum.size, downloadedBytes, uploaded, reusedByHash, failures }, suppliers: supplierSummary, records: audit };
  fs.writeFileSync(inputPath, `${JSON.stringify(artifact, null, 2)}\n`);
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ ...report.summary, suppliers: supplierSummary }, null, 2));
  if (failures) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
