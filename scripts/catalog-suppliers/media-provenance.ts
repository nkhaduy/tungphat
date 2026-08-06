import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {
  buildMediaCapacitySummary,
  checksumSupplierMediaManifest,
  inspectMediaBytes,
  inventoryMediaOriginsWithCache,
  isAllowedSupplierMediaUrl,
  mergeMediaAssetsByChecksum,
  selectCapacitySafePreviewUrls,
  validateSupplierMediaManifest,
  type SupplierMediaAsset,
  type SupplierMediaManifest,
  type SupplierMediaOrigin,
  type SupplierMediaReference,
  type SupplierMediaRole,
} from "../../lib/catalog/full-import/media";
import type { SupplierId } from "../../lib/catalog/core/types";

const ROOT = process.cwd();
const PUBLIC_ROOT = path.join(ROOT, "public");
const PUBLIC_CATALOG = path.join(PUBLIC_ROOT, "catalog");
const AN_CUONG_PUBLIC = path.join(PUBLIC_CATALOG, "an-cuong");
const MAX_FILE_BYTES = 25 * 1024 * 1024;
const MAX_NEW_PREVIEW_BYTES = 384 * 1024 * 1024;
const MIN_FREE_DISK_RESERVE_BYTES = 8 * 1024 * 1024 * 1024;
const SAFE_PUBLIC_FILE_COUNT = 18_000;
const DEFAULT_CONCURRENCY = 3;

type JsonRecord = Record<string, unknown>;
type ExistingOrigins = Map<string, SupplierMediaOrigin>;

type AnCuongProduct = {
  sourceId?: string;
  sourceUrl: string;
  productCode?: string;
  normalizedProductCode?: string;
  primaryImage?: { sourceUrl?: string };
  gallery?: Array<{ sourceUrl?: string }>;
};

type AnCuongListing = {
  sourceUrl: string;
  imageUrl?: string;
  sourceId?: string;
  productCode?: string;
};

type FullRecordFile = {
  records: Array<{
    recordType: string;
    sourceProductId?: string;
    slug: string;
    images?: Array<{
      sourceUrl: string;
      localPath?: string;
      mimeType?: string;
      width?: number;
      height?: number;
      checksum?: string;
      mediaType: SupplierMediaRole;
    }>;
  }>;
};

function sha256(value: string | Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

function readJson<T>(file: string): T {
  return JSON.parse(fs.readFileSync(file, "utf8")) as T;
}

function readJsonIfExists<T>(file: string): T | undefined {
  return fs.existsSync(file) ? readJson<T>(file) : undefined;
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as JsonRecord)
      .filter(([, child]) => child !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => [key, stableValue(child)]),
  );
}

function stableJson(value: unknown): string {
  return `${JSON.stringify(stableValue(value), null, 2)}\n`;
}

function writeJsonIfChanged(file: string, value: unknown): boolean {
  const next = stableJson(value);
  if (fs.existsSync(file) && fs.readFileSync(file, "utf8") === next) return false;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temporary = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(temporary, next);
  fs.renameSync(temporary, file);
  return true;
}

function manifestPath(supplier: SupplierId): string {
  return path.join(ROOT, "data", "imports", supplier, "full-media-manifest.json");
}

function previousManifest(supplier: SupplierId): SupplierMediaManifest | undefined {
  return readJsonIfExists<SupplierMediaManifest>(manifestPath(supplier));
}

function existingOrigins(manifests: Array<SupplierMediaManifest | undefined>): ExistingOrigins {
  const origins = new Map<string, SupplierMediaOrigin>();
  for (const manifest of manifests) {
    for (const asset of manifest?.assets ?? []) {
      for (const origin of asset.origins) origins.set(origin.sourceUrl, origin);
    }
  }
  return origins;
}

function productId(supplier: SupplierId, record: { recordType: string; sourceProductId?: string; slug: string }): string {
  return `${supplier}:${record.recordType}:${record.sourceProductId ?? record.slug}`;
}

