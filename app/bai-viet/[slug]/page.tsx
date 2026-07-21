import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleLanding } from "@/components/content/ArticleLanding";
import { getArticle, getArticles } from "@/lib/content";
import { createContentMetadata } from "@/lib/content-metadata";

type Props = { params: Promise<{ slug: string }> };
export const dynamicParams = false;
export function generateStaticParams() {
  const params = getArticles().map((article) => ({ slug: article.slug }));
  return params.length ? params : [{ slug: "__empty-collection" }];
}
export async function generateMetadata({ params }: Props): Promise<Metadata> { const { slug } = await params; const article = getArticle(slug); return article ? createContentMetadata(article, `/bai-viet/${slug}`) : {}; }

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();
  return <ArticleLanding article={article} />;
}
