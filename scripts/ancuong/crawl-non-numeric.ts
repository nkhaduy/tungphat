import { createHash } from "node:crypto";
import { join } from "node:path";
import { mapConcurrent } from "./concurrency";
import { paths } from "./config";
import { parseProductDetail } from "./html";
import { createHttpClient } from "./http-client";
import { atomicWriteJson, readJsonIfExists } from "./stable-json";
import type { CliOptions, DiscoveryManifest, ListingProduct } from "./types";

export type NonNumericProductPage = {
  sourceUrl: string;
  status: number;
  contentHash: string;
  html: string;
};

export type NonNumericProductAccounting = {
  sourceUrl: string;
  status: number;
  checksum: string;
  canonicalUrl?: string;
  productCode?: string;
  outcome: "imported" | "duplicate" | "invalid";
  reason?: string;
};

export type NonNumericProductAudit = {
  generatedAt: string;
  listings: ListingProduct[];
  accounting: NonNumericProductAccounting[];
};

type CrawlDependencies = {
  discoveryPath?: string;
  outputPath?: string;
  cacheDirectory?: string;
  fetchText?: (url: string) => Promise<{ body: string; status: number; contentHash: string }>;
  now?: () => string;
};

function categoryFromUrl(sourceUrl: string): { category: string; categorySlug: string } {
  const categorySlug = new URL(sourceUrl).pathname.split("/").filter(Boolean)[0] ?? "unknown";
  const category = categorySlug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
  return { category, categorySlug };
}

function isProductPage(html: string): boolean {
  return /id=["']product-page["']/i.test(html) && /class=["'][^"']*title-info/i.test(html);
}

function canonicalCandidate(left: NonNumericProductPage, right: NonNumericProductPage, currentCategorySlugs: Set<string>): number {
  const leftCategory = categoryFromUrl(left.sourceUrl).categorySlug;
  const rightCategory = categoryFromUrl(right.sourceUrl).categorySlug;
  const categoryDifference = Number(currentCategorySlugs.has(rightCategory)) - Number(currentCategorySlugs.has(leftCategory));
  if (categoryDifference) return categoryDifference;
  const localeDifference = Number(/-en\.html$/i.test(left.sourceUrl)) - Number(/-en\.html$/i.test(right.sourceUrl));
  return localeDifference || left.sourceUrl.localeCompare(right.sourceUrl);
}

export function reconcileNonNumericProductPages(
  pages: NonNumericProductPage[],
  currentCategorySlugs: Set<string>,
  auditedAt: string,
): { listings: ListingProduct[]; accounting: NonNumericProductAccounting[] } {
  const accounting: NonNumericProductAccounting[] = [];
  const products = new Map<string, Array<{ page: NonNumericProductPage; listing: ListingProduct }>>();

  for (const page of pages) {
    if (page.status !== 200 || !isProductPage(page.html)) {
      accounting.push({
        sourceUrl: page.sourceUrl,
        status: page.status,
        checksum: page.contentHash,
        outcome: "invalid",
        reason: "The sitemap URL resolved to a non-product page",
      });
      continue;
    }
    const detail = parseProductDetail(page.html, {
      sourceUrl: page.sourceUrl,
      sourceHash: page.contentHash,
      discoveredAt: auditedAt,
      fetchedAt: auditedAt,
    });
    if (!detail.name || !detail.productCode) {
      accounting.push({
        sourceUrl: page.sourceUrl,
        status: page.status,
        checksum: page.contentHash,
        outcome: "invalid",
        reason: "The product page has no verifiable name or product code",
      });
      continue;
    }
    const category = categoryFromUrl(page.sourceUrl);
    const listing: ListingProduct = {
      sourceUrl: page.sourceUrl,
      sourceId: "",
      category: category.category,
      categorySlug: category.categorySlug,
      productCode: detail.productCode,
      name: detail.name,
      ...(detail.primaryImageUrl ? { imageUrl: detail.primaryImageUrl } : {}),
      facetKeys: detail.facets,
    };
    const codeKey = detail.productCode.normalize("NFKC").replace(/\s+/g, " ").trim().toLocaleUpperCase("vi");
    const group = products.get(codeKey) ?? [];
    group.push({ page, listing });
    products.set(codeKey, group);
  }

  const listings: ListingProduct[] = [];
  for (const group of products.values()) {
    const sorted = [...group].sort((left, right) => canonicalCandidate(left.page, right.page, currentCategorySlugs));
    const canonical = sorted[0];
    listings.push(canonical.listing);
    for (const entry of sorted) {
      accounting.push({
        sourceUrl: entry.page.sourceUrl,
        status: entry.page.status,
        checksum: entry.page.contentHash,
        canonicalUrl: canonical.page.sourceUrl,
        productCode: canonical.listing.productCode,
        outcome: entry === canonical ? "imported" : "duplicate",
        ...(entry === canonical ? {} : { reason: `Duplicate locale route for product code ${canonical.listing.productCode}` }),
      });
    }
  }

  return {
    listings: listings.sort((left, right) => left.sourceUrl.localeCompare(right.sourceUrl)),
    accounting: accounting.sort((left, right) => left.sourceUrl.localeCompare(right.sourceUrl)),
  };
}

function cachePath(cacheDirectory: string, sourceUrl: string): string {
  return join(cacheDirectory, `${createHash("sha256").update(sourceUrl).digest("hex")}.json`);
}

export async function run(options: CliOptions, dependencies: CrawlDependencies = {}): Promise<NonNumericProductAudit> {
  const discoveryPath = dependencies.discoveryPath ?? join(paths.reports, "discovery-manifest.json");
  const outputPath = dependencies.outputPath ?? join(paths.reports, "non-numeric-product-audit.json");
  const cacheDirectory = dependencies.cacheDirectory ?? join(paths.root, "cache", "non-numeric-products");
  const manifest = await readJsonIfExists<DiscoveryManifest>(discoveryPath);
  if (!manifest) throw new Error(`Discovery manifest not found: ${discoveryPath}`);
  const urls = [...new Set(manifest.sitemapNonNumericProductUrls ?? [])].sort();
  const client = dependencies.fetchText ? undefined : createHttpClient();
  const fetchText = dependencies.fetchText ?? ((url: string) => client!.fetchText(url));
  const pages = await mapConcurrent(urls, options.concurrency, async (sourceUrl): Promise<NonNumericProductPage> => {
    const pageCachePath = cachePath(cacheDirectory, sourceUrl);
    if (options.resume && !options.force) {
      const cached = await readJsonIfExists<NonNumericProductPage>(pageCachePath);
      if (cached?.sourceUrl === sourceUrl) return cached;
    }
    const response = await fetchText(sourceUrl);
    const page = { sourceUrl, status: response.status, contentHash: response.contentHash, html: response.body };
    if (!options.dryRun) await atomicWriteJson(pageCachePath, page);
    return page;
  });
  const generatedAt = (dependencies.now ?? (() => new Date().toISOString()))();
  const reconciled = reconcileNonNumericProductPages(
    pages,
    new Set((manifest.categories ?? []).map((category) => category.slug)),
    generatedAt,
  );
  const result: NonNumericProductAudit = { generatedAt, ...reconciled };
  if (!options.dryRun) await atomicWriteJson(outputPath, result);
  return result;
}
