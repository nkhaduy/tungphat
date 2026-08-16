import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import {
  fetchExactSupplierPreviewsWithCache,
  inspectMediaBytes,
  isAllowedSupplierMediaUrl,
} from "../../lib/catalog/full-import/media";
import type { SupplierId } from "../../lib/catalog/core/types";

export type ColorMediaReasonCode =
  | "SOURCE_HAS_IMAGE_BUT_PARSER_MISSED"
  | "SOURCE_HAS_IMAGE_DOWNLOAD_FAILED"
  | "SOURCE_IMAGE_LAZY"
  | "SOURCE_IMAGE_CSS"
  | "SOURCE_IMAGE_FULLSHEET_ONLY"
  | "SOURCE_NO_IMAGE"
  | "INVALID_IMAGE"
  | "DUPLICATE_IMAGE";

export type ColorMediaDiscoveryEntry = {
  id: string;
  codeRaw: string;
  codeNormalized: string;
  sourceUrl: string;
  previewSourceUrl?: string;
  fullsheetSourceUrl?: string;
  applicationSourceUrls?: string[];
  localPath?: string;
  checksum?: string;
  mimeType?: string;
  width?: number;
  height?: number;
  localAssets?: ColorMediaLocalAsset[];
  sourceHasMedia: boolean;
  reasonCode: ColorMediaReasonCode;
  error?: string;
};

export type ColorMediaLocalAsset = {
  role: "swatch" | "fullsheet" | "application";
  sourceUrl: string;
  localPath: string;
  checksum?: string;
  mimeType?: string;
  width?: number;
  height?: number;
};

export type ColorMediaDiscoveryArtifact = {
  schemaVersion: 1;
  supplier: SupplierId;
  generatedAt: string;
  entries: ColorMediaDiscoveryEntry[];
};

export type ColorMediaValidationIssue = {
  code: string;
  message: string;
  colorCode?: string;
};

