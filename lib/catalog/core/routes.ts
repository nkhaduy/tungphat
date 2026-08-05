import type { CatalogRouteClaim, SupplierId } from "./types";

export function canonicalCatalogPath(value: string): string {
  const url = new URL(value, "https://catalogue.local");
  const pathname = url.pathname.replace(/\/{2,}/g, "/");
  return pathname === "/" ? pathname : `${pathname.replace(/\/+$/, "")}/`;
}

export function createRouteOwnershipIndex(claims: CatalogRouteClaim[]) {
  const owners = new Map<string, SupplierId>();
  for (const claim of claims) {
    const path = canonicalCatalogPath(claim.path);
    const existing = owners.get(path);
    if (existing && existing !== claim.supplierId) {
      throw new Error(`Route collision at ${path}: ${existing} and ${claim.supplierId}`);
    }
    owners.set(path, claim.supplierId);
  }
  return owners;
}

export function getRouteOwner(
  index: ReadonlyMap<string, SupplierId>,
  path: string,
): SupplierId | undefined {
  return index.get(canonicalCatalogPath(path));
}

