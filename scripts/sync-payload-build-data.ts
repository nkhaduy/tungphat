import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolveMediaUrl } from "../lib/media";

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
}: {
  baseUrl?: string;
  root?: string;
  fetchImpl?: typeof fetch;
} = {}) {
  for (const [slug, relativeOutput] of Object.entries(OUTPUTS)) {
    const value = await fetchPayloadGlobal(slug, baseUrl, fetchImpl) as Record<string, unknown>;
    const output = path.join(root, relativeOutput);
    await mkdir(path.dirname(output), { recursive: true });
    await writeFile(output, `${JSON.stringify(normalizePayloadGlobal(slug, value), null, 2)}\n`);
  }
  console.log(`Synced ${Object.keys(OUTPUTS).length} Payload globals for frontend build.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  syncPayloadBuildData().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