export function validateColorMediaDiscovery(
  artifact: ColorMediaDiscoveryArtifact,
  root = process.cwd(),
): ColorMediaValidationIssue[] {
  const issues: ColorMediaValidationIssue[] = [];
  for (const entry of artifact.entries) {
    if (!entry.codeRaw.trim() || !entry.codeNormalized.trim()) {
      issues.push({ code: "EMPTY_COLOR_CODE", message: "Public color media entry has an empty code" });
    }
    if (entry.sourceHasMedia && !entry.previewSourceUrl && !entry.fullsheetSourceUrl && !entry.applicationSourceUrls?.length) {
      issues.push({ code: "SOURCE_MEDIA_URL_MISSING", message: "Source media is claimed without a usable source URL", colorCode: entry.codeRaw });
    }
    const localAssets = entry.localAssets ?? [];
    if (entry.sourceHasMedia && !entry.localPath && !localAssets.length) {
      issues.push({ code: "SOURCE_MEDIA_LOCAL_PREVIEW_MISSING", message: "Source exposes media but local preview is missing", colorCode: entry.codeRaw });
    }
    const expectedAssets = mediaRequestsForEntry(entry);
    for (const expected of expectedAssets) {
      if (!localAssets.some((asset) => asset.role === expected.role && asset.sourceUrl === expected.sourceUrl)) {
        issues.push({ code: "SOURCE_MEDIA_ROLE_LOCAL_MISSING", message: `${expected.role} source media has no local derivative`, colorCode: entry.codeRaw });
      }
    }
    const assetsToValidate = localAssets.length
      ? localAssets
      : entry.localPath
        ? [{ role: "swatch" as const, sourceUrl: entry.previewSourceUrl ?? entry.fullsheetSourceUrl ?? entry.sourceUrl, localPath: entry.localPath, checksum: entry.checksum, mimeType: entry.mimeType }]
        : [];
    for (const asset of assetsToValidate) {
      const file = path.join(root, "public", asset.localPath.replace(/^\//, ""));
      if (!fs.existsSync(file)) {
        issues.push({ code: "LOCAL_PREVIEW_FILE_MISSING", message: `Local preview file does not exist: ${asset.localPath}`, colorCode: entry.codeRaw });
        continue;
      }
      try {
        const bytes = fs.readFileSync(file);
        const info = inspectMediaBytes(bytes, asset.mimeType);
        if (info.width < 32 || info.height < 32) throw new Error("image is smaller than 32x32");
        const checksum = createHash("sha256").update(bytes).digest("hex");
        if (asset.checksum && checksum !== asset.checksum) throw new Error("checksum mismatch");
      } catch (error) {
        issues.push({ code: "LOCAL_PREVIEW_INVALID", message: error instanceof Error ? error.message : String(error), colorCode: entry.codeRaw });
      }
    }
  }
  return issues;
}

function extensionlessSlug(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function semanticMediaPath(
  supplier: SupplierId,
  material: string,
  codeRaw: string,
  role: "swatch" | "fullsheet" | "application",
  ordinal?: number,
): string {
  const suffix = role === "application" && ordinal ? `${role}-${ordinal}` : role;
  return `/catalog/${supplier}/${extensionlessSlug(material)}/${extensionlessSlug(codeRaw)}-${suffix}.webp`;
}

type RequestedMedia = {
  role: ColorMediaLocalAsset["role"];
  sourceUrl: string;
  ordinal?: number;
};

function mediaRequestsForEntry(entry: ColorMediaDiscoveryEntry): RequestedMedia[] {
  const requests: RequestedMedia[] = [];
  if (entry.previewSourceUrl) requests.push({ role: "swatch", sourceUrl: entry.previewSourceUrl });
  if (entry.fullsheetSourceUrl) requests.push({ role: "fullsheet", sourceUrl: entry.fullsheetSourceUrl });
  for (const [index, sourceUrl] of (entry.applicationSourceUrls ?? []).entries()) {
    requests.push({ role: "application", sourceUrl, ordinal: index + 1 });
  }
  return requests.filter((request, index) => requests.findIndex((candidate) => candidate.role === request.role && candidate.sourceUrl === request.sourceUrl) === index);
}

function enrichExistingAsset(root: string, asset: ColorMediaLocalAsset): ColorMediaLocalAsset | undefined {
  const file = path.join(root, "public", asset.localPath.replace(/^\//, ""));
  if (!fs.existsSync(file)) return undefined;
  try {
    const bytes = fs.readFileSync(file);
    const info = inspectMediaBytes(bytes, asset.mimeType);
    if (info.width < 32 || info.height < 32) return undefined;
    if (asset.role === "fullsheet" && (info.width > 1600 || info.height > 1600)) return undefined;
    return {
      ...asset,
      checksum: createHash("sha256").update(bytes).digest("hex"),
      mimeType: info.mimeType,
      width: info.width,
      height: info.height,
    };
  } catch {
    return undefined;
  }
}

export async function downloadColorMediaArtifact(options: {
  artifact: ColorMediaDiscoveryArtifact;
  materialByCode: Map<string, string>;
  root?: string;
  concurrency?: number;
  minDelayMs?: number;
  checkpointRelativePath?: string;
}): Promise<ColorMediaDiscoveryArtifact> {
  const root = options.root ?? process.cwd();
  const cacheFile = path.join(root, ".cache", "supplier-color-media", `${options.artifact.supplier}.json`);
  const prepared = options.artifact.entries.map((entry) => {
    const existing = [...(entry.localAssets ?? [])];
    if (entry.localPath && (entry.previewSourceUrl || entry.fullsheetSourceUrl) && !existing.some((asset) => asset.role === "swatch")) {
      existing.unshift({
        role: "swatch",
        sourceUrl: entry.previewSourceUrl ?? entry.fullsheetSourceUrl!,
        localPath: entry.localPath,
        checksum: entry.checksum,
        mimeType: entry.mimeType,
        width: entry.width,
        height: entry.height,
      });
    }
    const requested = mediaRequestsForEntry(entry);
    const material = options.materialByCode.get(entry.codeNormalized) ?? "other-decorative";
    for (const request of requested) {
      if (existing.some((asset) => asset.role === request.role && asset.sourceUrl === request.sourceUrl)) continue;
      const candidatePath = semanticMediaPath(options.artifact.supplier, material, entry.codeRaw, request.role, request.ordinal);
      const candidateFile = path.join(root, "public", candidatePath.replace(/^\//, ""));
      if (fs.existsSync(candidateFile)) existing.push({ role: request.role, sourceUrl: request.sourceUrl, localPath: candidatePath });
    }
    const validated = existing
      .map((asset) => enrichExistingAsset(root, asset))
      .filter((asset): asset is ColorMediaLocalAsset => Boolean(asset));
    return { entry, requested, validated, failures: [] as string[] };
  });
  const checksumPaths = new Map<string, string>();
  for (const { validated } of prepared) {
    for (const asset of validated) {
      if (asset.checksum) checksumPaths.set(asset.checksum, asset.localPath);
    }
  }
  const work = prepared.flatMap((item, index) => item.entry.sourceHasMedia
    ? item.requested
      .filter((request) => !item.validated.some((asset) => asset.role === request.role && asset.sourceUrl === request.sourceUrl))
      .map((request) => ({ index, request }))
    : []);
  const finalize = (): ColorMediaDiscoveryArtifact => ({
    ...options.artifact,
    entries: prepared.map(({ entry, validated, failures }) => {
      if (!entry.sourceHasMedia) return entry;
      const primary = validated.find((asset) => asset.role === "swatch") ?? validated.find((asset) => asset.role === "fullsheet") ?? validated[0];
      return {
        ...entry,
        localAssets: validated,
        localPath: primary?.localPath,
        checksum: primary?.checksum,
        mimeType: primary?.mimeType,
        width: primary?.width,
        height: primary?.height,
        reasonCode: failures.length ? "SOURCE_HAS_IMAGE_DOWNLOAD_FAILED" : entry.reasonCode,
        error: failures.length ? failures.join("; ") : undefined,
      };
    }),
  });
  const batchSize = 12;
  for (let offset = 0; offset < work.length; offset += batchSize) {
    const batch = work.slice(offset, offset + batchSize);
    const results = await fetchExactSupplierPreviewsWithCache(
      batch.map(({ request }) => ({ supplier: options.artifact.supplier, sourceUrl: request.sourceUrl })),
      {
        cacheFile,
        concurrency: options.concurrency ?? 6,
        maxConcurrency: 6,
        minDelayMs: options.minDelayMs ?? 150,
        retries: 2,
        timeoutMs: 60_000,
        maxBytes: 64 * 1024 * 1024,
        refreshFailed: true,
      },
    );
    const transformed = await Promise.all(batch.map(async ({ index, request }) => {
      if (!isAllowedSupplierMediaUrl(options.artifact.supplier, request.sourceUrl)) {
        return { index, request, error: "media URL is outside the supplier allowlist" };
      }
      const result = results.get(`${options.artifact.supplier}|${request.sourceUrl}`);
      if (!result || result.status !== "downloaded") {
        return { index, request, error: result?.origin.error ?? "media download failed" };
      }
      try {
        const sourceInfo = inspectMediaBytes(result.bytes, result.origin.mimeType);
        if (sourceInfo.width < 32 || sourceInfo.height < 32) throw new Error("Source image is smaller than 32x32");
        const pipeline = sharp(result.bytes, { failOn: "error" }).rotate();
        if (request.role === "fullsheet") {
          pipeline.resize({
            width: 1600,
            height: 1600,
            fit: "inside",
            withoutEnlargement: true,
          });
        }
        const output = request.role === "fullsheet"
          ? await pipeline
            .withMetadata()
            .webp({ quality: 92, effort: 0, smartSubsample: true })
            .toBuffer()
          : await pipeline.webp({ lossless: true, effort: 0 }).toBuffer();
        const outputInfo = inspectMediaBytes(output, "image/webp");
        const checksum = createHash("sha256").update(output).digest("hex");
        return { index, request, output, outputInfo, checksum };
      } catch (error) {
        return { index, request, error: error instanceof Error ? error.message : String(error) };
      }
    }));
    for (const result of transformed) {
      const { index, request } = result;
      const item = prepared[index]!;
      if ("error" in result) {
        item.failures.push(`${request.role}: ${result.error}`);
        continue;
      }
      const { output, outputInfo, checksum } = result;
      const material = options.materialByCode.get(item.entry.codeNormalized) ?? "other-decorative";
      let localPath = checksumPaths.get(checksum);
      if (!localPath) {
        localPath = semanticMediaPath(options.artifact.supplier, material, item.entry.codeRaw, request.role, request.ordinal);
        const target = path.join(root, "public", localPath.replace(/^\//, ""));
        fs.mkdirSync(path.dirname(target), { recursive: true });
        if (!fs.existsSync(target) || createHash("sha256").update(fs.readFileSync(target)).digest("hex") !== checksum) {
          const temporary = `${target}.${process.pid}.tmp`;
          fs.writeFileSync(temporary, output);
          fs.renameSync(temporary, target);
        }
        checksumPaths.set(checksum, localPath);
      }
      item.validated.push({
        role: request.role,
        sourceUrl: request.sourceUrl,
        localPath,
        checksum,
        mimeType: "image/webp",
        width: outputInfo.width,
        height: outputInfo.height,
      });
    }
    if (options.checkpointRelativePath) writeColorMediaArtifact(root, options.checkpointRelativePath, finalize());
  }
  return finalize();
}

export function writeColorMediaArtifact(root: string, relative: string, artifact: ColorMediaDiscoveryArtifact) {
  const target = path.join(root, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const temporary = `${target}.${process.pid}.tmp`;
  fs.writeFileSync(temporary, `${JSON.stringify(artifact, null, 2)}\n`);
  fs.renameSync(temporary, target);
}
