import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  THANH_THUY_ORIGIN,
  isAllowedSourceUrl,
  isValidProductRecordUrl,
  parseCliArgs,
  readThroughCache,
  stableChecksum,
  writeJsonAtomic,
} from "./lib";
import type { SourceManifest } from "./types";

const ROBOTS_URL = `${THANH_THUY_ORIGIN}/robots.txt`;
const SITEMAP_INDEX_URL = `${THANH_THUY_ORIGIN}/sitemap_index.xml`;
const PRODUCT_API = `${THANH_THUY_ORIGIN}/wp-json/wp/v2/product`;
const CATEGORY_API = `${THANH_THUY_ORIGIN}/wp-json/wp/v2/product_cat`;

function allSitemapUrls(xml: string): string[] {
  return [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)]
    .map((match) => match[1].replace(/&amp;/g, "&").trim());
}

export function extractSitemapUrls(xml: string): string[] {
  return allSitemapUrls(xml).filter((url) => isAllowedSourceUrl(url) && new URL(url).pathname.startsWith("/products/"));
}

export function robotsAllowsProducts(robots: string): boolean {
  let applies = false;
  for (const rawLine of robots.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, "").trim();
    if (!line) continue;
    const [field, ...rest] = line.split(":");
    const value = rest.join(":").trim();
    if (field.toLowerCase() === "user-agent") applies = value === "*";
    if (applies && field.toLowerCase() === "disallow" && value && "/products/".startsWith(value)) return false;
  }
  return true;
}

export async function discoverSource(options: {
  root?: string;
  cacheDirectory?: string;
  outputFile?: string;
  resume?: boolean;
  now?: string;
} = {}): Promise<SourceManifest> {
  const root = options.root ?? process.cwd();
  const cacheDirectory = options.cacheDirectory ?? path.join(root, ".cache/thanh-thuy/discovery");
  const outputFile = options.outputFile ?? path.join(root, "data/imports/thanh-thuy/source-manifest.json");
  const resume = options.resume ?? true;
  const robots = await readThroughCache(ROBOTS_URL, path.join(cacheDirectory, "robots.txt"), { resume });
  if (!robotsAllowsProducts(robots)) throw new Error("robots.txt không cho phép thu thập /products/.");
  const sitemapIndex = await readThroughCache(SITEMAP_INDEX_URL, path.join(cacheDirectory, "sitemap_index.xml"), { resume });
  const sitemapUrls = allSitemapUrls(sitemapIndex);
  const productSitemaps = sitemapUrls.filter((url) => /^\/product-sitemap\d+\.xml$/.test(new URL(url).pathname)).sort();
  const categorySitemap = sitemapUrls.find((url) => new URL(url).pathname === "/product_cat-sitemap.xml");
  if (!productSitemaps.length || !categorySitemap) throw new Error("Không tìm thấy sitemap sản phẩm/danh mục công khai.");
  for (const url of [...productSitemaps, categorySitemap]) {
    if (!isAllowedSourceUrl(url)) throw new Error(`Sitemap ngoài phạm vi: ${url}`);
  }
  const productUrls = (await Promise.all(productSitemaps.map(async (url, index) => {
    const xml = await readThroughCache(url, path.join(cacheDirectory, `product-sitemap-${index + 1}.xml`), { resume });
    return allSitemapUrls(xml).filter(isValidProductRecordUrl);
  }))).flat();
  const categoryXml = await readThroughCache(categorySitemap, path.join(cacheDirectory, "product_cat-sitemap.xml"), { resume });
  const categoryUrls = extractSitemapUrls(categoryXml).sort();
  const discoveredAt = options.now ?? new Date().toISOString();
  const manifestWithoutChecksum = {
    schemaVersion: 1 as const,
    discoveredAt,
    robotsUrl: ROBOTS_URL,
    sitemapIndexUrl: SITEMAP_INDEX_URL,
    productSitemaps,
    categorySitemap,
    productApi: PRODUCT_API,
    categoryApi: CATEGORY_API,
    productCount: new Set(productUrls).size,
    categoryUrls: [...new Set(categoryUrls)],
  };
  const manifest: SourceManifest = {
    ...manifestWithoutChecksum,
    checksum: stableChecksum({ ...manifestWithoutChecksum, discoveredAt: undefined }),
  };
  writeJsonAtomic(outputFile, manifest);
  return manifest;
}

async function main() {
  const args = parseCliArgs();
  const root = process.cwd();
  const manifest = await discoverSource({
    root,
    cacheDirectory: typeof args.get("cache-dir") === "string" ? path.resolve(String(args.get("cache-dir"))) : undefined,
    outputFile: typeof args.get("output") === "string" ? path.resolve(String(args.get("output"))) : undefined,
    resume: !args.has("refresh"),
  });
  console.log(`Thanh Thuỳ: ${manifest.productCount} sản phẩm, ${manifest.categoryUrls.length} URL danh mục.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
