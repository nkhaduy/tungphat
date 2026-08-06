import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { SupplierId } from "../core/types";

export type SupplierMediaRole =
  | "primary"
  | "gallery"
  | "preview"
  | "swatch"
  | "product"
  | "application"
  | "catalogue-cover"
  | "technical-diagram"
  | "other";

export type SupplierMediaState =
  | "LOCAL_PREVIEW"
  | "ORIGINAL_PROVENANCE_ONLY"
  | "UNRESOLVED"
  | "DEFERRED"
  | "INVALID";

export type SupplierMediaSourceKind =
  | "archival-original"
  | "supplier-thumbnail";

export type SupplierMediaOrigin = {
  sourceUrl: string;
  finalUrl?: string;
  redirectChain: string[];
  httpStatus?: number;
  mimeType?: string;
  contentLength: number | "unknown";
  sourceChecksum?: string;
  error?: string;
  rateLimited?: boolean;
  retryAfter?: string;
};

export type SupplierMediaReference = {
  productId: string;
  role: SupplierMediaRole;
  sourceUrl: string;
};

export type SupplierMediaDelivery = {
  kind: "exact-source-bytes" | "legacy-transformed";
  localPath: string;
  mimeType: string;
  width: number;
  height: number;
  bytes: number;
  checksum: string;
};

export type SupplierMediaAsset = {
  assetId: string;
  sourceKind: SupplierMediaSourceKind;
  origins: SupplierMediaOrigin[];
  references: SupplierMediaReference[];
  state: SupplierMediaState;
  delivery?: SupplierMediaDelivery;
  reason?: string;
  rightsStatus: "UNCONFIRMED";
};

export type SupplierMediaManifest = {
  schemaVersion: 1;
  supplier: SupplierId;
  generatedAt: string;
  assets: SupplierMediaAsset[];
  checksum: string;
};

export type SupplierMediaValidationIssue = {
  code: string;
  message: string;
  assetId?: string;
  url?: string;
};

export type SupplierMediaCapacityCounts = {
  totalRefs: number;
  uniqueUrls: number;
  localPreviewRefs: number;
  localPreviewFiles: number;
  localPreviewBytes: number;
  originalProvenanceOnlyRefs: number;
  unresolvedDeferredRefs: number;
  invalidRefs: number;
  rightsStatus: "UNCONFIRMED";
};

export type MediaCapacitySummary = {
  schemaVersion: 1;
  suppliers: Partial<Record<SupplierId, SupplierMediaCapacityCounts>>;
  combined: SupplierMediaCapacityCounts;
  publicDelivery: {
    scope: "STATIC_OUTPUT" | "PREBUILD_SOURCE_PUBLIC";
    directory?: string;
    fileCount: number;
    bytes: number;
    maxFileBytes: number;
    cloudflarePagesFileLimit: number;
    cloudflarePagesMaxFileBytes: number;
    fileCountGate: "PASS" | "FAIL";
    maxFileGate: "PASS" | "FAIL";
  };
};

const ALLOWED_MEDIA_HOSTS: Record<SupplierId, ReadonlySet<string>> = {
  "an-cuong": new Set([
    "ancuong.com",
    "www.ancuong.com",
    "acshopping.ancuong.com",
  ]),
  "ba-thanh": new Set(["bathanh.com.vn", "www.bathanh.com.vn"]),
  "thanh-thuy": new Set(["gothanhthuy.com", "www.gothanhthuy.com"]),
};

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

function sortOrigins(origins: SupplierMediaOrigin[]): SupplierMediaOrigin[] {
  return [...origins]
    .map((origin) => ({ ...origin, redirectChain: [...origin.redirectChain] }))
    .sort((left, right) => left.sourceUrl.localeCompare(right.sourceUrl));
}

function sortReferences(references: SupplierMediaReference[]): SupplierMediaReference[] {
  return [...references].sort(
    (left, right) =>
      left.productId.localeCompare(right.productId) ||
      left.role.localeCompare(right.role) ||
      left.sourceUrl.localeCompare(right.sourceUrl),
  );
}

function sortAssets(assets: SupplierMediaAsset[]): SupplierMediaAsset[] {
  return [...assets]
    .map((asset) => ({
      ...asset,
      origins: sortOrigins(asset.origins),
      references: sortReferences(asset.references),
    }))
    .sort((left, right) => left.assetId.localeCompare(right.assetId));
}

export function checksumSupplierMediaManifest(manifest: SupplierMediaManifest): string {
  return createHash("sha256")
    .update(
      JSON.stringify(
        stableValue({
          schemaVersion: manifest.schemaVersion,
          supplier: manifest.supplier,
          assets: sortAssets(manifest.assets),
        }),
      ),
    )
    .digest("hex");
}

