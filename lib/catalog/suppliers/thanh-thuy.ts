import {
  getThanhThuyCatalog,
  getThanhThuyTopCategories,
  isThanhThuyIndexable,
  thanhThuyPath,
} from "@/lib/thanh-thuy";
import { supplierRegistry } from "../core/registry";
import type { SupplierCatalogAdapter } from "../core/types";

const definition = supplierRegistry.get("thanh-thuy");
if (!definition) throw new Error("Thanh Thuy supplier definition is missing");

export const thanhThuyAdapter: SupplierCatalogAdapter = {
  definition,
  getSearchEntries() {
    return getThanhThuyCatalog().products.map((product) => ({
      supplierId: definition.id,
      supplierName: definition.displayName,
      kind: definition.recordKind,
      code: product.code,
      name: product.name,
      thumbnail: product.image,
      canonicalRoute: thanhThuyPath(product.categorySlug, product.slug),
      category: product.categoryName,
      series: product.seriesName,
    }));
  },
  getRouteClaims() {
    const catalog = getThanhThuyCatalog();
    return [
      { supplierId: definition.id, path: definition.brandPath, kind: "brand" as const, indexable: true },
      ...getThanhThuyTopCategories().map((category) => ({
        supplierId: definition.id,
        path: thanhThuyPath(category.slug),
        kind: "category" as const,
        indexable: category.productCount > 0,
      })),
      ...catalog.products.map((product) => ({
        supplierId: definition.id,
        path: thanhThuyPath(product.categorySlug, product.slug),
        kind: "detail" as const,
        indexable: isThanhThuyIndexable(product),
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

