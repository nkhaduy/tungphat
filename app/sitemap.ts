import type { MetadataRoute } from "next";
import {
  getProducts,
  getPublishedArticles,
  getPublishedProjects,
  getServicePages,
} from "@/lib/content";
import { getListingIndexability } from "@/lib/listing-indexability";
import { absoluteUrl } from "@/lib/seo";
import { isReservedRootSlug } from "@/lib/reserved-slugs";
import staticPages from "@/content/settings/static-pages.json";
import { getSupplierSitemapEntries } from "@/lib/catalog/suppliers/sitemap";
import { getThanhThuyCatalog } from "@/lib/thanh-thuy";
import { buildThanhThuySitemapEntries } from "@/lib/thanh-thuy-sitemap";
import { getMaterialDataset } from "@/lib/materials";

export const dynamic = "force-static";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const materialDataset = getMaterialDataset();
  const articles = await getPublishedArticles();
  const projects = await getPublishedProjects();
  const staticRouteRules = [
    { route: "/", include: true },
    { route: "/san-pham/", include: true },
    { route: "/tham-chieu-vat-lieu/", include: true },
    { route: "/catalogue/", include: true },
    { route: "/gia-cong-cnc/", include: true },
    { route: "/bao-gia/", include: true },
    {
      route: "/du-an/",
      include: getListingIndexability(projects.length).includeInSitemap,
    },
    {
      route: "/bai-viet/",
      include: getListingIndexability(articles.length).includeInSitemap,
    },
    { route: "/lien-he/", include: true },
    { route: "/chinh-sach-bao-mat/", include: true },
    { route: "/dieu-khoan-su-dung/", include: true },
  ] as const;
  const staticEntries: MetadataRoute.Sitemap = staticRouteRules
    .filter(({ include }) => include)
    .map(({ route }) => ({
      url: absoluteUrl(route),
      lastModified:
        route === "/tham-chieu-vat-lieu/"
          ? materialDataset.lastVerified
          : staticPages.updatedAt,
      changeFrequency: route === "/" ? "weekly" : "monthly",
      priority: route === "/" ? 1 : 0.7,
    }));
  const rootContent = (slug: string) => !isReservedRootSlug(slug);
  const products: MetadataRoute.Sitemap = (await getProducts())
    .filter((entry) => rootContent(entry.slug))
    .map((entry) => ({
      url: absoluteUrl(`/${entry.slug}/`),
      lastModified: entry.updatedAt,
      changeFrequency: "weekly",
      priority: 0.9,
    }));
  const services: MetadataRoute.Sitemap = (await getServicePages())
    .filter((entry) => rootContent(entry.slug))
    .map((entry) => ({
      url: absoluteUrl(`/${entry.slug}/`),
      lastModified: entry.updatedAt,
      changeFrequency: "weekly",
      priority: 0.9,
    }));
  const articleEntries: MetadataRoute.Sitemap = articles.map((entry) => ({
    url: absoluteUrl(`/bai-viet/${entry.slug}/`),
    lastModified: entry.updatedAt,
    changeFrequency: "monthly",
    priority: 0.7,
  }));
  const projectEntries: MetadataRoute.Sitemap = projects.map((entry) => ({
    url: absoluteUrl(`/du-an/${entry.slug}/`),
    lastModified: entry.updatedAt,
    changeFrequency: "monthly",
    priority: 0.7,
  }));
  const supplierEntries: MetadataRoute.Sitemap = getSupplierSitemapEntries(
    staticPages.updatedAt,
  ).map((entry) => ({
    url: absoluteUrl(entry.path),
    lastModified: entry.lastModified,
    changeFrequency: entry.changeFrequency,
    priority: entry.priority,
  }));
  const supplierUrls = new Set(supplierEntries.map((entry) => entry.url));
  const legacyThanhThuyEntries = buildThanhThuySitemapEntries(
    getThanhThuyCatalog(),
    staticPages.updatedAt,
  ).filter((entry) => !supplierUrls.has(entry.url));
  return [
    ...staticEntries,
    ...products,
    ...services,
    ...articleEntries,
    ...projectEntries,
    ...supplierEntries,
    ...legacyThanhThuyEntries,
  ];
}