function pngInfo(bytes: Buffer) {
  if (
    bytes.length < 24 ||
    !bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  ) return undefined;
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
    if (bytes[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = bytes[offset + 1]!;
    if (marker === 0xd9 || marker === 0xda) break;
    const length = bytes.readUInt16BE(offset + 2);
    if (length < 2 || offset + length + 2 > bytes.length) break;
    if (
      (marker >= 0xc0 && marker <= 0xc3) ||
      (marker >= 0xc5 && marker <= 0xc7) ||
      (marker >= 0xc9 && marker <= 0xcb) ||
      (marker >= 0xcd && marker <= 0xcf)
    ) {
      return {
        mimeType: "image/jpeg",
        width: bytes.readUInt16BE(offset + 7),
        height: bytes.readUInt16BE(offset + 5),
      };
    }
    offset += length + 2;
  }
  throw new Error("JPEG image has no readable dimensions");
}

function webpInfo(bytes: Buffer) {
  if (
    bytes.length < 30 ||
    bytes.subarray(0, 4).toString("ascii") !== "RIFF" ||
    bytes.subarray(8, 12).toString("ascii") !== "WEBP"
  ) return undefined;
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
    return {
      mimeType: "image/webp",
      width: (bits & 0x3fff) + 1,
      height: ((bits >> 14) & 0x3fff) + 1,
    };
  }
  if (format === "VP8 ") {
    const frame = bytes.indexOf(Buffer.from([0x9d, 0x01, 0x2a]), 20);
    if (frame >= 0 && frame + 7 <= bytes.length) {
      return {
        mimeType: "image/webp",
        width: bytes.readUInt16LE(frame + 3) & 0x3fff,
        height: bytes.readUInt16LE(frame + 5) & 0x3fff,
      };
    }
  }
  throw new Error("WEBP image has no readable dimensions");
}

export function inspectMediaBytes(
  bytes: Buffer,
  declaredMime?: string,
): { mimeType: string; width: number; height: number } {
  const prefix = bytes
    .subarray(0, Math.min(bytes.length, 512))
    .toString("utf8")
    .trimStart()
    .toLowerCase();
  if (
    prefix.startsWith("<!doctype html") ||
    prefix.startsWith("<html") ||
    prefix.includes("captcha") ||
    prefix.includes("attention required")
  ) throw new Error("Response is not an image");
  const detected = pngInfo(bytes) ?? gifInfo(bytes) ?? jpegInfo(bytes) ?? webpInfo(bytes);
  if (!detected) throw new Error("Unsupported or corrupt image payload");
  const normalizedDeclared = declaredMime?.split(";", 1)[0]?.trim().toLowerCase();
  if (normalizedDeclared?.startsWith("image/") && normalizedDeclared !== detected.mimeType) {
    throw new Error(`Declared MIME ${normalizedDeclared} does not match detected MIME ${detected.mimeType}`);
  }
  if (detected.width < 1 || detected.height < 1) throw new Error("Image dimensions are invalid");
  return detected;
}

export function classifySupplierMediaOrigin(
  origin: SupplierMediaOrigin,
): { state: "ORIGINAL_PROVENANCE_ONLY" | "UNRESOLVED" | "INVALID"; reason: string } {
  if (origin.httpStatus === 200 && origin.mimeType && !origin.mimeType.startsWith("image/")) {
    return { state: "INVALID", reason: `Supplier media HEAD returned non-image MIME ${origin.mimeType}.` };
  }
  if (origin.rateLimited || origin.httpStatus === 429) {
    return { state: "UNRESOLVED", reason: `Supplier media HEAD was rate-limited (HTTP 429${origin.retryAfter ? `; Retry-After ${origin.retryAfter}` : ""}).` };
  }
  if (origin.httpStatus === 404 || origin.httpStatus === 410) {
    return { state: "UNRESOLVED", reason: `Supplier media returned HTTP ${origin.httpStatus}; no local path was invented.` };
  }
  if (origin.httpStatus && origin.httpStatus >= 400) {
    return { state: "UNRESOLVED", reason: `Supplier media metadata returned HTTP ${origin.httpStatus}; original bytes were not downloaded.` };
  }
  return {
    state: "ORIGINAL_PROVENANCE_ONLY",
    reason: origin.error
      ? "Public source reference retained; metadata was unavailable and no original GET was attempted."
      : "Archival original retained as inventory-only provenance because projected full-image download exceeds safe capacity.",
  };
}

export type ExactSupplierPreviewResult =
  | { status: "downloaded"; bytes: Buffer; origin: SupplierMediaOrigin }
  | { status: "rate-limited" | "failed"; origin: SupplierMediaOrigin };

export type ExactSupplierPreviewRequest = SupplierMediaInventoryRequest;

export type ExactSupplierPreviewOptions = {
  fetchImpl?: typeof fetch;
  retries?: number;
  maxRedirects?: number;
  timeoutMs?: number;
};

function parseContentLength(response: Response): number | "unknown" {
  const raw = response.headers.get("content-length");
  if (raw === null || raw.trim() === "") return "unknown";
  const parsed = Number(raw);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : "unknown";
}

