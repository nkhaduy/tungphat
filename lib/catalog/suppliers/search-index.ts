import artifact from "@/data/catalogs/supplier-search-index.json";
import { materialTaxonomyOptions } from "../material-taxonomy";
import type { CatalogSearchEntry, SupplierId } from "../core/types";

type SearchIndexRecord = CatalogSearchEntry & { id: string; recordType: "sku" | "family" | "document" };
type SupplierTotals = Record<SupplierId, { total: number; sku: number; family: number; document: number; retainedMelamineCodes?: number }>;

const index = artifact as unknown as { schemaVersion: 1; checksum: string; records: SearchIndexRecord[]; totals: SupplierTotals };

export function getSupplierSearchIndex() {
  return index;
}

export function getSupplierTotals(): SupplierTotals {
  return index.totals;
}

export function getMaterialTaxonomyOptions(entries: CatalogSearchEntry[] = index.records) {
  return materialTaxonomyOptions(entries);
}
