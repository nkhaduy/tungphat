import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export const THANH_THUY_ORIGIN = "https://www.gothanhthuy.com";
export const THANH_THUY_USER_AGENT =
  "TungPhatCatalogImporter/1.0 (+https://mdftungphat.com/lien-he/)";

const approvedSitemaps = new Set([
  "/sitemap_index.xml",
  "/product-sitemap1.xml",
  "/product-sitemap2.xml",
  "/product_cat-sitemap.xml",
  "/page-sitemap.xml",
  "/catalog-sitemap.xml",
]);

export function isAllowedSourceUrl(value: string): boolean {
  try {
    const url = new URL(value);
    if (url.origin !== THANH_THUY_ORIGIN) return false;
    if (
      url.pathname === "/robots.txt" ||
      approvedSitemaps.has(url.pathname) ||
      /^\/product-sitemap\d+\.xml$/.test(url.pathname)
    ) return true;
    if (url.pathname.startsWith("/products/")) return true;
    if (url.pathname.startsWith("/catalog/")) return true;
    if (url.pathname === "/colormap/") return true;
    return url.pathname === "/wp-json/wp/v2/product" ||
      url.pathname === "/wp-json/wp/v2/product_cat";
  } catch {
    return false;
  }
}

export function isValidProductRecordUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.origin === THANH_THUY_ORIGIN && url.pathname.startsWith("/product/");
  } catch {
    return false;
  }
}

export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(",")}}`;
}

export function stableChecksum(value: unknown): string {
  const input = typeof value === "string" ? value : stableStringify(value);
  return createHash("sha256").update(input).digest("hex");
}

export function slugifyThanhThuy(value: string): string {
  return decodeHtml(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function decodeHtml(value: string): string {
  const named: Record<string, string> = {
    amp: "&",
    apos: "'",
    gt: ">",
    hellip: "…",
    ldquo: "“",
    lsquo: "‘",
    lt: "<",
    mdash: "—",
    nbsp: " ",
    ndash: "–",
    quot: '"',
    rdquo: "”",
    rsquo: "’",
  };
  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (entity, key: string) => {
    if (key[0] === "#") {
      const hexadecimal = key[1]?.toLowerCase() === "x";
      const parsed = Number.parseInt(key.slice(hexadecimal ? 2 : 1), hexadecimal ? 16 : 10);
      return Number.isFinite(parsed) ? String.fromCodePoint(parsed) : entity;
    }
    return named[key.toLowerCase()] ?? entity;
  });
}

export function htmlToText(value: string): string {
  return decodeHtml(value)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function isAllowedMediaUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.origin === THANH_THUY_ORIGIN &&
      url.pathname.startsWith("/assets/") &&
      /\.(?:avif|jpe?g|png|webp)$/i.test(url.pathname);
  } catch {
    return false;
  }
}

type FetchOptions = {
  retries?: number;
  timeoutMs?: number;
  backoffMs?: number;
  fetchImpl?: typeof fetch;
  allowMedia?: boolean;
};

export async function fetchWithRetry(url: string, options: FetchOptions = {}): Promise<Response> {
  const allowed = options.allowMedia ? isAllowedMediaUrl(url) : isAllowedSourceUrl(url);
  if (!allowed) throw new Error(`URL ngoài phạm vi catalogue được duyệt: ${url}`);
  const retries = options.retries ?? 3;
  const timeoutMs = options.timeoutMs ?? 20_000;
  const backoffMs = options.backoffMs ?? 500;
  const fetchImpl = options.fetchImpl ?? fetch;
  let currentUrl = url;
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetchImpl(currentUrl, {
        headers: {
          Accept: options.allowMedia ? "image/avif,image/webp,image/png,image/jpeg" : "application/json, application/xml, text/plain;q=0.9",
          "User-Agent": THANH_THUY_USER_AGENT,
        },
        redirect: "manual",
        signal: controller.signal,
      });
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        const redirected = location ? new URL(location, currentUrl).href : "";
        const redirectAllowed = options.allowMedia ? isAllowedMediaUrl(redirected) : isAllowedSourceUrl(redirected);
        if (!redirectAllowed) throw new Error(`Redirect ngoài phạm vi: ${location ?? "missing"}`);
        currentUrl = redirected;
        attempt -= 1;
        continue;
      }
      if (response.ok) return response;
      if (response.status < 500 && response.status !== 429) throw new Error(`HTTP ${response.status}: ${currentUrl}`);
      lastError = new Error(`HTTP ${response.status}: ${currentUrl}`);
    } catch (error) {
      lastError = error;
    } finally {
      clearTimeout(timer);
    }
    if (attempt < retries && backoffMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, backoffMs * 2 ** attempt));
    }
  }
  throw lastError instanceof Error ? lastError : new Error(`Không thể tải ${url}`);
}

export async function readThroughCache(
  url: string,
  cacheFile: string,
  options: FetchOptions & { resume?: boolean } = {},
): Promise<string> {
  if (options.resume !== false && fs.existsSync(cacheFile)) return fs.readFileSync(cacheFile, "utf8");
  const response = await fetchWithRetry(url, options);
  const body = await response.text();
  fs.mkdirSync(path.dirname(cacheFile), { recursive: true });
  const temporary = `${cacheFile}.${process.pid}.tmp`;
  fs.writeFileSync(temporary, body);
  fs.renameSync(temporary, cacheFile);
  return body;
}

export function parseCliArgs(argv = process.argv.slice(2)): Map<string, string | true> {
  const args = new Map<string, string | true>();
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (!item.startsWith("--")) continue;
    const [key, inlineValue] = item.slice(2).split("=", 2);
    if (inlineValue !== undefined) args.set(key, inlineValue);
    else if (argv[index + 1] && !argv[index + 1].startsWith("--")) args.set(key, argv[++index]);
    else args.set(key, true);
  }
  return args;
}

export function writeJsonAtomic(file: string, value: unknown): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temporary = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`);
  fs.renameSync(temporary, file);
}
