import { createHttpClient } from "./http-client";
import { parseProductDetail, type ParsedProductDetail } from "./html";
import { paths } from "./config";
import { atomicWriteJson, readJsonIfExists } from "./stable-json";
import { createCheckpointStore } from "./state";
import type { CliOptions, ListingProduct } from "./types";
import { mapConcurrent } from "./concurrency";

type DetailDependencies = {
  listingsPath?: string;
  outputPath?: string;
  statePath?: string;
  diffPath?: string;
  fetchText?: (url: string) => Promise<{ body: string; contentHash?: string }>;
  now?: () => string;
};

export async function run(options: CliOptions, dependencies: DetailDependencies = {}): Promise<ParsedProductDetail[]> {
  const listingsPath = dependencies.listingsPath ?? `${paths.raw}/listings.json`;
  const outputPath = dependencies.outputPath ?? `${paths.raw}/details.json`;
  const statePath = dependencies.statePath ?? `${paths.state}/crawl-details.json`;
  const listings = await readJsonIfExists<ListingProduct[]>(listingsPath);
  if (!listings) throw new Error(`Listing dataset not found: ${listingsPath}`);
  const client = createHttpClient();
  const fetchText = dependencies.fetchText ?? (async (url: string) => client.fetchText(url));
  const now = dependencies.now ?? (() => new Date().toISOString());
  const store = await createCheckpointStore(statePath);
  const previous = (options.resume || options.changedOnly) && !options.force ? (await readJsonIfExists<ParsedProductDetail[]>(outputPath)) ?? [] : [];
  const diff = options.changedOnly
    ? await readJsonIfExists<{ entries?: Array<{ classification?: string; sourceUrl?: string }> }>(dependencies.diffPath ?? `${paths.reports}/latest-diff.json`)
    : undefined;
  if (options.changedOnly && !diff) throw new Error("--changed-only requires an existing latest-diff.json report");
  const changedUrls = new Set((diff?.entries ?? []).filter((entry) => entry.classification !== "UNCHANGED").map((entry) => entry.sourceUrl).filter((value): value is string => Boolean(value)));
  const selected = listings.filter((listing) =>
    (!options.category || listing.categorySlug === options.category) &&
    (!options.product || options.product === listing.sourceId || options.product === listing.sourceUrl) &&
    (!options.changedOnly || changedUrls.has(listing.sourceUrl))
  );
  const priorByUrl = new Map(previous.map((detail) => [detail.sourceUrl, detail]));
  const work = options.limit ? selected.slice(0, options.limit) : selected;
  const selectedUrls = new Set(work.map((listing) => listing.sourceUrl));
  const preserved = previous.filter((detail) => !selectedUrls.has(detail.sourceUrl));
  const fetched = await mapConcurrent(work, options.concurrency, async (listing) => {
    if (options.resume && !options.force && await store.get(listing.sourceUrl) === "parsed" && priorByUrl.has(listing.sourceUrl)) {
      return priorByUrl.get(listing.sourceUrl)!;
    }
    if (!options.dryRun) await store.set(listing.sourceUrl, "fetching");
    try {
      const response = await fetchText(listing.sourceUrl);
      if (!options.dryRun) await store.set(listing.sourceUrl, "fetched");
      const detail = parseProductDetail(response.body, {
        sourceUrl: listing.sourceUrl,
        sourceHash: response.contentHash ?? "",
        discoveredAt: now(),
        fetchedAt: now()
      });
      if (!options.dryRun) await store.set(listing.sourceUrl, "parsed");
      return detail;
    } catch (error) {
      if (!options.dryRun) await store.set(listing.sourceUrl, "failed-retryable", error instanceof Error ? error.message : String(error));
      throw error;
    }
  });
  const result = [...preserved, ...fetched];
  result.sort((a, b) => a.sourceUrl.localeCompare(b.sourceUrl));
  if (!options.dryRun) await atomicWriteJson(outputPath, result);
  return result;
}