async function readResponseBytesWithLimit(
  response: Response,
  maxBytes: number,
): Promise<Buffer> {
  if (!response.body) throw new Error("Supplier preview response has no readable body");
  const reader = response.body.getReader();
  const chunks: Buffer[] = [];
  let total = 0;
  try {
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      const chunk = Buffer.from(next.value);
      total += chunk.length;
      if (total > maxBytes) {
        await reader.cancel("25 MiB per-file gate exceeded");
        throw new Error("Supplier preview exceeds the 25 MiB per-file gate");
      }
      chunks.push(chunk);
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks, total);
}

export async function fetchExactSupplierPreview(
  supplier: SupplierId,
  sourceUrl: string,
  options: ExactSupplierPreviewOptions = {},
): Promise<ExactSupplierPreviewResult> {
  if (!isAllowedSupplierMediaUrl(supplier, sourceUrl)) {
    throw new Error(`Supplier preview URL is not HTTPS on an allowlisted host: ${sourceUrl}`);
  }
  const fetchImpl = options.fetchImpl ?? fetch;
  const retries = Math.max(0, Math.min(options.retries ?? 2, 4));
  const maxRedirects = Math.max(0, Math.min(options.maxRedirects ?? 5, 10));
  const timeoutMs = Math.max(1, options.timeoutMs ?? 20_000);
  const deadline = Date.now() + timeoutMs;
  const controller = new AbortController();
  const deadlineTimer = setTimeout(() => controller.abort(), timeoutMs);
  const redirectChain: string[] = [];
  const visited = new Set([sourceUrl]);
  let currentUrl = sourceUrl;
  try {
    for (let redirects = 0; ; redirects += 1) {
      let response: Response | undefined;
      let lastError: unknown;
      for (let attempt = 0; attempt <= retries; attempt += 1) {
        const remaining = deadline - Date.now();
        if (remaining <= 0) throw new Error(`Supplier preview deadline exceeded: ${sourceUrl}`);
        try {
          response = await fetchImpl(currentUrl, {
            method: "GET",
            redirect: "manual",
            signal: controller.signal,
            headers: {
              accept: "image/avif,image/webp,image/png,image/jpeg,image/gif",
              "user-agent": "TungPhat-Supplier-Preview-Importer/1.0 (+https://mdftungphat.com)",
            },
          });
        } catch (error) {
          lastError = error;
          if (attempt === retries) throw error;
          const delay = Math.min(250 * 2 ** attempt, Math.max(0, deadline - Date.now()));
          if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
        if (![408, 425, 500, 502, 503, 504].includes(response.status) || attempt === retries) break;
        const delay = Math.min(250 * 2 ** attempt, Math.max(0, deadline - Date.now()));
        if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay));
      }
      if (!response) throw lastError instanceof Error ? lastError : new Error(`Supplier preview GET failed: ${currentUrl}`);
      const contentLength = response.status === 429 ? "unknown" : parseContentLength(response);
      const baseOrigin: SupplierMediaOrigin = {
        sourceUrl,
        finalUrl: currentUrl,
        redirectChain: [...redirectChain],
        httpStatus: response.status,
        mimeType: response.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase(),
        contentLength,
      };
      if (response.status === 429) {
        return {
          status: "rate-limited",
          origin: {
            ...baseOrigin,
            error: "HTTP 429 rate limited",
            rateLimited: true,
            retryAfter: response.headers.get("retry-after") ?? undefined,
          },
        };
      }
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get("location");
        if (!location) throw new Error(`Supplier media redirect is missing Location: ${currentUrl}`);
        if (redirects >= maxRedirects) throw new Error(`Supplier media redirect limit exceeded: ${sourceUrl}`);
        const redirected = new URL(location, currentUrl).toString();
        if (!isAllowedSupplierMediaUrl(supplier, redirected)) throw new Error(`Supplier media redirect left allowlisted HTTPS hosts: ${redirected}`);
        if (visited.has(redirected)) throw new Error(`Supplier media redirect cycle detected: ${redirected}`);
        visited.add(redirected);
        redirectChain.push(redirected);
        currentUrl = redirected;
        continue;
      }
      if (!response.ok) throw new Error(`Supplier preview GET returned HTTP ${response.status}`);
      if (contentLength === "unknown") throw new Error("Supplier preview Content-Length is unknown; no body was read");
      if (contentLength > 25 * 1024 * 1024) throw new Error("Supplier preview exceeds the 25 MiB per-file gate");
      const bytes = await readResponseBytesWithLimit(response, 25 * 1024 * 1024);
      const info = inspectMediaBytes(bytes, baseOrigin.mimeType);
      return {
        status: "downloaded",
        bytes,
        origin: { ...baseOrigin, mimeType: info.mimeType, contentLength: bytes.length },
      };
    }
  } finally {
    clearTimeout(deadlineTimer);
  }
}

type ExactSupplierPreviewCheckpoint = {
  schemaVersion: 1;
  results: Record<string, ExactSupplierPreviewResult["origin"] & { status: "rate-limited" | "failed" }>;
};