function anCuongProductId(product: AnCuongProduct): string {
  return `an-cuong:sku:${product.sourceId ?? "unknown"}:${sha256(product.sourceUrl).slice(0, 12)}`;
}

function sourceAsset(
  sourceKind: SupplierMediaAsset["sourceKind"],
  origin: SupplierMediaOrigin,
  references: SupplierMediaReference[],
  state: SupplierMediaAsset["state"],
  reason?: string,
): SupplierMediaAsset {
  return {
    assetId: `source:${sha256(origin.sourceUrl)}`,
    sourceKind,
    origins: [origin],
    references,
    state,
    reason,
    rightsStatus: "UNCONFIRMED",
  };
}

function publicPathToFile(localPath: string): string {
  return path.join(PUBLIC_ROOT, localPath.replace(/^\//, ""));
}

function localDelivery(localPath: string, kind: "exact-source-bytes" | "legacy-transformed") {
  const file = publicPathToFile(localPath);
  const bytes = fs.readFileSync(file);
  const info = inspectMediaBytes(bytes);
  return {
    kind,
    localPath,
    ...info,
    bytes: bytes.length,
    checksum: sha256(bytes),
  } as const;
}

function extensionForMime(mimeType: string): string {
  const extensions: Record<string, string> = {
    "image/avif": "avif",
    "image/gif": "gif",
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };
  const extension = extensions[mimeType];
  if (!extension) throw new Error(`Unsupported preview MIME: ${mimeType}`);
  return extension;
}

async function mapConcurrent<T, R>(values: T[], concurrency: number, worker: (value: T, index: number) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(values.length);
  let cursor = 0;
  const run = async () => {
    while (cursor < values.length) {
      const index = cursor++;
      results[index] = await worker(values[index]!, index);
    }
  };
  await Promise.all(Array.from({ length: Math.min(Math.max(1, concurrency), values.length || 1) }, run));
  return results;
}

function createPacer(minDelayMs: number): () => Promise<void> {
  let gate = Promise.resolve();
  let nextAt = 0;
  return async () => {
    const previous = gate;
    let release = () => {};
    gate = new Promise<void>((resolve) => { release = resolve; });
    await previous;
    const delay = Math.max(0, nextAt - Date.now());
    if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay));
    nextAt = Date.now() + minDelayMs;
    release();
  };
}

function originalState(origin: SupplierMediaOrigin): Pick<SupplierMediaAsset, "state" | "reason"> {
  if (!isAllowedSupplierMediaUrl("an-cuong", origin.sourceUrl)) {
    return { state: "INVALID", reason: "Source URL is outside the official An Cường HTTPS media hosts." };
  }
  if (origin.httpStatus === 404 || origin.httpStatus === 410) {
    return { state: "UNRESOLVED", reason: `Supplier original returned HTTP ${origin.httpStatus}; no local path was invented.` };
  }
  if (origin.httpStatus && origin.httpStatus >= 400 && origin.httpStatus !== 405) {
    return { state: "UNRESOLVED", reason: `Supplier original metadata request returned HTTP ${origin.httpStatus}; original bytes were not downloaded.` };
  }
  return {
    state: "ORIGINAL_PROVENANCE_ONLY",
    reason: origin.error
      ? "Public source reference retained; HEAD metadata was unavailable and no original GET was attempted."
      : "Archival original retained as inventory-only provenance because projected full-image download exceeds safe capacity.",
  };
}

