import Image from "next/image";
import { JsonLd } from "@/components/JsonLd";
import { ContentEngagementTracker } from "@/components/analytics/ContentEngagementTracker";
import { FaqList } from "@/components/content/FaqList";
import { MarkdownContent } from "@/components/content/MarkdownContent";
import { ArticleHeader } from "@/components/editorial/ArticleHeader";
import { ArticleRelatedContent } from "@/components/editorial/ArticleRelatedContent";
import type { EditorialRelatedItem } from "@/lib/editorial/related-content";
import { ArticleTableOfContents } from "@/components/editorial/ArticleTableOfContents";
import { SiteShell } from "@/components/site/SiteShell";
import { ContactCTA } from "@/components/ui/ContactCTA";
import { extractMarkdownHeadings } from "@/lib/editorial/headings";
import { resolveEditorialMedia } from "@/lib/editorial/media";
import type { ContentEntry } from "@/lib/content";
import type { ArticleFrontmatter } from "@/lib/content-schema";
import { absoluteMediaUrl } from "@/lib/media";
import { SITE_URL, absolutePageUrl, breadcrumbSchema, schemaPageId, webPageSchema } from "@/lib/seo";

const articleCtas: Record<string, { eyebrow: string; title: string; description: string; zaloLabel: string }> = {
  "chuan-bi-file-cnc": {
    eyebrow: "Gửi file CNC",
    title: "Đã có file cần báo giá?",
    description: "Gửi file hoặc bản vẽ kèm vật liệu, độ dày, số lượng và những điểm còn cần trao đổi.",
    zaloLabel: "Gửi file qua Zalo",
  },
  "go-ghep-la-gi": {
    eyebrow: "Gửi quy cách gỗ",
    title: "Đang chọn gỗ ghép cho hạng mục?",
    description: "Gửi loại gỗ dự kiến, mặt sử dụng, kích thước, độ dày và số lượng để trao đổi đúng tấm cần tìm.",
    zaloLabel: "Gửi quy cách qua Zalo",
  },
  "mdf-thuong-va-chong-am": {
    eyebrow: "Chọn cốt MDF",
    title: "Chưa biết chọn MDF thường hay chống ẩm?",
    description: "Gửi hạng mục, môi trường sử dụng, bề mặt, độ dày và số lượng để trao đổi hướng vật liệu phù hợp.",
    zaloLabel: "Gửi quy cách qua Zalo",
  },
};

export function ArticleLanding({ article, relatedItems = [] }: { article: ContentEntry<ArticleFrontmatter>; relatedItems?: EditorialRelatedItem[] }) {
  const articlePath = `/bai-viet/${article.slug}`;
  const articleHeadings = extractMarkdownHeadings(article.body);
  const articleUrl = absolutePageUrl(articlePath);
  const articleId = schemaPageId(articlePath, "article");
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": articleId,
    headline: article.title,
    description: article.excerpt,
    ...(article.featuredImage ? { image: absoluteMediaUrl(article.featuredImage, SITE_URL) } : {}),
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    author: { "@type": "Organization", name: article.author, url: absolutePageUrl("/") },
    publisher: { "@id": schemaPageId("/", "organization") },
    mainEntityOfPage: articleUrl,
  };
  const pageSchema = webPageSchema({ path: articlePath, name: article.title, description: article.excerpt, primaryEntityId: articleId, datePublished: article.publishedAt, dateModified: article.updatedAt });
  const hasSidebar = articleHeadings.length > 0 || relatedItems.length > 0;
  const cta = articleCtas[article.slug] ?? {
    eyebrow: "Trao đổi về vật liệu",
    title: "Cần hỏi thêm về vật liệu hoặc gia công?",
    description: "Gửi loại vật liệu, quy cách, số lượng và hình ảnh hoặc file liên quan để trao đổi rõ việc cần làm.",
    zaloLabel: "Gửi yêu cầu qua Zalo",
  };
  const markdown = (body: string, headings = articleHeadings) => <MarkdownContent headings={headings}>{body}</MarkdownContent>;

  return (
    <>
      <JsonLd data={[pageSchema, breadcrumbSchema([{ name: "Trang chủ", path: "/" }, { name: "Bài viết", path: "/bai-viet" }, { name: article.title, path: articlePath }]), articleSchema]} />
      <SiteShell>
        <ContentEngagementTracker contentType="article" contentId={article.slug} contentTitle={article.title} contentCategory={article.category} />
        <article data-analytics-content>
          <ArticleHeader article={article} hasSidebar={hasSidebar} />
          <section className="editorial-reading-section">
            <div className={`container-shell editorial-layout${hasSidebar ? " editorial-layout--with-sidebar" : " editorial-layout--without-sidebar"}`}>
              {hasSidebar ? <aside className="editorial-sidebar" aria-label="Điều hướng bài viết">
                <ArticleTableOfContents headings={articleHeadings} />
                <ArticleRelatedContent items={relatedItems} />
              </aside> : null}
              <div id="article-content" className="editorial-content">
                {article.featuredImage ? <figure className="editorial-featured-media">
                  <Image src={resolveEditorialMedia(article.featuredImage, "featured")} alt={article.featuredImageAlt} fill priority sizes="(max-width: 1023px) 100vw, 48rem" className="object-cover" />
                </figure> : null}
                <div data-answer-block>
                  {markdown(article.body)}
                </div>
              </div>
            </div>
          </section>
        </article>
        <FaqList items={article.faq} />
        <ContactCTA eyebrow={cta.eyebrow} title={cta.title} description={cta.description} zaloLabel={cta.zaloLabel} />
      </SiteShell>
    </>
  );
}
