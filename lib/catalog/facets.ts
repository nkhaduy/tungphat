import type { CatalogSearchEntry, CanonicalCatalogGroup, SupplierId } from "./core/types";

export type CatalogueFacetState = {
  supplier?: SupplierId[];
  material?: string[];
  pattern?: CanonicalCatalogGroup[];
  surfaceEffect?: string[];
};
export type CatalogueFacetOptions = Record<keyof CatalogueFacetState, Array<{ value: string; count: number }>>;

const keys = ["supplier", "material", "pattern", "surfaceEffect"] as const;
type FacetKey = (typeof keys)[number];

function valueFor(entry: CatalogSearchEntry, key: FacetKey): string | undefined {
  if (key === "supplier") return entry.supplierId;
  if (key === "material") return entry.sourceMaterialType ?? entry.material;
  if (key === "pattern") return entry.canonicalGroup;
  return entry.surfaceEffect?.trim() || undefined;
}

function matches(entry: CatalogSearchEntry, state: CatalogueFacetState): boolean {
  if (entry.kind !== "color-code") return false;
  return keys.every((key) => {
    const selected = state[key] ?? [];
    return selected.length === 0 || selected.includes(valueFor(entry, key) as never);
  });
}

export function filterCatalogueEntries(entries: CatalogSearchEntry[], state: CatalogueFacetState = {}) {
  return entries.filter((entry) => matches(entry, state));
}

export function deriveCatalogueFacets(entries: CatalogSearchEntry[], state: CatalogueFacetState = {}): CatalogueFacetOptions {
  return Object.fromEntries(keys.map((key) => {
    const otherFilters = { ...state, [key]: [] } as CatalogueFacetState;
    const counts = new Map<string, number>();
    for (const entry of filterCatalogueEntries(entries, otherFilters)) {
      const value = valueFor(entry, key);
      if (value) counts.set(value, (counts.get(value) ?? 0) + 1);
    }
    return [key, [...counts].sort(([a], [b]) => a.localeCompare(b, "vi")).map(([value, count]) => ({ value, count }))];
  })) as CatalogueFacetOptions;
}
