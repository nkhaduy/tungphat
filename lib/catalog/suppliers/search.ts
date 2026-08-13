import type { CatalogSearchEntry } from "../core/types";
import { getSupplierSearchIndex, getAllSupplierSearchEntries } from "./search-index";

export function getSupplierSearchEntries(): CatalogSearchEntry[] {
  return getSupplierSearchIndex().records;
}

export function getAllSupplierSearchEntriesForCatalogue(): CatalogSearchEntry[] {
  return getAllSupplierSearchEntries();
}
