import { CalendarDays, RefreshCw, UserRound } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import type { ArticleFrontmatter } from "@/lib/content-schema";

function displayDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(value)) return null;
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

export function ArticleHeader({ article, hasSidebar }: { article: Pick<ArticleFrontmatter, "title" | "excerpt" | "category" | "author" | "publishedAt" | "updatedAt">; hasSidebar: boolean }) {
  const published = displayDate(article.publishedAt);
  const updated = article.updatedAt !== article.publishedAt ? displayDate(article.updatedAt) : null;
  const category = article.category.trim();
  const hasMetadata = Boolean(article.author.trim() || published || updated);

  return (
    <header className="editorial-header border-b border-forest-900/10 bg-white">
      <div className={`container-shell editorial-header__inner${hasSidebar ? "" : " editorial-header__inner--single"}`}>
        <Breadcrumbs items={[
          { label: "Trang chủ", href: "/" },
          { label: "Bài viết", href: "/bai-viet/" },
          ...(category ? [{ label: category }] : []),
          { label: article.title },
        ]} compact ariaLabel="Đường dẫn" />
        {category ? <p className="editorial-header__category">{category}</p> : null}
        <h1 className="editorial-header__title">{article.title}</h1>
        <p className="editorial-header__excerpt">{article.excerpt}</p>
        {hasMetadata ? <ul className="editorial-header__metadata" aria-label="Thông tin bài viết">
          {article.author.trim() ? <li><UserRound size={16} aria-hidden="true" /><span>{article.author}</span></li> : null}
          {published ? <li><CalendarDays size={16} aria-hidden="true" /><span>Đăng <time dateTime={article.publishedAt}>{published}</time></span></li> : null}
          {updated ? <li><RefreshCw size={16} aria-hidden="true" /><span>Cập nhật <time dateTime={article.updatedAt}>{updated}</time></span></li> : null}
        </ul> : null}
      </div>
    </header>
  );
}
