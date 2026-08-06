import { run as runDiscover } from "./discover";
import { run as runListings } from "./crawl-listings";
import { run as runDetails } from "./crawl-details";
import { paths } from "./config";
import { atomicWriteJson } from "./stable-json";
import type { CliOptions, ListingProduct } from "./types";

function hasFacet(product: ListingProduct, pattern: RegExp): boolean {
  return Object.keys(product.facetKeys).some((key) => pattern.test(key));
}

function categoryMatches(product: ListingProduct, pattern: RegExp): boolean {
  return pattern.test(`${product.categorySlug} ${product.category}`);
}

export function selectSampleListings(listings: ListingProduct[], requestedLimit = 7): ListingProduct[] {
  const sorted = [...listings].sort((left, right) => left.sourceUrl.localeCompare(right.sourceUrl));
  const selected: ListingProduct[] = [];
  const seen = new Set<string>();
  const add = (item: ListingProduct | undefined) => {
    if (!item || seen.has(item.sourceUrl)) return;
    seen.add(item.sourceUrl);
    selected.push(item);
  };

  add(sorted.find((item) => categoryMatches(item, /melamine/i)));
  add(sorted.find((item) => categoryMatches(item, /laminate/i)));
  add(sorted.find((item) => categoryMatches(item, /acrylic|veneer/i)));
  add(sorted.find((item) => categoryMatches(item, /chi-(?:abs|pvc|dan-canh)/i)));
  add(sorted.find((item) => (item.facetKeys["Kích Thước (mm)"]?.length ?? 0) > 1));
  add(sorted.find((item) => hasFacet(item, /bộ sưu tập/i)));
  add(sorted.find((item) => hasFacet(item, /hiệu ứng bề mặt/i)));
  const target = Math.max(7, requestedLimit);
  for (const item of sorted) {
    if (selected.length >= target) break;
    add(item);
  }
  return selected.slice(0, target);
}

type SamplePipelineDependencies = {
  sampleListingsPath: string;
  sampleDetailsPath: string;
  discover: typeof runDiscover;
  crawlListings: typeof runListings;
  writeListings: typeof atomicWriteJson;
  crawlDetails: typeof runDetails;
};

const defaultDependencies: SamplePipelineDependencies = {
  sampleListingsPath: `${paths.raw}/sample-listings.json`,
  sampleDetailsPath: `${paths.raw}/sample-details.json`,
  discover: runDiscover,
  crawlListings: runListings,
  writeListings: atomicWriteJson,
  crawlDetails: runDetails,
};

export async function runSamplePipeline(
  options: CliOptions,
  dependencies: SamplePipelineDependencies = defaultDependencies,
): Promise<ListingProduct[]> {
  await dependencies.discover(options);
  const listings = await dependencies.crawlListings({ ...options, limit: undefined });
  if (!listings.length) throw new Error("Sample requires a non-empty listing dataset");
  const selected = selectSampleListings(listings, options.limit ?? 7);
  await dependencies.writeListings(dependencies.sampleListingsPath, selected);
  await dependencies.crawlDetails(
    { ...options, limit: undefined },
    {
      listingsPath: dependencies.sampleListingsPath,
      outputPath: dependencies.sampleDetailsPath,
    },
  );
  return selected;
}

export async function run(options: CliOptions): Promise<ListingProduct[]> {
  return runSamplePipeline(options);
}
