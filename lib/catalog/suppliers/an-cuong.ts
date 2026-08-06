import { isAnCuongCuratedCategory } from "../an-cuong-categories";
import { supplierRegistry } from "../core/registry";
import type { SupplierCatalogAdapter } from "../core/types";
import { getMaterialTaxonomyOptions, getSupplierSearchIndex } from "./search-index";

const definition = supplierRegistry.get("an-cuong");
if (!definition) throw new Error("An Cuong supplier definition is missing");

const entries = getSupplierSearchIndex().records.filter((record) => record.supplierId === "an-cuong");

export const anCuongAdapter: SupplierCatalogAdapter = {
  definition,
  getSearchEntries() {
    return entries;
  },
  getRouteClaims() {
    return [
      {
        supplierId: definition.id,
        path: definition.cataloguePath,
        kind: "catalogue" as const,
        indexable: false,
      },
      ...getMaterialTaxonomyOptions(entries)
        .filter((item) => isAnCuongCuratedCategory(item.slug))
        .map((item) => ({
          supplierId: definition.id,
          path: `${definition.cataloguePath}${item.slug}/`,
          kind: "category" as const,
          indexable: item.count > 0,
        })),
    ];
  },
  getSitemapEntries() {
    return this.getRouteClaims().map(({ supplierId, path, indexable }) => ({
      supplierId,
      path,
      indexable,
      changeFrequency: "monthly",
      priority: path === definition.cataloguePath ? 0.6 : 0.65,
    }));
  },
};
