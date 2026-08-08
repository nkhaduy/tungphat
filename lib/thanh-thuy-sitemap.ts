import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";
import {
  isThanhThuyIndexable,
  thanhThuyPath,
  type ThanhThuyCatalog,
} from "@/lib/thanh-thuy";

export function buildThanhThuySitemapEntries(
  catalog: ThanhThuyCatalog,
  fallbackLastModified: string,
): MetadataRoute.Sitemap {
  const lastModified = catalog.importedAt || fallbackLastModified;
  const categoryEntries: MetadataRoute.Sitemap = catalog.categories
    .filter((category) => category.productCount > 0 && !category.parentSlug)
    .map((category) => ({
      url: absoluteUrl(thanhThuyPath(category.slug)),
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    }));
  const productEntries: MetadataRoute.Sitemap = catalog.products
    .filter(isThanhThuyIndexable)
    .map((product) => ({
      url: absoluteUrl(thanhThuyPath(product.categorySlug, product.slug)),
      lastModified,
      changeFrequency: "monthly",
      priority: 0.7,
    }));

  return [
    {
      url: absoluteUrl(thanhThuyPath()),
      lastModified,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...categoryEntries,
    ...productEntries,
  ];
}
