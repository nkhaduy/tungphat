import { supplierRegistry } from "../core/registry";
import type { SupplierCatalogAdapter } from "../core/types";
import { getSupplierSearchIndex } from "./search-index";

const definition = supplierRegistry.get("an-cuong");
if (!definition) throw new Error("An Cuong supplier definition is missing");

const entries = getSupplierSearchIndex().allRecords.filter((record) => record.supplierId === "an-cuong");
const colorCodeEntries = entries.filter((record) => record.recordType === "color-code");

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
        indexable: true,
      },
      ...[...new Set(colorCodeEntries.map((entry) => entry.category).filter(Boolean))].map((material) => ({
          supplierId: definition.id,
          path: `${definition.cataloguePath}${material}/`,
          kind: "category" as const,
          indexable: true,
        })),
      ...colorCodeEntries.map((entry) => ({
        supplierId: definition.id,
        path: entry.canonicalRoute,
        kind: "detail" as const,
        indexable: Boolean(entry.indexable),
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
