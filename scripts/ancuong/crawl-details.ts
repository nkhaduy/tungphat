import { createHttpClient } from "./http-client";
import { parseProductDetail, type ParsedProductDetail } from "./html";
import { paths } from "./config";
import { atomicWriteJson, readJsonIfExists } from "./stable-json";
import { createCheckpointStore } from "./state";
import type { CliOptions, ListingProduct } from "./types";
import { mapConcurrent } from "./concurrency";
import { HttpStatusError } from "./http-client";

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
  const completedByUrl = new Map(preserved.map((detail) => [detail.sourceUrl, detail]));
  let persistQueue = Promise.resolve();
  const persistDetail = async (detail: ParsedProductDetail) => {
    completedByUrl.set(detail.sourceUrl, detail);
    if (options.dryRun) return;
    const snapshot = [...completedByUrl.values()].sort((left, right) => left.sourceUrl.localeCompare(right.sourceUrl));
    persistQueue = persistQueue.then(() => atomicWriteJson(outputPath, snapshot));
    await persistQueue;
  };
  const fetched = await mapConcurrent(work, options.concurrency, async (listing) => {
    if (options.resume && !options.force && await store.get(listing.sourceUrl) === "parsed" && priorByUrl.has(listing.sourceUrl)) {
      const detail = priorByUrl.get(listing.sourceUrl)!;
      completedByUrl.set(detail.sourceUrl, detail);
      return detail;
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
      await persistDetail(detail);
      return detail;
    } catch (error) {
      if (error instanceof HttpStatusError && (error.status === 404 || error.status === 410)) {
        if (!options.dryRun) await store.set(listing.sourceUrl, "failed-final", error.message);
        return undefined;
      }
      if (!options.dryRun) await store.set(listing.sourceUrl, "failed-retryable", error instanceof Error ? error.message : String(error));
      throw error;
    }
  });
  const result = [...preserved, ...fetched.filter((detail): detail is ParsedProductDetail => detail !== undefined)];
  result.sort((a, b) => a.sourceUrl.localeCompare(b.sourceUrl));
  if (!options.dryRun) await atomicWriteJson(outputPath, result);
  return result;
}
