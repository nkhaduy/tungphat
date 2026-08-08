import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { checksumThanhThuySourceManifest } from "./discover";
import {
  THANH_THUY_USER_AGENT,
  isValidProductRecordUrl,
  parseCliArgs,
  writeJsonAtomic,
} from "./lib";
import type { SourceManifest } from "./types";

type ProductUrlEvidence = SourceManifest["productUrlEvidence"][string];

async function requestHead(url: string): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20_000);
    try {
      let response = await fetch(url, {
        method: "HEAD",
        redirect: "manual",
        headers: { "User-Agent": THANH_THUY_USER_AGENT, Accept: "text/html" },
        signal: controller.signal,
      });
      if (response.status === 405) {
        response = await fetch(url, {
          method: "GET",
          redirect: "manual",
          headers: { "User-Agent": THANH_THUY_USER_AGENT, Accept: "text/html" },
          signal: controller.signal,
        });
        await response.body?.cancel();
      }
      if (response.status !== 429 && response.status < 500) return response;
      lastError = new Error(`HTTP ${response.status}: ${url}`);
    } catch (error) {
      lastError = error;
    } finally {
      clearTimeout(timer);
    }
    await new Promise((resolve) => setTimeout(resolve, 400 * 2 ** attempt));
  }
  throw lastError instanceof Error ? lastError : new Error(`Không thể kiểm tra ${url}`);
}

export async function inspectThanhThuyProductUrl(url: string, checkedAt: string): Promise<ProductUrlEvidence> {
  if (!isValidProductRecordUrl(url)) throw new Error(`URL sản phẩm ngoài phạm vi: ${url}`);
  let current = new URL(url).toString();
  const redirects: string[] = [];
  for (let hop = 0; hop <= 5; hop += 1) {
    const response = await requestHead(current);
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      const next = location ? new URL(location, current).toString() : "";
      if (!next || !isValidProductRecordUrl(next)) {
        return { status: response.status, canonicalUrl: current, redirects, checkedAt, error: "Redirect outside the approved public product path." };
      }
      if (redirects.includes(next) || next === current) {
        return { status: response.status, canonicalUrl: current, redirects, checkedAt, error: "Redirect loop detected." };
      }
      redirects.push(next);
      current = next;
      continue;
    }
    return { status: response.status, canonicalUrl: current, redirects, checkedAt };
  }
  return { status: 0, canonicalUrl: current, redirects, checkedAt, error: "Redirect limit exceeded." };
}

export async function auditThanhThuyProductUrls(options: {
  root?: string;
  refresh?: boolean;
  concurrency?: number;
} = {}): Promise<SourceManifest> {
  const root = options.root ?? process.cwd();
  const manifestFile = path.join(root, "data/imports/thanh-thuy/source-manifest.json");
  const cacheFile = path.join(root, ".cache/thanh-thuy/discovery/product-url-evidence.json");
  const manifest = JSON.parse(fs.readFileSync(manifestFile, "utf8")) as SourceManifest;
  const cached = !options.refresh && fs.existsSync(cacheFile)
    ? JSON.parse(fs.readFileSync(cacheFile, "utf8")) as SourceManifest["productUrlEvidence"]
    : {};
  const evidence: SourceManifest["productUrlEvidence"] = { ...manifest.productUrlEvidence, ...cached };
  const pending = manifest.productUrls.filter((url) =>
    options.refresh || !evidence[url] || evidence[url].status !== 200);
  const checkedAt = new Date().toISOString();
  const concurrency = Math.max(1, Math.min(options.concurrency ?? 4, 6));

  for (let index = 0; index < pending.length; index += concurrency) {
    const chunk = pending.slice(index, index + concurrency);
    const results = await Promise.all(chunk.map(async (url) => {
      try {
        return [url, await inspectThanhThuyProductUrl(url, checkedAt)] as const;
      } catch (error) {
        const failed: ProductUrlEvidence = {
          status: 0,
          canonicalUrl: url,
          redirects: [],
          checkedAt,
          error: error instanceof Error ? error.message : String(error),
        };
        return [url, failed] as const;
      }
    }));
    for (const [url, item] of results) evidence[url] = item;
    writeJsonAtomic(cacheFile, evidence);
    if ((index + chunk.length) % 25 < concurrency || index + chunk.length === pending.length) {
      console.log(`Thanh Thuỳ URL audit: ${index + chunk.length}/${pending.length}`);
    }
  }

  manifest.productUrlEvidence = Object.fromEntries(
    manifest.productUrls.map((url) => [url, evidence[url]]).filter((entry) => Boolean(entry[1])),
  );
  manifest.checksum = checksumThanhThuySourceManifest(manifest);
  writeJsonAtomic(manifestFile, manifest);
  return manifest;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = parseCliArgs();
  auditThanhThuyProductUrls({
    refresh: args.has("refresh"),
    concurrency: typeof args.get("concurrency") === "string" ? Number(args.get("concurrency")) : undefined,
  }).then((manifest) => {
    const values = Object.values(manifest.productUrlEvidence);
    console.log(JSON.stringify({
      total: values.length,
      ok: values.filter((item) => item.status === 200).length,
      redirected: values.filter((item) => item.redirects.length > 0).length,
      failed: values.filter((item) => item.status !== 200).length,
    }, null, 2));
  }).catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