function writePreviewCheckpoint(file: string, results: Map<string, ExactSupplierPreviewResult["origin"] & { status: "rate-limited" | "failed" }>): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temporary = `${file}.${process.pid}.tmp`;
  const checkpoint: ExactSupplierPreviewCheckpoint = {
    schemaVersion: 1,
    results: Object.fromEntries([...results].sort(([left], [right]) => left.localeCompare(right))),
  };
  fs.writeFileSync(temporary, `${JSON.stringify(checkpoint, null, 2)}\n`);
  fs.renameSync(temporary, file);
}

export async function fetchExactSupplierPreviewsWithCache(
  requests: ExactSupplierPreviewRequest[],
  options: ExactSupplierPreviewOptions & {
    cacheFile: string;
    concurrency?: number;
    minDelayMs?: number;
    refreshRateLimited?: boolean;
    offline?: boolean;
  },
): Promise<Map<string, ExactSupplierPreviewResult>> {
  const checkpoint = fs.existsSync(options.cacheFile)
    ? JSON.parse(fs.readFileSync(options.cacheFile, "utf8")) as ExactSupplierPreviewCheckpoint
    : undefined;
  const cached = new Map(Object.entries(checkpoint?.results ?? {}));
  const unique = new Map(requests.map((request) => [`${request.supplier}|${request.sourceUrl}`, request]));
  const pending = [...unique].sort(([left], [right]) => left.localeCompare(right));
  const results = new Map<string, ExactSupplierPreviewResult>();
  const concurrency = Math.max(1, Math.min(options.concurrency ?? 3, 3, pending.length || 1));
  const minDelayMs = Math.max(0, options.minDelayMs ?? 0);
  let cursor = 0;
  let requestGate = Promise.resolve();
  const nextByHost = new Map<string, number>();
  const pace = async (host: string) => {
    const previous = requestGate;
    let release = () => {};
    requestGate = new Promise<void>((resolve) => { release = resolve; });
    await previous;
    const delay = Math.max(0, (nextByHost.get(host) ?? 0) - Date.now());
    if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay));
    nextByHost.set(host, Date.now() + minDelayMs);
    release();
  };
  const worker = async () => {
    while (cursor < pending.length) {
      const [key, request] = pending[cursor++]!;
      const cachedResult = cached.get(key);
      if (cachedResult && !(cachedResult.status === "rate-limited" && options.refreshRateLimited)) {
        const { status, ...origin } = cachedResult;
        results.set(key, { status, origin });
        continue;
      }
      if (options.offline) {
        const origin: SupplierMediaOrigin = { sourceUrl: request.sourceUrl, redirectChain: [], contentLength: "unknown", error: "Offline preview fetch skipped; no local exact bytes were cached." };
        const failed = { status: "failed" as const, ...origin };
        results.set(key, { status: "failed", origin });
        cached.set(key, failed);
        writePreviewCheckpoint(options.cacheFile, cached);
        continue;
      }
      try {
        await pace(new URL(request.sourceUrl).hostname.toLowerCase());
        const result = await fetchExactSupplierPreview(request.supplier, request.sourceUrl, options);
        results.set(key, result);
        if (result.status === "rate-limited") {
          cached.set(key, { status: "rate-limited", ...result.origin });
          writePreviewCheckpoint(options.cacheFile, cached);
        }
      } catch (error) {
        const origin: SupplierMediaOrigin = {
          sourceUrl: request.sourceUrl,
          redirectChain: [],
          contentLength: "unknown",
          error: error instanceof Error ? error.message : String(error),
        };
        const failed = { status: "failed" as const, ...origin };
        results.set(key, { status: "failed", origin });
        cached.set(key, failed);
        writePreviewCheckpoint(options.cacheFile, cached);
      }
    }
  };
  await Promise.all(Array.from({ length: concurrency }, worker));
  if (!fs.existsSync(options.cacheFile) && cached.size) writePreviewCheckpoint(options.cacheFile, cached);
  return results;
}

function uniqueBy<T>(values: T[], key: (value: T) => string): T[] {
  const seen = new Set<string>();
  return values.filter((value) => {
    const identity = key(value);
    if (seen.has(identity)) return false;
    seen.add(identity);
    return true;
  });
}

export function mergeMediaAssetsByChecksum(assets: SupplierMediaAsset[]): SupplierMediaAsset[] {
  const merged: SupplierMediaAsset[] = [];
  const byChecksum = new Map<string, SupplierMediaAsset>();
  for (const value of assets) {
    const asset = {
      ...value,
      origins: [...value.origins],
      references: [...value.references],
    };
    const checksum = asset.delivery?.checksum;
    if (!checksum) {
      merged.push(asset);
      continue;
    }
    const existing = byChecksum.get(checksum);
    if (!existing) {
      asset.assetId = `sha256:${checksum}`;
      byChecksum.set(checksum, asset);
      merged.push(asset);
      continue;
    }
    existing.origins = uniqueBy(
      [...existing.origins, ...asset.origins],
      (origin) => origin.sourceUrl,
    );
    existing.references = uniqueBy(
      [...existing.references, ...asset.references],
      (reference) => `${reference.productId}|${reference.role}|${reference.sourceUrl}`,
    );
  }
  return sortAssets(merged);
}

