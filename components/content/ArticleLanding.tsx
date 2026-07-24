import Image from "next/image";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { JsonLd } from "@/components/JsonLd";
import { ContentEngagementTracker } from "@/components/analytics/ContentEngagementTracker";
import { FaqList } from "@/components/content/FaqList";
import { MarkdownContent } from "@/components/content/MarkdownContent";
import type { ContentEntry } from "@/lib/content";
import type { ArticleFrontmatter } from "@/lib/content-schema";
import { absoluteMediaUrl, mediaUrl } from "@/lib/media";
import { SITE_URL, absolutePageUrl, breadcrumbSchema, schemaPageId } from "@/lib/seo";

export function ArticleLanding({ article }: { article: ContentEntry<ArticleFrontmatter> }) {
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt,
    image: absoluteMediaUrl(article.featuredImage, SITE_URL),
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    author: { "@type": "Organization", name: article.author, url: absolutePageUrl("/") },
    publisher: { "@id": schemaPageId("/", "organization") },
    mainEntityOfPage: absolutePageUrl(`/bai-viet/${article.slug}`),
  };

  return (
    <>
      <JsonLd data={[breadcrumbSchema([{ name: "Trang chủ", path: "/" }, { name: "Bài viết", path: "/bai-viet" }, { name: article.title, path: `/bai-viet/${article.slug}` }]), articleSchema]} />
      <Header appearance="dark" />
      <main className="bg-white pt-[72px]">
        <ContentEngagementTracker contentType="article" contentId={article.slug} contentTitle={article.title} contentCategory={article.category} />
        <article data-analytics-content>
          <header className="bg-forest-950 py-14 text-white">
            <div className="container-shell">
              <nav aria-label="Breadcrumb" className="text-sm text-white/70"><Link href="/bai-viet" className="min-h-11 content-center">Bài viết</Link> / <span aria-current="page">{article.category}</span></nav>
              <h1 className="mt-6 max-w-4xl text-balance text-4xl font-extrabold leading-tight sm:text-5xl">{article.title}</h1>
              <p className="mt-5 max-w-3xl leading-8 text-white/80">{article.excerpt}</p>
              <p className="mt-5 text-sm text-white/60">Cập nhật {article.updatedAt} · {article.author}</p>
            </div>
          </header>
          <div className="container-shell py-12 lg:py-16">
            <div className="relative mb-12 aspect-[16/8] overflow-hidden"><Image src={mediaUrl(article.featuredImage)} alt={article.featuredImageAlt} fill priority sizes="100vw" className="object-cover" /></div>
            <div className="mx-auto max-w-[72ch]"><MarkdownContent className="text-[1rem] leading-7 sm:text-[1.0625rem] sm:leading-8 prose-p:my-0 prose-p:mb-6 prose-headings:font-extrabold prose-h2:mb-4 prose-h2:mt-10 prose-h2:text-2xl prose-h2:leading-tight sm:prose-h2:text-[1.75rem] prose-h3:mb-3 prose-h3:mt-8 prose-h3:text-xl prose-h3:leading-snug prose-li:my-2">{article.body}</MarkdownContent></div>
          </div>
        </article>
        <FaqList items={article.faq} />
      </main>
      <Footer />
    </>
  );
}
