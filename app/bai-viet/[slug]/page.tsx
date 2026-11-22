import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleLanding } from "@/components/content/ArticleLanding";
import { getArticle, getArticles, getProducts, getServicePages } from "@/lib/content";
import { resolveArticleRelatedItems, type EditorialRelatedItem } from "@/lib/editorial/related-content";
import { createContentMetadata } from "@/lib/content-metadata";

type Props = { params: Promise<{ slug: string }> };
export const dynamicParams = false;
export async function generateStaticParams() {
  const params = (await getArticles({ includeDrafts: true })).map((article) => ({ slug: article.slug }));
  return params.length ? params : [{ slug: "__empty-collection" }];
}
export async function generateMetadata({ params }: Props): Promise<Metadata> { const { slug } = await params; const article = await getArticle(slug); return article ? createContentMetadata(article, `/bai-viet/${slug}`) : {}; }

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) notFound();
  let relatedItems: EditorialRelatedItem[] = [];
  if (article.relatedArticles.length || article.relatedProducts.length) {
    const [articles, products, servicePages] = await Promise.all([
      article.relatedArticles.length ? getArticles() : Promise.resolve([]),
      article.relatedProducts.length ? getProducts() : Promise.resolve([]),
      article.relatedProducts.length ? getServicePages() : Promise.resolve([]),
    ]);
    relatedItems = resolveArticleRelatedItems(article, { articles, products, servicePages });
  }
  return <ArticleLanding article={article} relatedItems={relatedItems} />;
}
