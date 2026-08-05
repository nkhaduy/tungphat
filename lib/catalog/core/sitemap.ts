import { canonicalCatalogPath } from "./routes";
import type { CatalogSitemapEntry } from "./types";

export function composeSupplierSitemap(
  entries: CatalogSitemapEntry[],
): CatalogSitemapEntry[] {
  const paths = new Set<string>();
  const result: CatalogSitemapEntry[] = [];

  for (const entry of entries) {
    if (!entry.indexable || /[?#]/.test(entry.path)) continue;
    const path = canonicalCatalogPath(entry.path);
    if (paths.has(path)) throw new Error(`Duplicate sitemap path: ${path}`);
    paths.add(path);
    result.push({ ...entry, path });
  }

  return result;
}

