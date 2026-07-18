import type { MetadataRoute } from "next";
import { getArticles, getProducts, getProjects, getServicePages } from "@/lib/content";
import { absoluteUrl } from "@/lib/seo";
import { isReservedRootSlug } from "@/lib/reserved-slugs";
import staticPages from "@/content/settings/static-pages.json";

export const dynamic = "force-static";

const staticRoutes = [
  "/", "/san-pham", "/gia-cong-cnc", "/du-an", "/bai-viet", "/lien-he",
  "/chinh-sach-bao-mat", "/dieu-khoan-su-dung"
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({ url: absoluteUrl(route), lastModified: staticPages.updatedAt, changeFrequency: route === "/" ? "weekly" : "monthly", priority: route === "/" ? 1 : 0.7 }));
  const rootContent = (slug: string) => !isReservedRootSlug(slug);
  const products: MetadataRoute.Sitemap = getProducts().filter((entry) => rootContent(entry.slug)).map((entry) => ({ url: absoluteUrl(`/${entry.slug}`), lastModified: entry.updatedAt, changeFrequency: "weekly", priority: 0.9 }));
  const services: MetadataRoute.Sitemap = getServicePages().filter((entry) => rootContent(entry.slug)).map((entry) => ({ url: absoluteUrl(`/${entry.slug}`), lastModified: entry.updatedAt, changeFrequency: "weekly", priority: 0.9 }));
  const articles: MetadataRoute.Sitemap = getArticles().map((entry) => ({ url: absoluteUrl(`/bai-viet/${entry.slug}`), lastModified: entry.updatedAt, changeFrequency: "monthly", priority: 0.7 }));
  const projects: MetadataRoute.Sitemap = getProjects().map((entry) => ({ url: absoluteUrl(`/du-an/${entry.slug}`), lastModified: entry.updatedAt, changeFrequency: "monthly", priority: 0.7 }));
  return [...staticEntries, ...products, ...services, ...articles, ...projects];
}