function capacityCounts(manifests: SupplierMediaManifest[]): SupplierMediaCapacityCounts {
  const assets = manifests.flatMap((manifest) => manifest.assets);
  const origins = new Set(assets.flatMap((asset) => asset.origins.map((origin) => origin.sourceUrl)));
  const localFiles = new Map<string, number>();
  for (const asset of assets) {
    if (asset.delivery && !localFiles.has(asset.delivery.localPath)) {
      localFiles.set(asset.delivery.localPath, asset.delivery.bytes);
    }
  }
  const countReferences = (states: SupplierMediaState[]) =>
    assets
      .filter((asset) => states.includes(asset.state))
      .reduce((total, asset) => total + asset.references.length, 0);
  return {
    totalRefs: assets.reduce((total, asset) => total + asset.references.length, 0),
    uniqueUrls: origins.size,
    localPreviewRefs: countReferences(["LOCAL_PREVIEW"]),
    localPreviewFiles: localFiles.size,
    localPreviewBytes: [...localFiles.values()].reduce((total, bytes) => total + bytes, 0),
    originalProvenanceOnlyRefs: countReferences(["ORIGINAL_PROVENANCE_ONLY"]),
    unresolvedDeferredRefs: countReferences(["UNRESOLVED", "DEFERRED"]),
    invalidRefs: countReferences(["INVALID"]),
    rightsStatus: "UNCONFIRMED",
  };
}

export function buildMediaCapacitySummary(
  manifests: SupplierMediaManifest[],
  publicDelivery: {
    publicFileCount: number;
    publicBytes: number;
    maxPublicFileBytes: number;
    scope?: "STATIC_OUTPUT" | "PREBUILD_SOURCE_PUBLIC";
    directory?: string;
  },
): MediaCapacitySummary {
  const suppliers: Partial<Record<SupplierId, SupplierMediaCapacityCounts>> = {};
  for (const supplier of ["an-cuong", "ba-thanh", "thanh-thuy"] as const) {
    const matching = manifests.filter((manifest) => manifest.supplier === supplier);
    if (matching.length) suppliers[supplier] = capacityCounts(matching);
  }
  return {
    schemaVersion: 1,
    suppliers,
    combined: capacityCounts(manifests),
    publicDelivery: {
      scope: publicDelivery.scope ?? "PREBUILD_SOURCE_PUBLIC",
      directory: publicDelivery.directory,
      fileCount: publicDelivery.publicFileCount,
      bytes: publicDelivery.publicBytes,
      maxFileBytes: publicDelivery.maxPublicFileBytes,
      cloudflarePagesFileLimit: 20_000,
      cloudflarePagesMaxFileBytes: 25 * 1024 * 1024,
      fileCountGate: publicDelivery.publicFileCount <= 20_000 ? "PASS" : "FAIL",
      maxFileGate: publicDelivery.maxPublicFileBytes <= 25 * 1024 * 1024 ? "PASS" : "FAIL",
    },
  };
}

export function selectCapacitySafePreviewUrls(
  urls: string[],
  options: { enabled: boolean; limit: number },
): string[] {
  if (!options.enabled) return [];
  if (!Number.isSafeInteger(options.limit) || options.limit < 1 || options.limit > 50) {
    throw new Error("Preview GET selection requires an integer limit from 1 to 50");
  }
  return [...new Set(urls)].sort().slice(0, options.limit);
}

function validateAllowedUrl(
  supplier: SupplierId,
  input: string,
  codes: { protocol: string; host: string },
  assetId: string,
  issues: SupplierMediaValidationIssue[],
): void {
  try {
    const url = new URL(input);
    if (url.protocol !== "https:") {
      issues.push({ code: codes.protocol, message: "Supplier media URL must use HTTPS", assetId, url: input });
    }
    if (!ALLOWED_MEDIA_HOSTS[supplier].has(url.hostname.toLowerCase())) {
      issues.push({ code: codes.host, message: "Supplier media URL host is not allowlisted", assetId, url: input });
    }
  } catch {
    issues.push({ code: codes.protocol, message: "Supplier media URL is invalid", assetId, url: input });
    issues.push({ code: codes.host, message: "Supplier media URL host is not allowlisted", assetId, url: input });
  }
}

