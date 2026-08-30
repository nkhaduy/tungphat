const MEDIA_PATH = /^(?:\/)?(?:assets\/catalog|catalog|gallery|media|supplier|thumbnails|uploads|uploads-thumbnails|vendor|videos)(?:\/|$)/iu;
const MEDIA_URL = /(?:https?:)?\/\/[^\s"'<>\\]+|\/(?:assets\/catalog|catalog|gallery|media|supplier|thumbnails|uploads|uploads-thumbnails|vendor|videos)\/[^\s"'<>\\),]+/giu;
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

function decodeEncodedMarkup(value: string) {
  let decoded = value;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const next = decodeURIComponent(decoded);
      if (next === decoded) break;
      decoded = next;
    } catch {
      break;
    }
  }
  return decoded;
}

export function extractMediaReferences(body: string) {
  const candidates = new Set<string>();
  for (const markup of new Set([decodedMarkup(body), decodeEncodedMarkup(decodedMarkup(body))])) {
    for (const match of markup.matchAll(MEDIA_URL)) candidates.add(trimReference(match[0]));
  }
  return [...candidates];
}

export function extractMediaReferencesFromPayload(body: string) {
  const references = new Set(extractMediaReferences(body));
  try {
    const payload = JSON.parse(body) as unknown;
    const visit = (value: unknown): void => {
      if (typeof value === "string") {
        extractMediaReferences(value).forEach((reference) => references.add(reference));
        return;
      }
      if (Array.isArray(value)) {
        value.forEach(visit);
        return;
      }
      if (value && typeof value === "object") {
        Object.values(value).forEach(visit);
      }
    };
    visit(payload);
  } catch {
    // Non-JSON responses are still covered by the raw extractor.
  }
  return [...references];
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

  const isImageFile = MEDIA_FILE.test(url.pathname);
  if (CMS_HOSTS.has(url.hostname) && isImageFile) return "cms" as const;
  const isMediaPath = (MEDIA_PATH.test(url.pathname) || url.pathname.startsWith("/tung-phat-media/")) && isImageFile;
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
