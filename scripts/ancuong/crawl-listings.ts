import { createHttpClient } from "./http-client";
import { parseListingPage } from "./html";
import { paths } from "./config";
import { atomicWriteJson, readJsonIfExists } from "./stable-json";
import { createCheckpointStore } from "./state";
import type { CliOptions, DiscoveryManifest, ListingProduct } from "./types";
import { mapConcurrent } from "./concurrency";

type ListingDependencies = {
  discoveryPath?: string;
  outputPath?: string;
  statePath?: string;
  fetchText?: (url: string) => Promise<{ body: string; contentHash?: string }>;
  now?: () => string;
};

function syntheticListing(sourceUrl: string): ListingProduct | undefined {
  const url = new URL(sourceUrl);
  const sourceId = url.pathname.match(/\/(\d+)(?:-en)?\.html$/i)?.[1];
  if (!sourceId) return undefined;
  const categorySlug = url.pathname.split("/").filter(Boolean)[0] ?? "unknown";
  const category = categorySlug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
  return {
    sourceUrl,
    sourceId,
    category,
    categorySlug,
    productCode: sourceId,
    name: sourceId,
    facetKeys: {},
  };
}

export async function run(options: CliOptions, dependencies: ListingDependencies = {}): Promise<ListingProduct[]> {
  const discoveryPath = dependencies.discoveryPath ?? `${paths.reports}/discovery-manifest.json`;
  const outputPath = dependencies.outputPath ?? `${paths.raw}/listings.json`;
  const statePath = dependencies.statePath ?? `${paths.state}/crawl-listings.json`;
  const manifest = await readJsonIfExists<DiscoveryManifest>(discoveryPath);
  if (!manifest) throw new Error(`Discovery manifest not found: ${discoveryPath}`);
  const client = createHttpClient();
  const fetchText = dependencies.fetchText ?? (async (url: string) => client.fetchText(url));
  const store = await createCheckpointStore(statePath);
  const previous = options.resume && !options.force ? (await readJsonIfExists<ListingProduct[]>(outputPath)) ?? [] : [];
  const selected = manifest.categories.filter((category) => !options.category || category.slug === options.category);
  const products = [...previous.filter((product) => !selected.some((category) => category.slug === product.categorySlug))];

  const fetchCategory = async (category: DiscoveryManifest["categories"][number]): Promise<ListingProduct[]> => {
    if (options.resume && !options.force && await store.get(category.sourceUrl) === "parsed") {
      return previous.filter((product) => product.categorySlug === category.slug);
    }
    if (!options.dryRun) await store.set(category.sourceUrl, "fetching");
    try {
      const response = await fetchText(category.sourceUrl);
      if (!options.dryRun) await store.set(category.sourceUrl, "fetched");
      const parsed = parseListingPage(response.body, category.sourceUrl).products;
      if (!options.dryRun) await store.set(category.sourceUrl, "parsed");
      return parsed;
    } catch (error) {
      if (!options.dryRun) await store.set(category.sourceUrl, "failed-retryable", error instanceof Error ? error.message : String(error));
      throw error;
    }
  };

  const fetchedByCategory: ListingProduct[][] = [];
  if (options.limit) {
    for (const category of selected) {
      fetchedByCategory.push(await fetchCategory(category));
      products.push(...fetchedByCategory.at(-1)!);
      if (products.length >= options.limit) break;
    }
  } else {
    fetchedByCategory.push(...await mapConcurrent(selected, options.concurrency, fetchCategory));
    products.push(...fetchedByCategory.flat());
  }
  products.push(...(manifest.sitemapProductUrls ?? []).map(syntheticListing).filter((product): product is ListingProduct => Boolean(product)));

  const seen = new Set<string>();
  const duplicateUrls: string[] = [];
  const uniqueProducts = products.filter((product) => {
    if (seen.has(product.sourceUrl)) {
      duplicateUrls.push(product.sourceUrl);
      return false;
    }
    seen.add(product.sourceUrl);
    return true;
  }).sort((a, b) => a.sourceUrl.localeCompare(b.sourceUrl));
  const limited = options.limit ? uniqueProducts.slice(0, options.limit) : uniqueProducts;
  const updatedManifest: DiscoveryManifest = {
    ...manifest,
    productUrls: limited.map((product) => product.sourceUrl),
    duplicateUrls: [...new Set([...manifest.duplicateUrls, ...duplicateUrls])].sort()
  };
  if (!options.dryRun) {
    await atomicWriteJson(outputPath, limited);
    await atomicWriteJson(discoveryPath, updatedManifest);
  }
  return limited;
}