export function validateSupplierMediaManifest(
  manifest: SupplierMediaManifest,
  options: { knownLocalPaths?: ReadonlySet<string> } = {},
): SupplierMediaValidationIssue[] {
  const issues: SupplierMediaValidationIssue[] = [];
  const knownOrigins = new Set<string>();
  for (const asset of manifest.assets) {
    if (asset.rightsStatus !== "UNCONFIRMED") {
      issues.push({ code: "RIGHTS_STATUS_INVALID", message: "Supplier media rights must remain UNCONFIRMED", assetId: asset.assetId });
    }
    if (!asset.origins.length) {
      issues.push({ code: "SOURCE_ORIGIN_REQUIRED", message: "Media asset must preserve at least one source origin", assetId: asset.assetId });
    }
    for (const origin of asset.origins) {
      knownOrigins.add(origin.sourceUrl);
      validateAllowedUrl(
        manifest.supplier,
        origin.sourceUrl,
        { protocol: "SOURCE_URL_NOT_HTTPS", host: "SOURCE_HOST_NOT_ALLOWED" },
        asset.assetId,
        issues,
      );
      for (const redirect of origin.redirectChain) {
        validateAllowedUrl(
          manifest.supplier,
          redirect,
          { protocol: "REDIRECT_URL_NOT_HTTPS", host: "REDIRECT_HOST_NOT_ALLOWED" },
          asset.assetId,
          issues,
        );
      }
      if (origin.finalUrl) {
        validateAllowedUrl(
          manifest.supplier,
          origin.finalUrl,
          { protocol: "REDIRECT_URL_NOT_HTTPS", host: "REDIRECT_HOST_NOT_ALLOWED" },
          asset.assetId,
          issues,
        );
      }
      if (origin.contentLength !== "unknown" && (!Number.isSafeInteger(origin.contentLength) || origin.contentLength < 0)) {
        issues.push({ code: "CONTENT_LENGTH_INVALID", message: "Content-Length must be a non-negative integer or unknown", assetId: asset.assetId, url: origin.sourceUrl });
      }
      if (origin.httpStatus === 200 && origin.mimeType && !origin.mimeType.startsWith("image/")) {
        issues.push({ code: "SOURCE_MIME_INVALID", message: `Successful supplier media origin returned non-image MIME ${origin.mimeType}`, assetId: asset.assetId, url: origin.sourceUrl });
      }
    }
    for (const reference of asset.references) {
      if (!asset.origins.some((origin) => origin.sourceUrl === reference.sourceUrl)) {
        issues.push({ code: "REFERENCE_SOURCE_MISSING", message: "Media reference must point to a preserved source origin", assetId: asset.assetId, url: reference.sourceUrl });
      }
    }
    if (["UNRESOLVED", "DEFERRED", "INVALID"].includes(asset.state) && !asset.reason?.trim()) {
      issues.push({ code: "UNRESOLVED_REASON_REQUIRED", message: `${asset.state} media requires an explicit reason`, assetId: asset.assetId });
    }
    if (asset.state === "LOCAL_PREVIEW" && !asset.delivery) {
      issues.push({ code: "LOCAL_DELIVERY_REQUIRED", message: "LOCAL_PREVIEW media requires local delivery metadata", assetId: asset.assetId });
    }
    if (asset.state !== "LOCAL_PREVIEW" && asset.delivery) {
      issues.push({ code: "DELIVERY_STATE_INVALID", message: "Only LOCAL_PREVIEW media may declare a delivery asset", assetId: asset.assetId });
    }
    if (asset.delivery) {
      const localPath = asset.delivery.localPath;
      if (/^https?:\/\//i.test(localPath)) {
        issues.push({ code: "HOTLINK_NOT_ALLOWED", message: "Delivery paths must be local, never supplier hotlinks", assetId: asset.assetId, url: localPath });
      }
      const expectedPrefix = `/catalog/${manifest.supplier}/`;
      if (!localPath.startsWith(expectedPrefix)) {
        issues.push({ code: "LOCAL_PATH_OUTSIDE_SUPPLIER", message: `Delivery path must start with ${expectedPrefix}`, assetId: asset.assetId, url: localPath });
      }
      if (options.knownLocalPaths && !options.knownLocalPaths.has(localPath)) {
        issues.push({ code: "LOCAL_FILE_NOT_IN_INVENTORY", message: "Delivery path does not correspond to a verified local file", assetId: asset.assetId, url: localPath });
      }
      if (!/^image\/(?:avif|gif|jpeg|png|webp)$/.test(asset.delivery.mimeType)) {
        issues.push({ code: "LOCAL_MIME_INVALID", message: "Delivery MIME is not a supported image type", assetId: asset.assetId });
      }
      if (!Number.isSafeInteger(asset.delivery.width) || asset.delivery.width < 1 || !Number.isSafeInteger(asset.delivery.height) || asset.delivery.height < 1) {
        issues.push({ code: "LOCAL_DIMENSIONS_INVALID", message: "Delivery dimensions must be positive integers", assetId: asset.assetId });
      }
      if (!Number.isSafeInteger(asset.delivery.bytes) || asset.delivery.bytes < 1) {
        issues.push({ code: "LOCAL_BYTES_INVALID", message: "Delivery byte length must be positive", assetId: asset.assetId });
      }
      if (!/^[a-f0-9]{64}$/.test(asset.delivery.checksum)) {
        issues.push({ code: "LOCAL_CHECKSUM_INVALID", message: "Delivery checksum must be SHA-256", assetId: asset.assetId });
      }
    }
  }
  if (manifest.checksum && manifest.checksum !== checksumSupplierMediaManifest(manifest)) {
    issues.push({ code: "MANIFEST_CHECKSUM_MISMATCH", message: "Manifest checksum does not match stable media contents" });
  }
  return issues;
}

