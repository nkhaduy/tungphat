import {
  baThanhCategories,
  getBaThanhMerchandisingScore,
  getBaThanhCodes,
} from "@/lib/catalog/ba-thanh";
import { supplierRegistry } from "../core/registry";
import type { SupplierCatalogAdapter } from "../core/types";

const definition = supplierRegistry.get("ba-thanh");
if (!definition) throw new Error("Ba Thanh supplier definition is missing");

const codePath = (slug: string) => `${definition.cataloguePath}${slug}/`;

export const baThanhAdapter: SupplierCatalogAdapter = {
  definition,
  getSearchEntries() {
    return getBaThanhCodes().map((record) => ({
      supplierId: definition.id,
      supplierName: definition.displayName,
      kind: definition.recordKind,
      code: record.displayName,
      name: `Melamine Ba Thanh ${record.displayName}`,
      thumbnail: record.images[0]?.thumbnailSrc ?? record.images[0]?.src ?? "",
      canonicalRoute: codePath(record.slug),
      category: record.category,
      group: record.patternGroup,
      demandScore: getBaThanhMerchandisingScore(record),
    }));
  },
  getRouteClaims() {
    return [
      {
        supplierId: definition.id,
        path: definition.brandPath,
        kind: "brand" as const,
        indexable: true,
      },
      {
        supplierId: definition.id,
        path: definition.cataloguePath,
        kind: "catalogue" as const,
        indexable: true,
      },
      ...baThanhCategories.map((category) => ({
        supplierId: definition.id,
        path: codePath(category.slug),
        kind: "category" as const,
        indexable: category.count > 0,
      })),
      ...getBaThanhCodes().map((record) => ({
        supplierId: definition.id,
        path: codePath(record.slug),
        kind: "detail" as const,
        indexable: record.published && record.seoStatus === "READY_TO_INDEX",
      })),
    ];
  },
  getSitemapEntries() {
    return this.getRouteClaims().map(({ supplierId, path, indexable }) => ({
      supplierId,
      path,
      indexable,
      changeFrequency:
        path === definition.brandPath || path === definition.cataloguePath
          ? "weekly"
          : "monthly",
      priority:
        path === definition.brandPath || path === definition.cataloguePath
          ? 0.8
          : 0.65,
    }));
  },
};
