import { run as runDiscover } from "./discover";
import { run as runListings } from "./crawl-listings";
import { run as runDetails } from "./crawl-details";
import { run as runRelations } from "./crawl-relations";
import { run as runNormalize } from "./normalize";
import { run as runMedia } from "./download-media";
import { run as runValidate } from "./validate";
import { run as runDiff } from "./diff";
import { run as runExport } from "./export";
import { run as runReport } from "./report";
import { paths } from "./config";
import { atomicWriteJson, readJsonIfExists } from "./stable-json";
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

export async function run(options: CliOptions): Promise<ListingProduct[]> {
  await runDiscover(options);
  await runListings({ ...options, limit: undefined });
  const listings = await readJsonIfExists<ListingProduct[]>(`${paths.raw}/listings.json`);
  if (!listings?.length) throw new Error("Sample requires a non-empty listing dataset");
  const selected = selectSampleListings(listings, options.limit ?? 7);
  await atomicWriteJson(`${paths.raw}/sample-listings.json`, selected);
  await runDetails({ ...options, limit: undefined }, { listingsPath: `${paths.raw}/sample-listings.json` });
  await runRelations(options);
  await runNormalize(options);
  if (!options.skipMedia) await runMedia(options);
  await runValidate(options);
  await runDiff(options);
  await runExport(options);
  await runReport(options);
  return selected;
}