export function isAllowedSupplierMediaUrl(supplier: SupplierId, input: string): boolean {
  try {
    const url = new URL(input);
    return url.protocol === "https:" && ALLOWED_MEDIA_HOSTS[supplier].has(url.hostname.toLowerCase());
  } catch {
    return false;
  }
}

export async function inventoryMediaOrigin(
  supplier: SupplierId,
  sourceUrl: string,
  options: {
    fetchImpl?: typeof fetch;
    retries?: number;
    backoffMs?: number;
    maxRedirects?: number;
    timeoutMs?: number;
  } = {},
): Promise<SupplierMediaOrigin> {
  if (!isAllowedSupplierMediaUrl(supplier, sourceUrl)) {
    throw new Error(`Supplier media URL is not HTTPS on an allowlisted host: ${sourceUrl}`);
  }
  const fetchImpl = options.fetchImpl ?? fetch;
  const retries = Math.max(0, Math.min(options.retries ?? 2, 4));
  const backoffMs = Math.max(0, options.backoffMs ?? 250);
  const maxRedirects = Math.max(0, Math.min(options.maxRedirects ?? 5, 10));
  const timeoutMs = Math.max(1, options.timeoutMs ?? 20_000);
  const deadline = Date.now() + timeoutMs;
  const redirectChain: string[] = [];
  const visited = new Set([sourceUrl]);
  let currentUrl = sourceUrl;

  for (let redirects = 0; ; redirects += 1) {
    let response: Response | undefined;
    let lastError: unknown;
    for (let attempt = 0; attempt <= retries; attempt += 1) {
      const remainingMs = deadline - Date.now();
      if (remainingMs <= 0) throw new Error(`Supplier media HEAD deadline exceeded: ${sourceUrl}`);
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), remainingMs);
      try {
        response = await fetchImpl(currentUrl, {
          method: "HEAD",
          redirect: "manual",
          signal: controller.signal,
          headers: {
            accept: "image/avif,image/webp,image/png,image/jpeg,image/gif,*/*;q=0.1",
            "user-agent": "TungPhat-Supplier-Media-Inventory/1.0 (+https://mdftungphat.com)",
          },
        });
        if (![408, 425, 500, 502, 503, 504].includes(response.status) || attempt === retries) break;
      } catch (error) {
        lastError = error;
        if (attempt === retries) throw error;
      } finally {
        clearTimeout(timer);
      }
      if (backoffMs > 0) {
        const delay = Math.min(backoffMs * 2 ** attempt, Math.max(0, deadline - Date.now()));
        if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
    if (!response) throw lastError instanceof Error ? lastError : new Error(`HEAD failed: ${currentUrl}`);
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");
      if (!location) throw new Error(`Supplier media redirect is missing Location: ${currentUrl}`);
      if (redirects >= maxRedirects) throw new Error(`Supplier media redirect limit exceeded: ${sourceUrl}`);
      const redirected = new URL(location, currentUrl).toString();
      if (!isAllowedSupplierMediaUrl(supplier, redirected)) {
        throw new Error(`Supplier media redirect is not HTTPS on an allowlisted host: ${redirected}`);
      }
      if (visited.has(redirected)) throw new Error(`Supplier media redirect cycle detected: ${redirected}`);
      visited.add(redirected);
      redirectChain.push(redirected);
      currentUrl = redirected;
      continue;
    }
    const rawLength = response.headers.get("content-length");
    const parsedLength = rawLength === null ? Number.NaN : Number(rawLength);
    const rateLimited = response.status === 429;
    return {
      sourceUrl,
      finalUrl: currentUrl,
      redirectChain,
      httpStatus: response.status,
      mimeType: response.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase(),
      contentLength:
        !rateLimited && Number.isSafeInteger(parsedLength) && parsedLength >= 0 ? parsedLength : "unknown",
      error: response.ok ? undefined : rateLimited ? "HTTP 429 rate limited" : `HTTP ${response.status}`,
      rateLimited: rateLimited || undefined,
      retryAfter: rateLimited ? response.headers.get("retry-after") ?? undefined : undefined,
    };
  }
}

export type SupplierMediaInventoryRequest = {
  supplier: SupplierId;
  sourceUrl: string;
};

type SupplierMediaInventoryCache = {
  schemaVersion: 1;
  origins: Record<string, SupplierMediaOrigin>;
};

