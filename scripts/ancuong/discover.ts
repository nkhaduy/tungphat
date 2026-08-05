import { atomicWriteJson } from "./stable-json";
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
  const response = await fetchText(crawlerConfig.sourceRoot);
  const categories = parseCatalogueCategories(response.body);
  const manifest: DiscoveryManifest = {
    schemaVersion: "1.0.0",
    parserVersion: crawlerConfig.parserVersion,
    sourceRoot: crawlerConfig.sourceRoot,
    generatedAt: now(),
    categories,
    productUrls: [],
    duplicateUrls: [],
    excludedUrls: []
  };
  if (!options.dryRun) await atomicWriteJson(dependencies.outputPath ?? `${paths.reports}/discovery-manifest.json`, manifest);
  return manifest;
}
