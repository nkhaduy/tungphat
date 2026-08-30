export type MediaReference = string;

export const DEFAULT_PUBLIC_MEDIA_BASE_URL = "https://cdn.mdftungphat.com";

const MEDIA_PATH = /^\/(?:catalog|gallery|supplier|thumbnails|uploads|uploads-thumbnails|vendor|videos)(?:\/|$)/iu;
const LEGACY_MEDIA_PATH = /^\/media(?:\/|$)/iu;
const LEGACY_CATALOG_PATH = /^\/assets\/catalog(?:\/|$)/iu;
const FIRST_PARTY_MEDIA_HOSTS = new Set([
  "cdn.mdftungphat.com",
  "mdftungphat.com",
  "www.mdftungphat.com",
  "cms.mdftungphat.com",
  "media.mdftungphat.com",
]);

function configuredMediaBase(mediaBaseUrl?: string): URL {
  const configured = mediaBaseUrl?.trim() || process.env.NEXT_PUBLIC_MEDIA_BASE_URL?.trim() || DEFAULT_PUBLIC_MEDIA_BASE_URL;
  const url = new URL(configured);
  if (url.protocol !== "https:") throw new Error(`Media base URL must use HTTPS: ${configured}`);
  if (url.username || url.password || url.search || url.hash) {
    throw new Error(`Media base URL must be an HTTPS origin: ${configured}`);
  }

  // Legacy local configuration must not restore a CMS/main-domain proxy.
  if (FIRST_PARTY_MEDIA_HOSTS.has(url.hostname) && url.hostname !== "cdn.mdftungphat.com") {
    return new URL(DEFAULT_PUBLIC_MEDIA_BASE_URL);
  }
  return url;
}

function normalizedMediaPath(pathname: string): string | undefined {
  let value = pathname.replace(/\/{2,}/gu, "/");
  if (LEGACY_MEDIA_PATH.test(value)) value = value.replace(LEGACY_MEDIA_PATH, "/");
  if (LEGACY_CATALOG_PATH.test(value)) value = value.replace(LEGACY_CATALOG_PATH, "/catalog/");
  return MEDIA_PATH.test(value) ? value : undefined;
}

function canonicalMediaReference(reference: string): { pathname: string; search: string; hash: string } | undefined {
  const relativeCandidate = reference.startsWith("/")
    ? reference
    : /^(?:catalog|gallery|media|supplier|thumbnails|uploads|uploads-thumbnails|vendor|videos)(?:\/|$)/iu.test(reference)
      ? `/${reference}`
      : undefined;

  if (relativeCandidate) {
    const url = new URL(relativeCandidate, "https://media-reference.invalid");
    const pathname = normalizedMediaPath(url.pathname);
    return pathname ? { pathname, search: url.search, hash: url.hash } : undefined;
  }

  let url: URL;
  try {
    url = new URL(reference.startsWith("//") ? `https:${reference}` : reference);
  } catch {
    return undefined;
  }

  const isR2Dev = url.hostname.endsWith(".r2.dev");
  const isR2Api = url.hostname.endsWith(".r2.cloudflarestorage.com");
  if (!FIRST_PARTY_MEDIA_HOSTS.has(url.hostname) && !isR2Dev && !isR2Api) return undefined;

  let pathname = url.pathname;
  if (isR2Api) pathname = pathname.replace(/^\/tung-phat-media(?=\/|$)/iu, "");
  const normalized = normalizedMediaPath(pathname);
  return normalized ? { pathname: normalized, search: url.search, hash: url.hash } : undefined;
}

/**
 * Single resolution point for public media URLs. Storage keys may remain
 * relative in source data, but browser-facing output always uses the CDN.
 */
export function resolveMediaUrl(reference: MediaReference, mediaBaseUrl?: string) {
  const value = reference.trim();
  if (!value || value.startsWith("data:") || value.startsWith("blob:")) return value;

  const media = canonicalMediaReference(value);
  if (!media) {
    if (value.startsWith("/") || /^https?:\/\//iu.test(value) || value.startsWith("//")) return value;
    throw new Error(`Media reference must be a public path, first-party media key, or HTTP(S) URL: ${value}`);
  }

  const base = configuredMediaBase(mediaBaseUrl);
  return `${base.origin}${media.pathname}${media.search}${media.hash}`;
}

export function resolveMediaSrcSet(srcSet: string | undefined): string | undefined {
  if (!srcSet?.trim()) return undefined;
  return srcSet
    .split(",")
    .map((candidate) => {
      const match = candidate.trim().match(/^(\S+)(?:\s+(.+))?$/u);
      if (!match) return candidate.trim();
      return `${resolveMediaUrl(match[1])}${match[2] ? ` ${match[2]}` : ""}`;
    })
    .join(", ");
}

export function absoluteMediaUrl(reference: MediaReference, siteUrl: string) {
  return new URL(resolveMediaUrl(reference), siteUrl).toString();
}