function buildAnCuongReferences(products: AnCuongProduct[], listings: AnCuongListing[]) {
  const originalReferences = new Map<string, SupplierMediaReference[]>();
  const previewReferences = new Map<string, SupplierMediaReference[]>();
  const listingBySource = new Map(listings.map((listing) => [listing.sourceUrl, listing]));
  for (const product of products) {
    const id = anCuongProductId(product);
    const addOriginal = (sourceUrl: string, role: SupplierMediaRole) => {
      const references = originalReferences.get(sourceUrl) ?? [];
      references.push({ productId: id, role, sourceUrl });
      originalReferences.set(sourceUrl, references);
    };
    if (product.primaryImage?.sourceUrl) addOriginal(product.primaryImage.sourceUrl, "primary");
    for (const media of product.gallery ?? []) {
      if (!media.sourceUrl) continue;
      addOriginal(media.sourceUrl, new URL(media.sourceUrl).hostname === "acshopping.ancuong.com" ? "application" : "gallery");
    }
    const thumbnail = listingBySource.get(product.sourceUrl)?.imageUrl;
    if (thumbnail) {
      const references = previewReferences.get(thumbnail) ?? [];
      references.push({ productId: id, role: "preview", sourceUrl: thumbnail });
      previewReferences.set(thumbnail, references);
    }
  }
  return { originalReferences, previewReferences };
}

async function fetchExactImage(
  supplier: SupplierId,
  sourceUrl: string,
  options: { retries: number; maxRedirects: number; timeoutMs: number },
): Promise<{ bytes: Buffer; origin: SupplierMediaOrigin }> {
  let currentUrl = sourceUrl;
  const redirectChain: string[] = [];
  const visited = new Set([sourceUrl]);
  for (let redirects = 0; ; redirects += 1) {
    let response: Response | undefined;
    let lastError: unknown;
    for (let attempt = 0; attempt <= options.retries; attempt += 1) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), options.timeoutMs);
      try {
        response = await fetch(currentUrl, {
          method: "GET",
          redirect: "manual",
          signal: controller.signal,
          headers: {
            accept: "image/avif,image/webp,image/png,image/jpeg,image/gif",
            "user-agent": "TungPhat-Supplier-Preview-Importer/1.0 (+https://mdftungphat.com)",
          },
        });
        if (![408, 425, 429, 500, 502, 503, 504].includes(response.status) || attempt === options.retries) break;
      } catch (error) {
        lastError = error;
        if (attempt === options.retries) throw error;
      } finally {
        clearTimeout(timer);
      }
      await new Promise((resolve) => setTimeout(resolve, 250 * 2 ** attempt));
    }
    if (!response) throw lastError instanceof Error ? lastError : new Error(`GET failed: ${currentUrl}`);
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");
      if (!location) throw new Error(`Supplier media redirect is missing Location: ${currentUrl}`);
      if (redirects >= options.maxRedirects) throw new Error(`Supplier media redirect limit exceeded: ${sourceUrl}`);
      const redirected = new URL(location, currentUrl).toString();
      if (!isAllowedSupplierMediaUrl(supplier, redirected)) throw new Error(`Supplier media redirect left allowlisted HTTPS hosts: ${redirected}`);
      if (visited.has(redirected)) throw new Error(`Supplier media redirect cycle detected: ${redirected}`);
      visited.add(redirected);
      redirectChain.push(redirected);
      currentUrl = redirected;
      continue;
    }
    if (!response.ok) throw new Error(`Supplier preview GET returned HTTP ${response.status}`);
    const declaredLength = Number(response.headers.get("content-length"));
    if (Number.isFinite(declaredLength) && declaredLength > MAX_FILE_BYTES) throw new Error("Supplier preview exceeds the 25 MiB per-file gate");
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length > MAX_FILE_BYTES) throw new Error("Supplier preview exceeds the 25 MiB per-file gate");
    const info = inspectMediaBytes(bytes, response.headers.get("content-type") ?? undefined);
    return {
      bytes,
      origin: {
        sourceUrl,
        finalUrl: currentUrl,
        redirectChain,
        httpStatus: response.status,
        mimeType: info.mimeType,
        contentLength: bytes.length,
      },
    };
  }
}

