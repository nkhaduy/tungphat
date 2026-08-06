import type { CatalogSearchEntry, SupplierId } from "./types";

export function normalizeCatalogSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "");
}

function rank(entry: CatalogSearchEntry, query: string): number {
  const code = normalizeCatalogSearch(entry.code);
  const name = normalizeCatalogSearch(entry.name);
  const taxonomy = normalizeCatalogSearch(
    [entry.supplierName, entry.category, entry.series, entry.group]
      .filter(Boolean)
      .join(" "),
  );

  if (code === query) return 500;
  if (code.startsWith(query)) return 400;
  if (name.startsWith(query)) return 300;
  if (code.includes(query)) return 250;
  if (name.includes(query)) return 200;
  if (taxonomy.includes(query)) return 100;
  return 0;
}

export function searchSupplierCatalog(
  entries: CatalogSearchEntry[],
  query: string,
  options: { supplierId?: SupplierId; category?: string } = {},
): CatalogSearchEntry[] {
  const normalizedQuery = normalizeCatalogSearch(query);
  const normalizedCategory = normalizeCatalogSearch(options.category ?? "");

  return entries
    .map((entry, position) => ({ entry, position, score: normalizedQuery ? rank(entry, normalizedQuery) : 1 }))
    .filter(({ entry, score }) => {
      if (options.supplierId && entry.supplierId !== options.supplierId) return false;
      if (normalizedCategory && normalizeCatalogSearch(entry.category ?? "") !== normalizedCategory) return false;
      return score > 0;
    })
    .sort((left, right) => right.score - left.score || left.position - right.position)
    .map(({ entry }) => entry);
}

