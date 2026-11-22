import type { ArticleFrontmatter, ProductFrontmatter, ServicePageFrontmatter } from "@/lib/content-schema";
import type { ContentEntry } from "@/lib/content";

export type EditorialRelatedItem = { href: string; label: string; kind: "Bài viết" | "Vật liệu" | "Dịch vụ" };
type RelatedSources = {
  articles: ContentEntry<ArticleFrontmatter>[];
  products: ContentEntry<ProductFrontmatter>[];
  servicePages: ContentEntry<ServicePageFrontmatter>[];
};

export function resolveArticleRelatedItems(article: Pick<ArticleFrontmatter, "slug" | "relatedArticles" | "relatedProducts">, sources: RelatedSources): EditorialRelatedItem[] {
  const articles = new Map(sources.articles.map((entry) => [entry.slug, entry]));
  const products = new Map(sources.products.map((entry) => [entry.slug, entry]));
  const servicePages = new Map(sources.servicePages.map((entry) => [entry.slug, entry]));
  const items: EditorialRelatedItem[] = [];
  const seen = new Set<string>([article.slug]);

  for (const slug of article.relatedArticles) {
    const target = articles.get(slug);
    if (!target || seen.has(slug)) continue;
    seen.add(slug);
    items.push({ href: `/bai-viet/${slug}`, label: target.title, kind: "Bài viết" });
  }
  for (const slug of article.relatedProducts) {
    if (seen.has(slug)) continue;
    const product = products.get(slug);
    const service = servicePages.get(slug);
    const target = product ?? service;
    if (!target) continue;
    seen.add(slug);
    items.push({ href: `/${slug}`, label: target.title, kind: product ? "Vật liệu" : "Dịch vụ" });
  }
  return items.slice(0, 3);
}
