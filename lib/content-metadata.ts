import type { Metadata } from "next";
import type { ContentEntry } from "@/lib/content";
import type { ArticleFrontmatter, ProductFrontmatter, ProjectFrontmatter, ServicePageFrontmatter } from "@/lib/content-schema";
import { mediaUrl } from "@/lib/media";
import { absoluteUrl, createPageMetadata } from "@/lib/seo";
import { createSocialImage } from "@/lib/social-images";

type SeoEntry = ContentEntry<ArticleFrontmatter | ProductFrontmatter | ProjectFrontmatter | ServicePageFrontmatter>;

export function createContentMetadata(entry: SeoEntry, path: string): Metadata {
  const image = mediaUrl(entry.ogImage || entry.featuredImage);
  const socialImage = createSocialImage({ url: image, alt: entry.featuredImageAlt });
  const base = createPageMetadata({
    title: entry.seoTitle,
    description: entry.seoDescription,
    path,
    noIndex: entry.noindex || entry.draft,
    socialImages: [socialImage],
  });
  return {
    ...base,
    alternates: { canonical: entry.canonical || absoluteUrl(path) },
  };
}
