import { supplierRegistry } from "../core/registry";
import type { SupplierCatalogAdapter } from "../core/types";
import { getSupplierSearchIndex } from "./search-index";

const definition = supplierRegistry.get("thanh-thuy");
if (!definition) throw new Error("Thanh Thuy supplier definition is missing");

export const thanhThuyAdapter: SupplierCatalogAdapter = {
  definition,
  getSearchEntries() {
    return getSupplierSearchIndex().allRecords.filter((record) => record.supplierId === definition.id);
  },
  getRouteClaims() {
    const entries = this.getSearchEntries();
    const colorCodeEntries = entries.filter((entry) => entry.recordType === "color-code");
    const materials = [...new Set(colorCodeEntries.map((entry) => entry.category).filter(Boolean))] as string[];
    return [
      { supplierId: definition.id, path: definition.brandPath, kind: "brand" as const, indexable: true },
      { supplierId: definition.id, path: definition.cataloguePath, kind: "catalogue" as const, indexable: true },
      ...materials.map((material) => ({
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
      changeFrequency: path === definition.brandPath ? "weekly" : "monthly",
      priority: path === definition.brandPath ? 0.9 : 0.7,
    }));
  },
};
