import type { CatalogSearchEntry, SupplierId } from "./types";

export type CatalogSearchIntent = "all" | "melamine" | "supplier";

export function normalizeCatalogSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "");
}

function rank(entry: CatalogSearchEntry, query: string): number {
  const code = normalizeCatalogSearch(entry.normalizedCode ?? entry.code);
  const name = normalizeCatalogSearch(entry.name);
  const supplier = normalizeCatalogSearch(entry.supplierName);
  const category = normalizeCatalogSearch(entry.category ?? "");
  const series = normalizeCatalogSearch(entry.series ?? "");
  const group = normalizeCatalogSearch(entry.group ?? "");
  const taxonomy = normalizeCatalogSearch(
    [entry.supplierName, entry.category, entry.series, entry.group, entry.material]
      .filter(Boolean)
      .join(" "),
  );

  if (code && code === query) return 1_000;
  if (name === query) return 900;
  if (code && code.startsWith(query)) return 800;
  if (supplier === query) return 700;
  if (category === query || series === query || group === query || normalizeCatalogSearch(entry.material ?? "") === query) return 600;
  if (code && code.includes(query)) return 500;
  if (name.includes(query)) return 400;
  if (taxonomy.includes(query)) return 300;
  return 0;
}

const groupDemandWeights: Record<string, number> = {
  VANGO: 36,
  DONSAC: 32,
  VANDA: 24,
  VANVAI: 18,
};

export function catalogMerchandisingScore(entry: CatalogSearchEntry): number {
  const taxonomy = normalizeCatalogSearch(
    [entry.name, entry.category, entry.series, entry.group]
      .filter(Boolean)
      .join(" "),
  );
  const group = normalizeCatalogSearch(entry.group ?? entry.category ?? "");
  let score =
    (entry.demandScore ?? 0) + (entry.kind === "color-code" ? 120 : 0);

  if (taxonomy.includes("MELAMINE")) score += 80;
  score += groupDemandWeights[group] ?? 0;
  if (entry.thumbnail) score += 12;
  if (entry.code.trim()) score += 8;
  if (entry.category) score += 6;
  if (entry.series || entry.group) score += 4;

  return score;
}

export function searchSupplierCatalog(
  entries: CatalogSearchEntry[],
  query: string,
  options: {
    supplierId?: SupplierId;
    category?: string;
    group?: string;
    material?: string;
    type?: Exclude<CatalogSearchIntent, "supplier">;
  } = {},
): CatalogSearchEntry[] {
  const normalizedQuery = normalizeCatalogSearch(query);
  const normalizedCategory = normalizeCatalogSearch(options.category ?? "");
  const normalizedGroup = normalizeCatalogSearch(options.group ?? "");
  const normalizedMaterial = normalizeCatalogSearch(options.material ?? "");

  return entries
    .map((entry) => ({
      entry,
      matchScore: normalizedQuery ? rank(entry, normalizedQuery) : 1,
      merchandisingScore: catalogMerchandisingScore(entry),
    }))
    .filter(({ entry, matchScore }) => {
      if (options.supplierId && entry.supplierId !== options.supplierId)
        return false;
      if (
        options.type === "melamine" &&
        entry.kind !== "color-code" &&
        !normalizeCatalogSearch(
          [entry.name, entry.category, entry.series, entry.group]
            .filter(Boolean)
            .join(" "),
        ).includes("MELAMINE")
      )
        return false;
      if (
        normalizedCategory &&
        normalizeCatalogSearch(entry.category ?? "") !== normalizedCategory
      )
        return false;
      if (
        normalizedMaterial &&
        normalizeCatalogSearch(entry.material ?? "") !== normalizedMaterial
      )
        return false;
      if (
        normalizedGroup &&
        ![entry.category, entry.group].some(
          (value) => normalizeCatalogSearch(value ?? "") === normalizedGroup,
        )
      )
        return false;
      return matchScore > 0;
    })
    .sort(
      (left, right) =>
        right.matchScore - left.matchScore ||
        right.merchandisingScore - left.merchandisingScore ||
        left.entry.code.localeCompare(right.entry.code, "vi") ||
        left.entry.name.localeCompare(right.entry.name, "vi") ||
        left.entry.canonicalRoute.localeCompare(
          right.entry.canonicalRoute,
          "vi",
        ),
    )
    .map(({ entry }) => entry);
}
