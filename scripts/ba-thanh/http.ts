import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { assertAllowedBaThanhUrl } from "@/lib/catalog/source-security";
import { CACHE_DIR, CACHE_MAX_AGE_MS, MAX_RETRIES, REQUEST_TIMEOUT_MS, USER_AGENT } from "./config";

function cachePath(url: string, extension: "html" | "bin" | "json") {
  const key = crypto.createHash("sha256").update(url).digest("hex");
  return path.join(CACHE_DIR, `${key}.${extension}`);
}

type FetchLike = (input: string | URL, init?: RequestInit) => Promise<Response>;
export type FetchResponseMetadata = { finalUrl: string; redirects: string[]; fromCache: boolean };

export function isCacheFresh(mtimeMs: number, nowMs: number, maxAgeMs: number) {
  return nowMs - mtimeMs <= maxAgeMs;
}

type FetchOptions = {
  cache?: boolean;
  refresh?: boolean;
  timeoutMs?: number;
  maxAgeMs?: number;
  validateUrl?: (url: string) => void;
  onResponse?: (metadata: FetchResponseMetadata) => void;
};

async function readCache(target: string, encoding: "utf8", options: FetchOptions): Promise<string | undefined>;
async function readCache(target: string, encoding: undefined, options: FetchOptions): Promise<Buffer | undefined>;
async function readCache(target: string, encoding: "utf8" | undefined, options: FetchOptions): Promise<string | Buffer | undefined> {
  if (options.cache === false || options.refresh) return undefined;
  try {
    const stat = await fs.stat(target);
    if (!isCacheFresh(stat.mtimeMs, Date.now(), options.maxAgeMs ?? CACHE_MAX_AGE_MS)) return undefined;
    return encoding ? fs.readFile(target, encoding) : fs.readFile(target);
  } catch {
    return undefined;
  }
}

export async function fetchBaThanhResponse(
  url: string,
  options: { fetchImpl?: FetchLike; maxRedirects?: number; signal?: AbortSignal; requestInit?: RequestInit; validateUrl?: (url: string) => void } = {},
) {
  const fetchImpl = options.fetchImpl || fetch;
  assertAllowedBaThanhUrl(url);
  options.validateUrl?.(url);
  const maxRedirects = options.maxRedirects ?? 5;
  const redirects: string[] = [];
  const visited = new Set([url]);
  let currentUrl = url;
  while (true) {
    const response = await fetchImpl(currentUrl, {
      ...options.requestInit,
      redirect: "manual",
      signal: options.signal,
    });
    if (response.status < 300 || response.status >= 400) {
      return { response, finalUrl: currentUrl, redirects };
    }
    const location = response.headers.get("location");
    if (!location) throw new Error(`Redirect không có Location: ${currentUrl}`);
    const redirected = new URL(location, currentUrl).toString();
    assertAllowedBaThanhUrl(redirected);
    options.validateUrl?.(redirected);
    if (visited.has(redirected)) throw new Error(`Phát hiện redirect loop: ${redirected}`);
    if (redirects.length >= maxRedirects) throw new Error(`Vượt quá ${maxRedirects} redirect: ${url}`);
    redirects.push(redirected);
    visited.add(redirected);
    currentUrl = redirected;
  }
}

export async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchBytes(url: string, options: FetchOptions = {}) {
  assertAllowedBaThanhUrl(url);
  options.validateUrl?.(url);
  const target = cachePath(url, "bin");
  const cached = await readCache(target, undefined, options);
  if (cached) {
    options.onResponse?.({ finalUrl: url, redirects: [], fromCache: true });
    return cached;
  }

  let lastError: unknown;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? REQUEST_TIMEOUT_MS);
    try {
      const { response, finalUrl, redirects } = await fetchBaThanhResponse(url, {
        signal: controller.signal,
        validateUrl: options.validateUrl,
        requestInit: { headers: { "user-agent": USER_AGENT, accept: "image/avif,image/webp,image/jpeg,image/png,*/*" } },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status} khi tải ${url}`);
      const bytes = Buffer.from(await response.arrayBuffer());
      await fs.mkdir(CACHE_DIR, { recursive: true });
      await fs.writeFile(target, bytes);
      options.onResponse?.({ finalUrl, redirects, fromCache: false });
      clearTimeout(timeout);
      return bytes;
    } catch (error) {
      lastError = error;
      clearTimeout(timeout);
      if (attempt < MAX_RETRIES - 1) await sleep(250 * 2 ** attempt);
    }
  }
  throw lastError instanceof Error ? lastError : new Error(`Không thể tải ${url}`);
}

export async function fetchText(url: string, options: FetchOptions = {}) {
  assertAllowedBaThanhUrl(url);
  options.validateUrl?.(url);
  const target = cachePath(url, "html");
  const cached = await readCache(target, "utf8", options);
  if (cached) {
    options.onResponse?.({ finalUrl: url, redirects: [], fromCache: true });
    return cached;
  }

  const bytes = await fetchBytes(url, { ...options, cache: false });
  const text = bytes.toString("utf8");
  await fs.mkdir(CACHE_DIR, { recursive: true });
  await fs.writeFile(target, text);
  return text;
}

export async function mapWithConcurrency<T, R>(items: T[], concurrency: number, worker: (item: T, index: number) => Promise<R>) {
  const output: R[] = new Array(items.length);
  let next = 0;
  async function run() {
    while (true) {
      const index = next++;
      if (index >= items.length) return;
      output[index] = await worker(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length || 1) }, () => run()));
  return output;
}
