import type { CatalogSearchEntry } from "../core/types";
import { getSupplierSearchIndex } from "./search-index";

export function getSupplierSearchEntries(): CatalogSearchEntry[] {
  return getSupplierSearchIndex().records;
}
