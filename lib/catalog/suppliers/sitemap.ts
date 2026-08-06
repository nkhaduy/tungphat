import { composeSupplierSitemap } from "../core/sitemap";
import type { CatalogSitemapEntry } from "../core/types";
import { anCuongAdapter } from "./an-cuong";
import { baThanhAdapter } from "./ba-thanh";
import { thanhThuyAdapter } from "./thanh-thuy";

const supplierAdapters = [thanhThuyAdapter, baThanhAdapter, anCuongAdapter];

export function getSupplierSitemapEntries(
  fallbackLastModified: string,
): CatalogSitemapEntry[] {
  return composeSupplierSitemap(
    supplierAdapters.flatMap((adapter) =>
      adapter.getSitemapEntries().map((entry) => ({
        ...entry,
        lastModified: entry.lastModified ?? fallbackLastModified,
      })),
    ),
  );
}
