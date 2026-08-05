import { atomicWriteJson, readJsonIfExists, stableStringify } from "./stable-json";
import { createHttpClient } from "./http-client";
import { paths, crawlerConfig } from "./config";
import { parseCatalogueCategories } from "./html";
import type { CliOptions, DiscoveryManifest } from "./types";

type DiscoveryDependencies = {
  outputPath?: string;
  fetchText?: (url: string) => Promise<{ body: string; contentHash?: string }>;
  now?: () => string;
};

export async function run(options: CliOptions, dependencies: DiscoveryDependencies = {}): Promise<DiscoveryManifest> {
  const now = dependencies.now ?? (() => new Date().toISOString());
  const fetchText = dependencies.fetchText ?? (async (url: string) => createHttpClient().fetchText(url));
  const outputPath = dependencies.outputPath ?? `${paths.reports}/discovery-manifest.json`;
  const previous = await readJsonIfExists<DiscoveryManifest>(outputPath);
  const response = await fetchText(crawlerConfig.sourceRoot);
  const categories = parseCatalogueCategories(response.body);
  const contract = {
    schemaVersion: "1.0.0",
    parserVersion: crawlerConfig.parserVersion,
    sourceRoot: crawlerConfig.sourceRoot,
    categories,
  };
  const previousContract = previous ? {
    schemaVersion: previous.schemaVersion,
    parserVersion: previous.parserVersion,
    sourceRoot: previous.sourceRoot,
    categories: previous.categories,
  } : undefined;
  const unchanged = previousContract !== undefined && stableStringify(previousContract) === stableStringify(contract);
  const stablePrevious = unchanged ? previous : undefined;
  const manifest: DiscoveryManifest = {
    ...contract,
    generatedAt: stablePrevious?.generatedAt ?? now(),
    productUrls: stablePrevious?.productUrls ?? [],
    duplicateUrls: stablePrevious?.duplicateUrls ?? [],
    excludedUrls: stablePrevious?.excludedUrls ?? []
  };
  if (!options.dryRun) await atomicWriteJson(outputPath, manifest);
  return manifest;
}
