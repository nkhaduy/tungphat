import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { assertAllowedBaThanhUrl } from "@/lib/catalog/source-security";
import { CACHE_DIR, MAX_RETRIES, REQUEST_TIMEOUT_MS, USER_AGENT } from "./config";

function cachePath(url: string, extension: "html" | "bin" | "json") {
  const key = crypto.createHash("sha256").update(url).digest("hex");
  return path.join(CACHE_DIR, `${key}.${extension}`);
}

export async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchBytes(url: string, options: { cache?: boolean; timeoutMs?: number } = {}) {
  assertAllowedBaThanhUrl(url);
  const target = cachePath(url, "bin");
  if (options.cache !== false) {
    try {
      return await fs.readFile(target);
    } catch {
      // Cache miss; fetch below.
    }
  }

  let lastError: unknown;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(url, {
        headers: { "user-agent": USER_AGENT, accept: "image/avif,image/webp,image/jpeg,image/png,*/*" },
        redirect: "manual",
        signal: controller.signal,
      });
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (!location) throw new Error(`Redirect không có Location: ${url}`);
        const redirected = new URL(location, url).toString();
        assertAllowedBaThanhUrl(redirected);
        clearTimeout(timeout);
        return fetchBytes(redirected, options);
      }
      if (!response.ok) throw new Error(`HTTP ${response.status} khi tải ${url}`);
      const bytes = Buffer.from(await response.arrayBuffer());
      await fs.mkdir(CACHE_DIR, { recursive: true });
      await fs.writeFile(target, bytes);
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

export async function fetchText(url: string, options: { cache?: boolean; timeoutMs?: number } = {}) {
  assertAllowedBaThanhUrl(url);
  const target = cachePath(url, "html");
  if (options.cache !== false) {
    try {
      return await fs.readFile(target, "utf8");
    } catch {
      // Cache miss; fetch below.
    }
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
