import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { JsonLd } from "@/components/JsonLd";
import { FaqList } from "@/components/content/FaqList";
import { MarkdownContent } from "@/components/content/MarkdownContent";
import { getArticle, getArticles } from "@/lib/content";
import { createContentMetadata } from "@/lib/content-metadata";
import { absoluteMediaUrl, mediaUrl } from "@/lib/media";
import { SITE_URL, breadcrumbSchema } from "@/lib/seo";

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
  const articleSchema = { "@context": "https://schema.org", "@type": "Article", headline: article.title, description: article.excerpt, image: absoluteMediaUrl(article.featuredImage, SITE_URL), datePublished: article.publishedAt, dateModified: article.updatedAt, author: { "@type": "Organization", name: article.author, url: SITE_URL }, publisher: { "@id": `${SITE_URL}/#organization` }, mainEntityOfPage: `${SITE_URL}/bai-viet/${article.slug}` };
  return <><JsonLd data={[breadcrumbSchema([{ name: "Trang chủ", path: "/" }, { name: "Bài viết", path: "/bai-viet" }, { name: article.title, path: `/bai-viet/${article.slug}` }]), articleSchema]} /><Header /><main className="bg-white pt-[72px]"><article><header className="bg-forest-950 py-14 text-white"><div className="container-shell"><nav aria-label="Breadcrumb" className="text-sm text-white/70"><Link href="/bai-viet" className="min-h-11 content-center">Bài viết</Link> / <span aria-current="page">{article.category}</span></nav><h1 className="mt-6 max-w-4xl text-balance text-4xl font-extrabold leading-tight sm:text-5xl">{article.title}</h1><p className="mt-5 max-w-3xl leading-8 text-white/80">{article.excerpt}</p><p className="mt-5 text-sm text-white/60">Cập nhật {article.updatedAt} · {article.author}</p></div></header><div className="container-shell py-12 lg:py-16"><div className="relative mb-12 aspect-[16/8] overflow-hidden"><Image src={mediaUrl(article.featuredImage)} alt={article.featuredImageAlt} fill priority sizes="100vw" className="object-cover" /></div><div className="mx-auto max-w-3xl"><MarkdownContent>{article.body}</MarkdownContent></div></div></article><FaqList items={article.faq} /></main><Footer /></>;
}
