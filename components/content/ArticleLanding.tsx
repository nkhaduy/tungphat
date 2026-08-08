import Link from "next/link";
import { ArrowRight, CalendarDays, UserRound } from "lucide-react";
import { JsonLd } from "@/components/JsonLd";
import { ContentEngagementTracker } from "@/components/analytics/ContentEngagementTracker";
import { FaqList } from "@/components/content/FaqList";
import { MarkdownContent } from "@/components/content/MarkdownContent";
import { SiteShell } from "@/components/site/SiteShell";
import { ContactCTA } from "@/components/ui/ContactCTA";
import { PageHero } from "@/components/ui/PageHero";
import type { ContentEntry } from "@/lib/content";
import type { ArticleFrontmatter } from "@/lib/content-schema";
import { absoluteMediaUrl, mediaUrl } from "@/lib/media";
import { SITE_URL, absolutePageUrl, breadcrumbSchema, schemaPageId, webPageSchema } from "@/lib/seo";

function readableSlug(slug: string) {
  const label = slug.replace(/-/g, " ");
  return label.charAt(0).toLocaleUpperCase("vi") + label.slice(1);
}

export function ArticleLanding({ article }: { article: ContentEntry<ArticleFrontmatter> }) {
  const articlePath = `/bai-viet/${article.slug}`;
  const articleUrl = absolutePageUrl(articlePath);
  const articleId = schemaPageId(articlePath, "article");
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": articleId,
    headline: article.title,
    description: article.excerpt,
    image: absoluteMediaUrl(article.featuredImage, SITE_URL),
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    author: { "@type": "Organization", name: article.author, url: absolutePageUrl("/") },
    publisher: { "@id": schemaPageId("/", "organization") },
    mainEntityOfPage: articleUrl,
  };
  const pageSchema = webPageSchema({ path: articlePath, name: article.title, description: article.excerpt, primaryEntityId: articleId, datePublished: article.publishedAt, dateModified: article.updatedAt });
  const relatedLinks = [
    ...article.relatedProducts.map((slug) => ({ href: `/${slug}`, label: readableSlug(slug), type: "Vật liệu" })),
    ...article.relatedArticles.map((slug) => ({ href: `/bai-viet/${slug}`, label: readableSlug(slug), type: "Bài viết" })),
  ];

  return (
    <>
      <JsonLd data={[pageSchema, breadcrumbSchema([{ name: "Trang chủ", path: "/" }, { name: "Bài viết", path: "/bai-viet" }, { name: article.title, path: articlePath }]), articleSchema]} />
      <SiteShell>
        <ContentEngagementTracker contentType="article" contentId={article.slug} contentTitle={article.title} contentCategory={article.category} />
        <article data-analytics-content>
          <PageHero
            breadcrumbs={[{ label: "Trang chủ", href: "/" }, { label: "Bài viết", href: "/bai-viet" }, { label: article.title }]}
            eyebrow={article.category}
            title={article.title}
            description={article.excerpt}
            image={{ src: mediaUrl(article.featuredImage), alt: article.featuredImageAlt, priority: true }}
          />

          <section className="section-space bg-white">
            <div className="container-shell grid min-w-0 gap-10 lg:grid-cols-[minmax(0,72ch)_260px] lg:justify-center lg:gap-14">
              <div className="min-w-0">
                <div className="mb-9 flex flex-wrap gap-x-6 gap-y-3 border-b border-forest-900/10 pb-6 text-sm text-slate-600">
                  <span className="inline-flex items-center gap-2"><CalendarDays size={17} className="text-wood-600" aria-hidden="true" />Cập nhật {article.updatedAt}</span>
                  <span className="inline-flex items-center gap-2"><UserRound size={17} className="text-wood-600" aria-hidden="true" />{article.author}</span>
                </div>
                <div data-answer-block>
                  <MarkdownContent className="text-[1rem] leading-7 sm:text-[1.0625rem] sm:leading-8 prose-p:my-0 prose-p:mb-6 prose-headings:font-extrabold prose-h2:mb-4 prose-h2:mt-10 prose-h2:text-2xl prose-h2:leading-tight sm:prose-h2:text-[1.75rem] prose-h3:mb-3 prose-h3:mt-8 prose-h3:text-xl prose-h3:leading-snug prose-li:my-2">{article.body}</MarkdownContent>
                </div>
              </div>

              <aside className="h-fit border border-forest-900/10 bg-[#f7f8f5] p-6 lg:sticky lg:top-32">
                <p className="eyebrow">Đọc tiếp</p>
                <h2 className="mt-3 text-lg font-extrabold text-forest-950">Thông tin liên quan</h2>
                {relatedLinks.length ? (
                  <nav aria-label="Nội dung liên quan" className="mt-4 grid gap-2">
                    {relatedLinks.map((item) => (
                      <Link key={`${item.type}-${item.href}`} href={item.href} className="group flex min-h-12 items-center justify-between gap-3 border-t border-forest-900/10 py-3 text-sm font-bold text-forest-950 hover:text-wood-600">
                        <span><span className="block text-[11px] uppercase tracking-wider text-slate-500">{item.type}</span>{item.label}</span>
                        <ArrowRight size={16} className="shrink-0" aria-hidden="true" />
                      </Link>
                    ))}
                  </nav>
                ) : (
                  <p className="mt-4 text-sm leading-7 text-slate-700">Xem danh mục vật liệu hoặc thư viện kiến thức để tham khảo thêm trước khi gửi yêu cầu.</p>
                )}
                <Link href="/san-pham" className="pressable mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 bg-forest-900 px-5 text-sm font-extrabold text-white hover:bg-forest-800">Xem danh mục vật liệu <ArrowRight size={16} aria-hidden="true" /></Link>
              </aside>
            </div>
          </section>
        </article>
        <FaqList items={article.faq} />
        <ContactCTA title="Cần kiểm tra vật liệu hoặc yêu cầu gia công?" description="Gửi loại vật liệu, quy cách, số lượng và hình ảnh hoặc file liên quan để Tùng Phát đối chiếu theo dữ liệu thực tế." />
      </SiteShell>
    </>
  );
}