function inventoryKey(request: SupplierMediaInventoryRequest): string {
  return `${request.supplier}|${request.sourceUrl}`;
}

function writeInventoryCache(file: string, origins: Map<string, SupplierMediaOrigin>): void {
  const cache: SupplierMediaInventoryCache = {
    schemaVersion: 1,
    origins: Object.fromEntries([...origins].sort(([left], [right]) => left.localeCompare(right))),
  };
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temporary = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(temporary, `${JSON.stringify(cache, null, 2)}\n`);
  fs.renameSync(temporary, file);
}

export async function inventoryMediaOriginsWithCache(
  requests: SupplierMediaInventoryRequest[],
  options: {
    cacheFile: string;
    fetchImpl?: typeof fetch;
    concurrency?: number;
    retries?: number;
    backoffMs?: number;
    timeoutMs?: number;
    refresh?: boolean;
    refreshRateLimited?: boolean;
    offline?: boolean;
    seed?: ReadonlyMap<string, SupplierMediaOrigin>;
    checkpointEvery?: number;
    onCheckpoint?: (completed: number, total: number) => void;
    minDelayMs?: number;
  },
): Promise<Map<string, SupplierMediaOrigin>> {
  const cachedFile = fs.existsSync(options.cacheFile)
    ? JSON.parse(fs.readFileSync(options.cacheFile, "utf8")) as SupplierMediaInventoryCache
    : undefined;
  let normalizedRateLimits = false;
  const cachedEntries = Object.entries(cachedFile?.origins ?? {}).map(([key, origin]) => {
    if (origin.httpStatus !== 429) return [key, origin] as const;
    normalizedRateLimits = normalizedRateLimits || origin.contentLength !== "unknown" || origin.rateLimited !== true;
    return [key, {
      ...origin,
      contentLength: "unknown" as const,
      error: origin.error ?? "HTTP 429 rate limited",
      rateLimited: true,
    }] as const;
  });
  const origins = new Map<string, SupplierMediaOrigin>([
    ...(options.seed ? [...options.seed] : []),
    ...cachedEntries,
  ]);
  if (normalizedRateLimits) writeInventoryCache(options.cacheFile, origins);
  const unique = new Map(requests.map((request) => [inventoryKey(request), request]));
  const pending = [...unique].sort(([left], [right]) => left.localeCompare(right));
  let cursor = 0;
  let completed = 0;
  let dirty = 0;
  const concurrency = Math.max(1, Math.min(options.concurrency ?? 3, 3, pending.length || 1));
  const checkpointEvery = Math.max(1, options.checkpointEvery ?? 20);
  const minDelayMs = Math.max(0, options.minDelayMs ?? 0);
  let requestGate = Promise.resolve();
  const nextRequestAt = new Map<string, number>();
  const pace = async (host: string) => {
    const previous = requestGate;
    let release = () => {};
    requestGate = new Promise<void>((resolve) => { release = resolve; });
    await previous;
    const delay = Math.max(0, (nextRequestAt.get(host) ?? 0) - Date.now());
    if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay));
    nextRequestAt.set(host, Date.now() + minDelayMs);
    release();
  };
  const worker = async () => {
    while (cursor < pending.length) {
      const [key, request] = pending[cursor++]!;
      const cached = origins.get(key);
      const cachedRateLimited = cached?.rateLimited === true || cached?.httpStatus === 429;
      const shouldRefresh = cachedRateLimited
        ? options.refreshRateLimited === true
        : options.refresh === true;
      if (cached && !shouldRefresh) {
        completed += 1;
        continue;
      }
      let origin: SupplierMediaOrigin;
      if (options.offline) {
        origin = {
          sourceUrl: request.sourceUrl,
          redirectChain: [],
          contentLength: "unknown",
          error: "No cached public HEAD metadata; offline inventory did not fetch supplier media.",
        };
      } else {
        try {
          await pace(new URL(request.sourceUrl).hostname.toLowerCase());
          origin = await inventoryMediaOrigin(request.supplier, request.sourceUrl, {
            fetchImpl: options.fetchImpl,
            retries: options.retries,
            backoffMs: options.backoffMs,
            timeoutMs: options.timeoutMs,
          });
        } catch (error) {
          origin = {
            sourceUrl: request.sourceUrl,
            redirectChain: [],
            contentLength: "unknown",
            error: error instanceof Error ? error.message : String(error),
          };
        }
      }
      origins.set(key, origin);
      completed += 1;
      dirty += 1;
      if (dirty >= checkpointEvery) {
        writeInventoryCache(options.cacheFile, origins);
        dirty = 0;
        options.onCheckpoint?.(completed, pending.length);
      }
    }
  };
  await Promise.all(Array.from({ length: concurrency }, worker));
  if (dirty > 0 || !fs.existsSync(options.cacheFile)) {
    writeInventoryCache(options.cacheFile, origins);
    options.onCheckpoint?.(completed, pending.length);
  }
  return new Map([...unique.keys()].map((key) => [key, origins.get(key)!]));
}
