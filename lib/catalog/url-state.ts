import type { CatalogSearchIntent } from "@/lib/catalog/core/search";
import type { SupplierId } from "@/lib/catalog/core/types";

export type CatalogUrlState = {
  query: string;
  type: CatalogSearchIntent;
  group: string;
  supplierId: SupplierId | "";
};

export type CatalogCollectionUrlState = {
  query: string;
  group: string;
};

const supplierIds = new Set<SupplierId>(["thanh-thuy", "ba-thanh", "an-cuong"]);
const groups = new Set([
  "van-go", "don-sac", "van-da", "van-vai",
  "melamine", "laminate", "acrylic", "pvc-ppet", "veneer", "mdf-hdf",
  "mfc-okal", "joined-wood", "edge-banding", "outdoor-panels",
  "decorative-panels", "accessories", "flooring",
]);

export function parseCatalogUrlState(
  parameters: URLSearchParams,
): CatalogUrlState {
  const supplier = parameters.get("supplier") as SupplierId | null;
  const rawType = parameters.get("type");
  const rawGroup = parameters.get("group") ?? parameters.get("category") ?? "";

  return {
    query: parameters.get("query") ?? parameters.get("q") ?? "",
    type: rawType === "melamine" || rawType === "supplier" ? rawType : "all",
    group: groups.has(rawGroup) ? rawGroup : "",
    supplierId: supplier && supplierIds.has(supplier) ? supplier : "",
  };
}

export function buildCatalogSearchParams(
  current: URLSearchParams,
  state: CatalogUrlState,
): URLSearchParams {
  const parameters = new URLSearchParams(current);
  for (const key of ["q", "category", "query", "type", "group", "supplier"]) {
    parameters.delete(key);
  }
  if (state.query.trim()) parameters.set("query", state.query);
  if (state.type !== "all") parameters.set("type", state.type);
  if (state.group) parameters.set("group", state.group);
  if (state.supplierId) parameters.set("supplier", state.supplierId);
  return parameters;
}

export function isCatalogFilterStateActive(state: CatalogUrlState): boolean {
  return Boolean(
    state.query.trim() ||
    state.type !== "all" ||
    state.group ||
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
