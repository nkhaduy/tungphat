import type { MetadataRoute } from "next";
import { getProducts, getPublishedArticles, getPublishedProjects, getServicePages } from "@/lib/content";
import { getListingIndexability } from "@/lib/listing-indexability";
import { absoluteUrl } from "@/lib/seo";
import { isReservedRootSlug } from "@/lib/reserved-slugs";
import staticPages from "@/content/settings/static-pages.json";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const articles = getPublishedArticles();
  const projects = getPublishedProjects();
  const staticRouteRules = [
    { route: "/", include: true },
    { route: "/san-pham/", include: true },
    { route: "/tham-chieu-vat-lieu/", include: true },
    { route: "/gia-cong-cnc/", include: true },
    { route: "/du-an/", include: getListingIndexability(projects.length).includeInSitemap },
    { route: "/bai-viet/", include: getListingIndexability(articles.length).includeInSitemap },
    { route: "/lien-he/", include: true },
    { route: "/chinh-sach-bao-mat/", include: true },
    { route: "/dieu-khoan-su-dung/", include: true },
  ] as const;
  const staticEntries: MetadataRoute.Sitemap = staticRouteRules
    .filter(({ include }) => include)
    .map(({ route }) => ({ url: absoluteUrl(route), lastModified: staticPages.updatedAt, changeFrequency: route === "/" ? "weekly" : "monthly", priority: route === "/" ? 1 : 0.7 }));
  const rootContent = (slug: string) => !isReservedRootSlug(slug);
  const products: MetadataRoute.Sitemap = getProducts().filter((entry) => rootContent(entry.slug)).map((entry) => ({ url: absoluteUrl(`/${entry.slug}/`), lastModified: entry.updatedAt, changeFrequency: "weekly", priority: 0.9 }));
  const services: MetadataRoute.Sitemap = getServicePages().filter((entry) => rootContent(entry.slug)).map((entry) => ({ url: absoluteUrl(`/${entry.slug}/`), lastModified: entry.updatedAt, changeFrequency: "weekly", priority: 0.9 }));
  const articleEntries: MetadataRoute.Sitemap = articles.map((entry) => ({ url: absoluteUrl(`/bai-viet/${entry.slug}/`), lastModified: entry.updatedAt, changeFrequency: "monthly", priority: 0.7 }));
  const projectEntries: MetadataRoute.Sitemap = projects.map((entry) => ({ url: absoluteUrl(`/du-an/${entry.slug}/`), lastModified: entry.updatedAt, changeFrequency: "monthly", priority: 0.7 }));
  return [...staticEntries, ...products, ...services, ...articleEntries, ...projectEntries];
}
