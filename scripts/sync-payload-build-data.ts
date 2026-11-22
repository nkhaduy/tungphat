import { mkdir, mkdtemp, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolveMediaUrl } from "../lib/media";
import { cmsManagedMaterialSlugs } from "../lib/product-ownership";

const DEFAULT_PAYLOAD_URL = "https://cms.mdftungphat.com";
const OUTPUTS = {
  "business-settings": "content/settings/business.json",
  "seo-defaults": "content/settings/seo.json",
  "static-pages": "content/settings/static-pages.json",
  "material-categories": "content/categories/materials.json",
  brands: "content/categories/brands.json",
};
const PAYLOAD_METADATA = new Set(["id", "createdAt", "updatedAt", "globalType"]);

function publicMediaUrl(value: unknown) {
  if (typeof value !== "string" || !value) return value;
  if (/^(?:https?:\/\/|\/(?:catalog|gallery|media|supplier|thumbnails|uploads|uploads-thumbnails|vendor|videos)(?:\/|$)|(?:catalog|gallery|media|supplier|thumbnails|uploads|uploads-thumbnails|vendor|videos)(?:\/|$))/iu.test(value)) {
    return resolveMediaUrl(value);
  }
  return value;
}

function normalizeValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    if (value.every((entry) => entry && typeof entry === "object" && "value" in entry)) {
      return value.map((entry) => normalizeValue((entry as { value: unknown }).value));
    }
    return value.map((entry) => normalizeValue(entry));
  }
  if (!value || typeof value !== "object") return publicMediaUrl(value);

  const record = value as Record<string, unknown>;
  if (typeof record.url === "string") return publicMediaUrl(record.url);

  const normalized: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(record)) {
    if (PAYLOAD_METADATA.has(key) || key === "locationId") continue;
    normalized[key] = normalizeValue(entry);
  }
  if (typeof record.locationId === "string") normalized.id = record.locationId;
  return normalized;
}

export function normalizePayloadGlobal(slug: string, value: Record<string, unknown>) {
  const normalized = normalizeValue(value) as Record<string, unknown>;
  const defaultOgImage = value.defaultOgImage as Record<string, unknown> | undefined;
  if (slug === "seo-defaults" && defaultOgImage) {
    normalized.defaultOgImageWidth = defaultOgImage.width;
    normalized.defaultOgImageHeight = defaultOgImage.height;
    normalized.defaultOgImageType = defaultOgImage.mimeType;
  }
  if (slug === "static-pages" && typeof value.updatedAt === "string") {
    normalized.updatedAt = value.updatedAt.slice(0, 10);
  }
  if (slug === "brands" && Array.isArray(normalized.items)) {
    normalized.items = normalized.items.map((item) => {
      const brand = item as Record<string, unknown>;
      return {
        ...brand,
        logo: brand.logo ?? "",
        products: brand.products ?? [],
      };
    });
  }
  return normalized;
}

export function productPublicationState(docs: Record<string, unknown>[]) {
  const bySlug = new Map(docs.map((doc) => [String(doc.slug), doc]));
  const hiddenSlugs = new Set<string>();
  for (const slug of cmsManagedMaterialSlugs) if (!bySlug.has(slug)) hiddenSlugs.add(slug);
  for (const doc of docs) {
    const seo = doc.seo as Record<string, unknown> | undefined;
    if (doc._status !== "published" || seo?.noindex === true) hiddenSlugs.add(String(doc.slug));
  }
  return { hiddenSlugs: [...hiddenSlugs].sort() };
}

export async function fetchPayloadGlobal(
  slug: string,
  baseUrl: string,
  fetchImpl: typeof fetch = fetch,
  maxAttempts = 3,
  retryDelayMs = 500,
) {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetchImpl(`${baseUrl}/api/globals/${slug}?depth=1`);
      if (response.ok) return await response.json();
      const retryable = response.status === 408 || response.status === 429 || response.status >= 500;
      lastError = new Error(`Payload global '${slug}' returned HTTP ${response.status}`);
      if (!retryable) throw lastError;
    } catch (error) {
      lastError = error;
    }
    if (attempt < maxAttempts && retryDelayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs * attempt));
    }
  }
  throw lastError;
}

export async function syncPayloadBuildData({
  baseUrl = process.env.PAYLOAD_PUBLIC_URL || DEFAULT_PAYLOAD_URL,
  root = process.cwd(),
  fetchImpl = fetch,
  renameImpl = rename,
}: {
  baseUrl?: string;
  root?: string;
  fetchImpl?: typeof fetch;
  renameImpl?: typeof rename;
} = {}) {
  const pendingFiles: { relativePath: string; contents: string }[] = [];
  for (const [slug, relativeOutput] of Object.entries(OUTPUTS)) {
    const value = await fetchPayloadGlobal(slug, baseUrl, fetchImpl) as Record<string, unknown>;
    pendingFiles.push({
      relativePath: relativeOutput,
      contents: `${JSON.stringify(normalizePayloadGlobal(slug, value), null, 2)}\n`,
    });
  }
  const productsResponse = await fetchImpl(`${baseUrl}/api/products?limit=100&depth=0`);
  if (!productsResponse.ok) throw new Error(`Payload products visibility fetch failed: HTTP ${productsResponse.status}`);
  const products = await productsResponse.json() as { docs: Record<string, unknown>[]; hasNextPage?: boolean };
  if (!Array.isArray(products.docs) || products.hasNextPage) throw new Error("Incomplete Payload products visibility response");
  pendingFiles.push({
    relativePath: "content/categories/product-publication.json",
    contents: `${JSON.stringify(productPublicationState(products.docs), null, 2)}\n`,
  });

  // A failed CMS request must leave every previously validated build snapshot intact.
  // Prepare all replacements before promoting any file, then restore prior files if promotion fails.
  const stagingRoot = await mkdtemp(path.join(root, ".payload-sync-"));
  const originals = new Map<string, Buffer | null>();
  const promoted: string[] = [];
  try {
    for (const file of pendingFiles) {
      const staged = path.join(stagingRoot, file.relativePath);
      await mkdir(path.dirname(staged), { recursive: true });
      await writeFile(staged, file.contents);
      const destination = path.join(root, file.relativePath);
      try {
        originals.set(destination, await readFile(destination));
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
        originals.set(destination, null);
      }
    }
    for (const file of pendingFiles) {
      const destination = path.join(root, file.relativePath);
      await mkdir(path.dirname(destination), { recursive: true });
      await renameImpl(path.join(stagingRoot, file.relativePath), destination);
      promoted.push(destination);
    }
  } catch (error) {
    const rollbackErrors: unknown[] = [];
    for (const destination of [...promoted].reverse()) {
      try {
        const oldContent = originals.get(destination);
        if (oldContent === null) {
          await rm(destination, { force: true });
        } else if (oldContent !== undefined) {
          const restore = path.join(stagingRoot, "restore", path.relative(root, destination));
          await mkdir(path.dirname(restore), { recursive: true });
          await writeFile(restore, oldContent);
          await renameImpl(restore, destination);
        }
      } catch (restoreError) {
        rollbackErrors.push(restoreError);
      }
    }
    if (rollbackErrors.length) {
      throw new AggregateError([error, ...rollbackErrors], "Payload snapshot promotion and rollback both failed");
    }
    throw error;
  } finally {
    await rm(stagingRoot, { recursive: true, force: true });
  }
  console.log(`Synced ${Object.keys(OUTPUTS).length} Payload globals for frontend build.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  syncPayloadBuildData().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
