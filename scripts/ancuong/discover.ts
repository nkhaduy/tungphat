import { atomicWriteJson } from "./stable-json";
import { createHttpClient } from "./http-client";
import { paths, crawlerConfig } from "./config";
import { parseCatalogueCategories } from "./html";
import type { CliOptions, DiscoveryManifest } from "./types";
import {
  parseRobotsSitemapLocations,
  parseSitemapLocations,
  selectCanonicalProductUrls,
} from "./discover-sitemaps";

type DiscoveryDependencies = {
  outputPath?: string;
  fetchText?: (url: string) => Promise<{ body: string; contentHash?: string }>;
  now?: () => string;
};

export async function run(options: CliOptions, dependencies: DiscoveryDependencies = {}): Promise<DiscoveryManifest> {
  const now = dependencies.now ?? (() => new Date().toISOString());
  const client = dependencies.fetchText ? undefined : createHttpClient();
  const fetchText = dependencies.fetchText ?? ((url: string) => client!.fetchText(url));
  const response = await fetchText(crawlerConfig.sourceRoot);
  const categories = parseCatalogueCategories(response.body);
  const robotsUrl = "https://ancuong.com/robots.txt";
  const robots = await fetchText(robotsUrl);
  const declaredSitemaps = parseRobotsSitemapLocations(robots.body);
  const sitemapIndexUrl = declaredSitemaps.find((url) => new URL(url).pathname === "/sitemap.xml");
  const sitemapIndex = sitemapIndexUrl ? await fetchText(sitemapIndexUrl) : undefined;
  const sitemapUrls = sitemapIndex ? parseSitemapLocations(sitemapIndex.body) : declaredSitemaps;
  const productSitemapUrl = sitemapUrls.find((url) => new URL(url).pathname === "/sitemap-product.xml");
  const categorySitemapUrl = sitemapUrls.find((url) => new URL(url).pathname === "/sitemap-category-product.xml");
  const productLineSitemapUrl = sitemapUrls.find((url) => new URL(url).pathname === "/sitemap-product-line.xml");
  const [productSitemap, categorySitemap, productLineSitemap] = await Promise.all([
    productSitemapUrl ? fetchText(productSitemapUrl) : undefined,
    categorySitemapUrl ? fetchText(categorySitemapUrl) : undefined,
    productLineSitemapUrl ? fetchText(productLineSitemapUrl) : undefined,
  ]);
  const selectedProducts = selectCanonicalProductUrls(productSitemap ? parseSitemapLocations(productSitemap.body) : []);
  const manifest: DiscoveryManifest = {
    schemaVersion: "1.0.0",
    parserVersion: crawlerConfig.parserVersion,
    sourceRoot: crawlerConfig.sourceRoot,
    generatedAt: now(),
    categories,
    productUrls: [],
    robotsUrl,
    ...(sitemapIndexUrl ? { sitemapIndexUrl } : {}),
    sitemapUrls,
    sitemapCategoryUrls: categorySitemap ? parseSitemapLocations(categorySitemap.body) : [],
    sitemapProductUrls: selectedProducts.canonicalProductUrls,
    sitemapProductAliases: selectedProducts.aliases,
    sitemapNonNumericProductUrls: selectedProducts.nonNumericProductUrls,
    sitemapProductLineUrls: productLineSitemap ? parseSitemapLocations(productLineSitemap.body) : [],
    duplicateUrls: [],
    excludedUrls: []
  };
  if (!options.dryRun) await atomicWriteJson(dependencies.outputPath ?? `${paths.reports}/discovery-manifest.json`, manifest);
  return manifest;
}
