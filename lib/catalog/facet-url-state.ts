import type { CatalogueFacetOptions, CatalogueFacetState } from "@/lib/catalog/facets";
import type { SupplierId } from "@/lib/catalog/core/types";

export type CatalogueSort = "relevance" | "code" | "name";
export type CatalogueUrlState = CatalogueFacetState & { query: string; sort: CatalogueSort };
const keys = ["query", "q", "supplier", "material", "pattern", "surface", "sort", "type", "group", "category"] as const;
type AllowedUrlFacets = Pick<CatalogueFacetOptions, "supplier" | "material" | "pattern" | "surfaceEffect">;

export function parseCatalogueUrlState(params: URLSearchParams, allowed: AllowedUrlFacets): CatalogueUrlState {
  const validSuppliers = new Set(allowed.supplier.map(({ value }) => value));
  const validMaterials = new Set(allowed.material.map(({ value }) => value));
  const validPatterns = new Set(allowed.pattern.map(({ value }) => value));
  const validSurfaceEffects = new Set(allowed.surfaceEffect.map(({ value }) => value));
  const supplier = params.getAll("supplier").filter((value): value is SupplierId => validSuppliers.has(value));
  const requestedPattern = params.getAll("pattern").filter((value) => validPatterns.has(value));
  const requestedMaterial = params.getAll("material").filter((value) => validMaterials.has(value));
  const requestedSurface = params.getAll("surface").filter((value) => validSurfaceEffects.has(value));
  const legacyGroup = params.get("group") ?? params.get("category") ?? "";
  const legacyPattern = ({
    "van-go": "woodgrain",
    "don-sac": "solid",
    "van-da": "stone-material",
    "van-vai": "textile-leather-rattan",
  } as const)[legacyGroup] ?? (validPatterns.has(legacyGroup) ? legacyGroup : undefined);
  const mappedGroupMaterials = legacyGroup === "pvc-ppet"
    ? ["pvc", "ppet"].filter((value) => validMaterials.has(value))
    : validMaterials.has(legacyGroup) ? [legacyGroup] : [];
  const legacyMaterials = mappedGroupMaterials.length
    ? mappedGroupMaterials
    : params.get("type") === "melamine" && validMaterials.has("melamine") ? ["melamine"] : [];
  const requestedSort = params.get("sort");
  return {
    query: params.get("query") ?? params.get("q") ?? "",
    sort: requestedSort === "code" || requestedSort === "name" ? requestedSort : "relevance",
    supplier: [...new Set(supplier)],
    material: [...new Set(requestedMaterial.length ? requestedMaterial : legacyMaterials)],
    pattern: [...new Set(requestedPattern.length ? requestedPattern : legacyPattern && validPatterns.has(legacyPattern) ? [legacyPattern] : [])] as CatalogueFacetState["pattern"],
    surfaceEffect: [...new Set(requestedSurface)],
  };
}

export function buildCatalogueUrlParams(current: URLSearchParams, state: CatalogueUrlState): URLSearchParams {
  const params = new URLSearchParams(current);
  keys.forEach((key) => params.delete(key));
  if (state.query.trim()) params.set("query", state.query.trim());
  if (state.sort !== "relevance") params.set("sort", state.sort);
  const values = [
    ["supplier", state.supplier], ["material", state.material],
    ["pattern", state.pattern], ["surface", state.surfaceEffect],
  ] as const;
  for (const [key, list] of values) {
    for (const value of [...new Set(list ?? [])].sort((a, b) => a.localeCompare(b, "vi"))) params.append(key, value);
  }
  return params;
}

export function hasCatalogueUrlFilters(state: CatalogueUrlState): boolean {
  return Boolean(state.query.trim() || state.supplier?.length || state.material?.length || state.pattern?.length || state.surfaceEffect?.length || state.sort !== "relevance");
}

export function hasCatalogueUrlStateParams(params: URLSearchParams): boolean {
  return keys.some((key) => params.has(key));
}