function cachedPreviewBySource(previous: SupplierMediaManifest | undefined): Map<string, SupplierMediaAsset> {
  const cache = new Map<string, SupplierMediaAsset>();
  for (const asset of previous?.assets ?? []) {
    if (asset.sourceKind !== "supplier-thumbnail" || asset.state !== "LOCAL_PREVIEW" || asset.delivery?.kind !== "exact-source-bytes") continue;
    for (const origin of asset.origins) cache.set(origin.sourceUrl, asset);
  }
  return cache;
}

function verifyCachedPreview(asset: SupplierMediaAsset): boolean {
  if (!asset.delivery) return false;
  const file = publicPathToFile(asset.delivery.localPath);
  if (!fs.existsSync(file)) return false;
  const bytes = fs.readFileSync(file);
  try {
    const info = inspectMediaBytes(bytes, asset.delivery.mimeType);
    return sha256(bytes) === asset.delivery.checksum &&
      bytes.length === asset.delivery.bytes &&
      info.width === asset.delivery.width &&
      info.height === asset.delivery.height;
  } catch {
    return false;
  }
}

async function buildAnCuongManifest(options: {
  origins: Map<string, SupplierMediaOrigin>;
  originalReferences: Map<string, SupplierMediaReference[]>;
  previewReferences: Map<string, SupplierMediaReference[]>;
  previous?: SupplierMediaManifest;
  concurrency: number;
  offline: boolean;
  previewDownloadUrls: ReadonlySet<string>;
}): Promise<SupplierMediaManifest> {
  const originals: SupplierMediaAsset[] = [];
  for (const [sourceUrl, references] of [...options.originalReferences].sort(([left], [right]) => left.localeCompare(right))) {
    const origin = options.origins.get(sourceUrl) ?? { sourceUrl, redirectChain: [], contentLength: "unknown" as const };
    const state = originalState(origin);
    originals.push(sourceAsset("archival-original", origin, references, state.state, state.reason));
  }

  const existingPublicFiles = fs.existsSync(PUBLIC_CATALOG)
    ? fs.readdirSync(PUBLIC_CATALOG, { recursive: true, withFileTypes: true }).filter((entry) => entry.isFile()).length
    : 0;
  const stat = fs.statfsSync(ROOT);
  const freeBytes = stat.bavail * stat.bsize;
  const knownPreviewBytes = [...options.previewReferences.keys()].reduce((total, url) => {
    const length = options.origins.get(url)?.contentLength;
    return total + (typeof length === "number" ? length : 0);
  }, 0);
  const knownTooLarge = [...options.previewReferences.keys()].some((url) => {
    const length = options.origins.get(url)?.contentLength;
    return typeof length === "number" && length > MAX_FILE_BYTES;
  });
  const capacityReason = knownTooLarge
    ? "At least one supplier thumbnail exceeds the 25 MiB per-file delivery gate."
    : knownPreviewBytes > MAX_NEW_PREVIEW_BYTES
      ? `Known supplier thumbnail bytes exceed the ${MAX_NEW_PREVIEW_BYTES}-byte preview budget.`
      : freeBytes - knownPreviewBytes < MIN_FREE_DISK_RESERVE_BYTES
        ? "Projected thumbnail download would breach the 8 GiB free-disk reserve."
        : existingPublicFiles + options.previewReferences.size > SAFE_PUBLIC_FILE_COUNT
          ? `Projected public file count exceeds the ${SAFE_PUBLIC_FILE_COUNT}-file safety gate.`
          : undefined;

  fs.mkdirSync(AN_CUONG_PUBLIC, { recursive: true });
  const cache = cachedPreviewBySource(options.previous);
  const pacePreviewRequest = createPacer(250);
  let acceptedBytes = 0;
  const previewEntries = [...options.previewReferences].sort(([left], [right]) => left.localeCompare(right));
  const previews = await mapConcurrent(previewEntries, options.concurrency, async ([sourceUrl, references]) => {
    const cached = cache.get(sourceUrl);
    if (cached && verifyCachedPreview(cached)) {
      const origin = cached.origins.find((value) => value.sourceUrl === sourceUrl) ?? options.origins.get(sourceUrl)!;
      return { ...cached, origins: [origin], references };
    }
    const origin = options.origins.get(sourceUrl) ?? { sourceUrl, redirectChain: [], contentLength: "unknown" as const };
    if (capacityReason) return sourceAsset("supplier-thumbnail", origin, references, "DEFERRED", capacityReason);
    if (!options.previewDownloadUrls.has(sourceUrl)) {
      return sourceAsset(
        "supplier-thumbnail",
        origin,
        references,
        "DEFERRED",
        "Preview GET was not explicitly selected by the capacity-safe small-batch option; no local path was created.",
      );
    }
    if (options.offline) {
      return sourceAsset(
        "supplier-thumbnail",
        origin,
        references,
        "DEFERRED",
        "Exact supplier thumbnail is not cached locally; offline mode did not fetch it.",
      );
    }
    try {
      await pacePreviewRequest();
      const downloaded = await fetchExactImage("an-cuong", sourceUrl, { retries: 2, maxRedirects: 5, timeoutMs: 20_000 });
      if (acceptedBytes + downloaded.bytes.length > MAX_NEW_PREVIEW_BYTES) {
        return sourceAsset("supplier-thumbnail", downloaded.origin, references, "DEFERRED", "Actual thumbnail bytes reached the capacity-safe preview budget; no local path was created.");
      }
      acceptedBytes += downloaded.bytes.length;
      const info = inspectMediaBytes(downloaded.bytes, downloaded.origin.mimeType);
      const checksum = sha256(downloaded.bytes);
      const filename = `${checksum}.${extensionForMime(info.mimeType)}`;
      const localPath = `/catalog/an-cuong/${filename}`;
      const target = publicPathToFile(localPath);
      if (!fs.existsSync(target)) {
        const temporary = `${target}.${process.pid}.tmp`;
        fs.writeFileSync(temporary, downloaded.bytes);
        fs.renameSync(temporary, target);
      } else if (sha256(fs.readFileSync(target)) !== checksum) {
        throw new Error(`Checksum-addressed local path collision: ${localPath}`);
      }
      return {
        ...sourceAsset("supplier-thumbnail", downloaded.origin, references, "LOCAL_PREVIEW"),
        assetId: `sha256:${checksum}`,
        delivery: {
          kind: "exact-source-bytes" as const,
          localPath,
          ...info,
          bytes: downloaded.bytes.length,
          checksum,
        },
      };
    } catch (error) {
      return sourceAsset(
        "supplier-thumbnail",
        origin,
        references,
        "UNRESOLVED",
        `${error instanceof Error ? error.message : String(error)}; no local path was created.`,
      );
    }
  });
  const assets = mergeMediaAssetsByChecksum([...originals, ...previews]);
  const manifest: SupplierMediaManifest = {
    schemaVersion: 1,
    supplier: "an-cuong",
    generatedAt: options.previous?.generatedAt ?? new Date().toISOString(),
    assets,
    checksum: "",
  };
  manifest.checksum = checksumSupplierMediaManifest(manifest);
  if (options.previous?.checksum !== manifest.checksum) manifest.generatedAt = new Date().toISOString();
  return manifest;
}

