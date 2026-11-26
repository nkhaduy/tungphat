import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ArticleFrontmatter } from "@/lib/content-schema";
import { resolveEditorialMedia } from "@/lib/editorial/media";

function displayDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(value)) return null;
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

export function EditorialArticleCard({ article }: { article: Pick<ArticleFrontmatter, "slug" | "title" | "excerpt" | "category" | "publishedAt" | "featuredImage" | "featuredImageAlt"> }) {
  const href = `/bai-viet/${article.slug}`;
  const published = displayDate(article.publishedAt);
  return <article className="editorial-card">
    {article.featuredImage ? <Link href={href} className="editorial-card__media" aria-label={article.title}>
      <Image src={resolveEditorialMedia(article.featuredImage, "thumbnail")} alt={article.featuredImageAlt} fill sizes="(max-width: 720px) 36vw, 15rem" className="object-cover" />
    </Link> : null}
    <div className="editorial-card__content">
      <p className="editorial-card__meta"><span>{article.category}</span>{published ? <><span aria-hidden="true">·</span><time dateTime={article.publishedAt}>{published}</time></> : null}</p>
      <h3><Link href={href}>{article.title}</Link></h3>
      <p className="editorial-card__excerpt">{article.excerpt}</p>
      <Link href={href} className="editorial-card__read">Đọc bài viết <ArrowRight size={16} aria-hidden="true" /></Link>
    </div>
  </article>;
}
