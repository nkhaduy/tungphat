import { searchSupplierCatalog } from "@/lib/catalog/core/search";
import type { CatalogSearchEntry } from "@/lib/catalog/core/types";
import { getSupplierSearchIndex } from "@/lib/catalog/suppliers/search-index";

export const CATALOGUE_PAGE_SIZE = 48;

export function getCatalogueListingEntries(): CatalogSearchEntry[] {
  const codes = getSupplierSearchIndex().records.filter((entry) => entry.kind === "color-code");
  return searchSupplierCatalog(codes, "");
}

export function splitCataloguePages(
  entries: CatalogSearchEntry[],
  pageSize = CATALOGUE_PAGE_SIZE,
): CatalogSearchEntry[][] {
  if (!Number.isInteger(pageSize) || pageSize < 1) throw new Error("pageSize must be a positive integer");
  const pages: CatalogSearchEntry[][] = [];
  for (let offset = 0; offset < entries.length; offset += pageSize) {
    pages.push(entries.slice(offset, offset + pageSize));
  }
  return pages;
}