function buildExistingSupplierAssets(
  supplier: "ba-thanh" | "thanh-thuy",
  records: FullRecordFile,
  origins: Map<string, SupplierMediaOrigin>,
): SupplierMediaAsset[] {
  const grouped = new Map<string, { sourceUrl: string; references: SupplierMediaReference[]; localPath?: string; sourceChecksum?: string }>();
  for (const record of records.records) {
    for (const image of record.images ?? []) {
      const key = `${image.sourceUrl}|${image.localPath ?? "source-only"}`;
      const value = grouped.get(key) ?? { sourceUrl: image.sourceUrl, references: [] };
      value.references.push({ productId: productId(supplier, record), role: image.mediaType, sourceUrl: image.sourceUrl });
      value.localPath = image.localPath;
      value.sourceChecksum ??= image.checksum;
      grouped.set(key, value);
    }
  }
  const assets: SupplierMediaAsset[] = [];
  for (const [, value] of [...grouped].sort(([left], [right]) => left.localeCompare(right))) {
    const sourceUrl = value.sourceUrl;
    const origin = {
      ...(origins.get(sourceUrl) ?? { sourceUrl, redirectChain: [], contentLength: "unknown" as const }),
      sourceChecksum: value.sourceChecksum,
    };
    if (value.localPath && fs.existsSync(publicPathToFile(value.localPath))) {
      assets.push({
        ...sourceAsset("archival-original", origin, value.references, "LOCAL_PREVIEW"),
        delivery: localDelivery(value.localPath, "legacy-transformed"),
      });
    } else {
      assets.push(sourceAsset(
        "archival-original",
        origin,
        value.references,
        "DEFERRED",
        `${supplier === "ba-thanh" ? "Ba Thành" : "Thanh Thuỳ"} source-only media has no verified small official thumbnail; exact original packaging is deferred to avoid material preview inflation.`,
      ));
    }
  }
  return mergeMediaAssetsByChecksum(assets);
}

