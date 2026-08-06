import catalogue from "@/data/imports/ancuong/export/catalogue.json";
import { supplierRegistry } from "../core/registry";
import type { SupplierCatalogAdapter } from "../core/types";

type AnCuongExportRecord = {
  sourceId: string;
  name: string;
  productCode?: string;
  normalizedProductCode?: string;
  category: string;
  productLine?: string;
};

const definition = supplierRegistry.get("an-cuong");
if (!definition) throw new Error("An Cuong supplier definition is missing");

const records = (catalogue as { records: AnCuongExportRecord[] }).records;

export const anCuongAdapter: SupplierCatalogAdapter = {
  definition,
  getSearchEntries() {
    return records.map((record) => ({
      supplierId: definition.id,
      supplierName: definition.displayName,
      kind: definition.recordKind,
      code: record.normalizedProductCode ?? record.productCode ?? record.sourceId,
      name: record.name,
      thumbnail: "/partners/an-cuong-logo.webp",
      canonicalRoute: definition.cataloguePath,
      category: record.category,
      series: record.productLine,
    }));
  },
  getRouteClaims() {
    return [
      {
        supplierId: definition.id,
        path: definition.cataloguePath,
        kind: "catalogue",
        indexable: false,
      },
    ];
  },
  getSitemapEntries() {
    return this.getRouteClaims().map(({ supplierId, path, indexable }) => ({
      supplierId,
      path,
      indexable,
      changeFrequency: "monthly",
      priority: 0.6,
    }));
  },
};
