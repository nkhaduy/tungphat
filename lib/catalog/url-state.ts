import type { CatalogSearchIntent } from "@/lib/catalog/core/search";
import type {
  CanonicalCatalogGroup,
  SupplierId,
} from "@/lib/catalog/core/types";

export type CatalogUrlState = {
  query: string;
  type: CatalogSearchIntent;
  group: string;
  pattern: CanonicalCatalogGroup | "";
  supplierId: SupplierId | "";
};

export type CatalogCollectionUrlState = {
  query: string;
  group: string;
};

const supplierIds = new Set<SupplierId>(["thanh-thuy", "ba-thanh", "an-cuong"]);
const groups = new Set([
  "melamine", "laminate", "acrylic", "pvc-ppet", "veneer", "mdf-hdf",
  "mfc-okal", "joined-wood", "edge-banding", "outdoor-panels",
  "decorative-panels", "accessories", "flooring",
]);
const patterns = new Set<CanonicalCatalogGroup>([
  "woodgrain",
  "solid",
  "stone-material",
  "textile-leather-rattan",
  "effect",
]);
const legacyPatterns: Record<string, CanonicalCatalogGroup> = {
  "van-go": "woodgrain",
  "don-sac": "solid",
  "van-da": "stone-material",
  "van-vai": "textile-leather-rattan",
};

export function parseCatalogUrlState(
  parameters: URLSearchParams,
): CatalogUrlState {
  const supplier = parameters.get("supplier") as SupplierId | null;
  const rawType = parameters.get("type");
  const rawGroup = parameters.get("group") ?? parameters.get("category") ?? "";
  const rawPattern = parameters.get("pattern") ?? "";
  const legacyPattern = legacyPatterns[rawGroup];

  return {
    query: parameters.get("query") ?? parameters.get("q") ?? "",
    type: rawType === "melamine" || rawType === "supplier" ? rawType : "all",
    group: legacyPattern ? "" : groups.has(rawGroup) ? rawGroup : "",
    pattern: legacyPattern ?? (patterns.has(rawPattern as CanonicalCatalogGroup)
      ? rawPattern as CanonicalCatalogGroup
      : ""),
    supplierId: supplier && supplierIds.has(supplier) ? supplier : "",
  };
}

export function buildCatalogSearchParams(
  current: URLSearchParams,
  state: CatalogUrlState,
): URLSearchParams {
  const parameters = new URLSearchParams(current);
  for (const key of ["q", "category", "query", "type", "group", "pattern", "supplier"]) {
    parameters.delete(key);
  }
  if (state.query.trim()) parameters.set("query", state.query);
  if (state.type !== "all") parameters.set("type", state.type);
  if (state.group) parameters.set("group", state.group);
  if (state.pattern) parameters.set("pattern", state.pattern);
  if (state.supplierId) parameters.set("supplier", state.supplierId);
  return parameters;
}

export function isCatalogFilterStateActive(state: CatalogUrlState): boolean {
  return Boolean(
    state.query.trim() ||
    state.type !== "all" ||
    state.group ||
    state.pattern ||
    state.supplierId,
  );
}

export function parseCatalogCollectionUrlState(
  parameters: URLSearchParams,
  allowedGroups: readonly string[],
): CatalogCollectionUrlState {
  const rawGroup = parameters.get("group") ?? parameters.get("category") ?? "";
  return {
    query: parameters.get("query") ?? parameters.get("q") ?? "",
    group: allowedGroups.includes(rawGroup) ? rawGroup : "",
  };
}

export function buildCatalogCollectionSearchParams(
  current: URLSearchParams,
  state: CatalogCollectionUrlState,
): URLSearchParams {
  const parameters = new URLSearchParams(current);
  for (const key of ["q", "category", "query", "group"]) {
    parameters.delete(key);
  }
  if (state.query.trim()) parameters.set("query", state.query);
  if (state.group) parameters.set("group", state.group);
  return parameters;
}

export function catalogRobotsContent(
  active: boolean,
): "noindex, follow" | null {
  return active ? "noindex, follow" : null;
}
