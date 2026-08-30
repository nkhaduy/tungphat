const MEDIA_PATH = /^(?:\/)?(?:assets\/catalog|catalog|gallery|media|supplier|thumbnails|uploads|uploads-thumbnails|vendor|videos)(?:\/|$)/iu;
const MEDIA_URL = /(?:https?:)?\/\/[^\s"'<>\\]+|\/?(?:assets\/catalog|catalog|gallery|media|supplier|thumbnails|uploads|uploads-thumbnails|vendor|videos)\/[^\s"'<>\\),]+/giu;
const MAIN_HOSTS = new Set(["mdftungphat.com", "www.mdftungphat.com"]);
const CMS_HOSTS = new Set(["cms.mdftungphat.com", "media.mdftungphat.com"]);
const MEDIA_FILE = /\.(?:avif|gif|jpe?g|mp4|pdf|png|svg|webm|webp)$/iu;

export type MediaAuditResult = {
  inspected: number;
  cdn: number;
  relative: number;
  mainDomain: number;
  cms: number;
  legacyR2: number;
  broken: number;
  failures: Array<{ reference: string; reason: "relative" | "main-domain" | "cms" | "legacy-r2" | "broken" }>;
};

function decodedMarkup(value: string) {
  return value
    .replace(/\\u002f/giu, "/")
    .replace(/\\\//gu, "/")
    .replace(/\\"/gu, "\"")
    .replace(/&quot;|&#34;/giu, "\"")
    .replace(/&amp;/giu, "&");
}

function trimReference(value: string) {
  return value.replace(/[.;:]+$/gu, "");
}

export function extractMediaReferences(body: string) {
  return [...new Set([...decodedMarkup(body).matchAll(MEDIA_URL)].map((match) => trimReference(match[0])))];
}

function mediaCategory(reference: string) {
  if (MEDIA_PATH.test(reference)) {
    const pathname = reference.split(/[?#]/u, 1)[0];
    return MEDIA_FILE.test(pathname) ? "relative" as const : undefined;
  }

  let url: URL;
  try {
    url = new URL(reference.startsWith("//") ? `https:${reference}` : reference);
  } catch {
    return undefined;
  }

  const isMediaPath = (MEDIA_PATH.test(url.pathname) || url.pathname.startsWith("/tung-phat-media/")) && MEDIA_FILE.test(url.pathname);
  if (!isMediaPath) return undefined;
  if (url.hostname === "cdn.mdftungphat.com") return "cdn" as const;
  if (MAIN_HOSTS.has(url.hostname)) return "mainDomain" as const;
  if (CMS_HOSTS.has(url.hostname)) return "cms" as const;
  if (url.hostname.endsWith(".r2.dev") || url.hostname.endsWith(".r2.cloudflarestorage.com")) return "legacyR2" as const;
  return undefined;
}

export function auditMediaReferences(references: Iterable<string>, brokenReferences: Iterable<string> = []): MediaAuditResult {
  const result: MediaAuditResult = {
    inspected: 0,
    cdn: 0,
    relative: 0,
    mainDomain: 0,
    cms: 0,
    legacyR2: 0,
    broken: 0,
    failures: [],
  };

  for (const reference of new Set(references)) {
    const category = mediaCategory(reference);
    if (!category) continue;
    result.inspected += 1;
    result[category] += 1;
    if (category !== "cdn") {
      const reason = category === "mainDomain" ? "main-domain" : category === "legacyR2" ? "legacy-r2" : category;
      result.failures.push({ reference, reason });
    }
  }

  for (const reference of new Set(brokenReferences)) {
    if (!mediaCategory(reference)) continue;
    result.broken += 1;
    result.failures.push({ reference, reason: "broken" });
  }
  return result;
}