function makeManifest(
  supplier: "ba-thanh" | "thanh-thuy",
  assets: SupplierMediaAsset[],
  previous?: SupplierMediaManifest,
): SupplierMediaManifest {
  const manifest: SupplierMediaManifest = {
    schemaVersion: 1,
    supplier,
    generatedAt: previous?.generatedAt ?? new Date().toISOString(),
    assets,
    checksum: "",
  };
  manifest.checksum = checksumSupplierMediaManifest(manifest);
  if (previous?.checksum !== manifest.checksum) manifest.generatedAt = new Date().toISOString();
  return manifest;
}

function listPublicFiles(): string[] {
  if (!fs.existsSync(PUBLIC_CATALOG)) return [];
  const files: string[] = [];
  const visit = (directory: string) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const child = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(child);
      else if (entry.isFile()) files.push(child);
    }
  };
  visit(PUBLIC_CATALOG);
  return files.sort();
}

function validateLocalDelivery(manifest: SupplierMediaManifest, knownLocalPaths: Set<string>): string[] {
  const errors = validateSupplierMediaManifest(manifest, { knownLocalPaths }).map((issue) => `${issue.code}: ${issue.assetId ?? "manifest"} ${issue.url ?? ""}`.trim());
  for (const asset of manifest.assets) {
    if (!asset.delivery) continue;
    const file = publicPathToFile(asset.delivery.localPath);
    if (!fs.existsSync(file)) {
      errors.push(`LOCAL_FILE_MISSING: ${asset.delivery.localPath}`);
      continue;
    }
    const bytes = fs.readFileSync(file);
    try {
      const info = inspectMediaBytes(bytes, asset.delivery.mimeType);
      if (sha256(bytes) !== asset.delivery.checksum) errors.push(`LOCAL_CHECKSUM_MISMATCH: ${asset.delivery.localPath}`);
      if (bytes.length !== asset.delivery.bytes) errors.push(`LOCAL_BYTE_LENGTH_MISMATCH: ${asset.delivery.localPath}`);
      if (info.width !== asset.delivery.width || info.height !== asset.delivery.height) errors.push(`LOCAL_DIMENSIONS_MISMATCH: ${asset.delivery.localPath}`);
      if (bytes.length > MAX_FILE_BYTES) errors.push(`LOCAL_FILE_EXCEEDS_CLOUDFLARE_LIMIT: ${asset.delivery.localPath}`);
    } catch (error) {
      errors.push(`LOCAL_MIME_INVALID: ${asset.delivery.localPath} ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  return errors;
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const validateOnly = args.has("--validate-only");
  const offline = args.has("--offline") || validateOnly;
  const refresh = args.has("--refresh-metadata");
  const refreshRateLimited = args.has("--refresh-rate-limited");
  const downloadPreviews = args.has("--download-previews");
  const previewLimitArg = process.argv.find((value) => value.startsWith("--preview-limit="));
  const previewLimit = Number(previewLimitArg?.split("=")[1] ?? 0);
  const concurrencyArg = process.argv.find((value) => value.startsWith("--concurrency="));
  const concurrency = Math.max(1, Math.min(Number(concurrencyArg?.split("=")[1] ?? DEFAULT_CONCURRENCY), 4));

  if (validateOnly) {
    const manifests = (["an-cuong", "ba-thanh", "thanh-thuy"] as const).map((supplier) => {
      const value = previousManifest(supplier);
      if (!value) throw new Error(`Missing generated media manifest: ${manifestPath(supplier)}`);
      return value;
    });
    const knownLocalPaths = new Set(listPublicFiles().map((file) => `/${path.relative(PUBLIC_ROOT, file).split(path.sep).join("/")}`));
    const errors = manifests.flatMap((manifest) => validateLocalDelivery(manifest, knownLocalPaths));
    if (errors.length) throw new Error(errors.join("\n"));
    console.log(JSON.stringify({ mode: "validate-only", manifests: manifests.map((manifest) => ({ supplier: manifest.supplier, checksum: manifest.checksum, assets: manifest.assets.length })) }, null, 2));
    return;
  }

  const previous = {
    "an-cuong": previousManifest("an-cuong"),
    "ba-thanh": previousManifest("ba-thanh"),
    "thanh-thuy": previousManifest("thanh-thuy"),
  };
  const cached = existingOrigins(Object.values(previous));
  const products = readJson<AnCuongProduct[]>(path.join(ROOT, "data/imports/ancuong/normalized/catalogue.json"));
  const listings = readJson<AnCuongListing[]>(path.join(ROOT, "data/imports/ancuong/raw/listings.json"));
  const baThanhRecords = readJson<FullRecordFile>(path.join(ROOT, "data/imports/ba-thanh/full-records.json"));
  const thanhThuyRecords = readJson<FullRecordFile>(path.join(ROOT, "data/imports/thanh-thuy/full-records.json"));
  const anCuong = buildAnCuongReferences(products, listings);

  const baThanhUrls = baThanhRecords.records.flatMap((record) => record.images?.map((image) => image.sourceUrl) ?? []);
  const thanhThuyUrls = thanhThuyRecords.records.flatMap((record) => record.images?.map((image) => image.sourceUrl) ?? []);
  const inventoryRequests = [
    ...[...anCuong.originalReferences.keys(), ...anCuong.previewReferences.keys()].map((sourceUrl) => ({ supplier: "an-cuong" as const, sourceUrl })),
    ...baThanhUrls.map((sourceUrl) => ({ supplier: "ba-thanh" as const, sourceUrl })),
    ...thanhThuyUrls.map((sourceUrl) => ({ supplier: "thanh-thuy" as const, sourceUrl })),
  ];
  const seed = new Map<string, SupplierMediaOrigin>();
  for (const request of inventoryRequests) {
    const origin = cached.get(request.sourceUrl);
    if (origin) seed.set(`${request.supplier}|${request.sourceUrl}`, origin);
  }
  const inventory = await inventoryMediaOriginsWithCache(inventoryRequests, {
    cacheFile: path.join(ROOT, ".cache/supplier-media/head-inventory.json"),
    concurrency,
    retries: 2,
    backoffMs: 250,
    refresh,
    refreshRateLimited,
    offline,
    seed,
    checkpointEvery: 20,
    minDelayMs: 250,
    onCheckpoint: (completed, total) => {
      if (completed === total || completed % 200 === 0) console.error(`media HEAD inventory ${completed}/${total}`);
    },
  });
  const originsFor = (supplier: SupplierId, urls: string[]) => new Map(
    [...new Set(urls)].map((sourceUrl) => [sourceUrl, inventory.get(`${supplier}|${sourceUrl}`)!]),
  );
  const anCuongOrigins = originsFor("an-cuong", [...anCuong.originalReferences.keys(), ...anCuong.previewReferences.keys()]);
  const baThanhOrigins = originsFor("ba-thanh", baThanhUrls);
  const thanhThuyOrigins = originsFor("thanh-thuy", thanhThuyUrls);

  const anCuongManifest = await buildAnCuongManifest({
    origins: anCuongOrigins,
    originalReferences: anCuong.originalReferences,
    previewReferences: anCuong.previewReferences,
    previous: previous["an-cuong"],
    concurrency,
    offline,
    previewDownloadUrls: new Set(selectCapacitySafePreviewUrls([...anCuong.previewReferences.keys()], {
      enabled: downloadPreviews,
      limit: previewLimit,
    })),
  });
  const baThanhManifest = makeManifest("ba-thanh", buildExistingSupplierAssets("ba-thanh", baThanhRecords, baThanhOrigins), previous["ba-thanh"]);
  const thanhThuyManifest = makeManifest("thanh-thuy", buildExistingSupplierAssets("thanh-thuy", thanhThuyRecords, thanhThuyOrigins), previous["thanh-thuy"]);
  const manifests = [anCuongManifest, baThanhManifest, thanhThuyManifest];
  const publicFiles = listPublicFiles();
  const publicStats = publicFiles.map((file) => fs.statSync(file).size);
  const summaryCore = buildMediaCapacitySummary(manifests, {
    publicFileCount: publicFiles.length,
    publicBytes: publicStats.reduce((total, bytes) => total + bytes, 0),
    maxPublicFileBytes: Math.max(0, ...publicStats),
  });
  const summaryChecksum = sha256(JSON.stringify(stableValue(summaryCore)));
  const summaryPath = path.join(ROOT, "data/imports/supplier-media-capacity-summary.json");
  const oldSummary = readJsonIfExists<{ generatedAt?: string; checksum?: string }>(summaryPath);
  const summary = {
    ...summaryCore,
    generatedAt: oldSummary?.checksum === summaryChecksum ? oldSummary.generatedAt : new Date().toISOString(),
    checksum: summaryChecksum,
    policy: {
      originalDownload: "DEFERRED_CAPACITY_SAFE",
      previewBytes: "EXACT_SUPPLIER_SOURCE_BYTES_ONLY",
      transformedLegacyAssets: "DELIVERY_VARIANT_NOT_ORIGINAL_BYTES",
      rightsStatus: "UNCONFIRMED",
      cloudflarePagesLimitsSource: "https://developers.cloudflare.com/pages/platform/limits/",
      cloudflarePagesLimitsChecked: "2026-07-16",
    },
  };

  const knownLocalPaths = new Set(publicFiles.map((file) => `/${path.relative(PUBLIC_ROOT, file).split(path.sep).join("/")}`));
  const errors = manifests.flatMap((manifest) => validateLocalDelivery(manifest, knownLocalPaths));
  if (summary.publicDelivery.fileCountGate !== "PASS") errors.push("PUBLIC_FILE_COUNT_GATE_FAILED");
  if (summary.publicDelivery.maxFileGate !== "PASS") errors.push("PUBLIC_MAX_FILE_GATE_FAILED");
  if (errors.length) throw new Error(errors.join("\n"));

  const writes = manifests.map((manifest) => ({ supplier: manifest.supplier, changed: writeJsonIfChanged(manifestPath(manifest.supplier), manifest) }));
  const summaryChanged = writeJsonIfChanged(summaryPath, summary);
  console.log(JSON.stringify({
    mode: offline ? "offline" : "online",
    writes,
    summaryChanged,
    suppliers: summary.suppliers,
    combined: summary.combined,
    publicDelivery: summary.publicDelivery,
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exitCode = 1;
});
