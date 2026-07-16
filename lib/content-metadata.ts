import type { Metadata } from "next";
import type { ContentEntry } from "@/lib/content";
import type { ArticleFrontmatter, ProductFrontmatter, ProjectFrontmatter, ServicePageFrontmatter } from "@/lib/content-schema";
import { createPageMetadata } from "@/lib/seo";

type SeoEntry = ContentEntry<ArticleFrontmatter | ProductFrontmatter | ProjectFrontmatter | ServicePageFrontmatter>;

export function createContentMetadata(entry: SeoEntry, path: string): Metadata {
  const base = createPageMetadata({ title: entry.seoTitle, description: entry.seoDescription, path, noIndex: entry.noindex || entry.draft });
  return {
    ...base,
    alternates: { canonical: entry.canonical || path },
    openGraph: { ...base.openGraph, images: [{ url: entry.featuredImage, alt: entry.featuredImageAlt }] },
    twitter: { ...base.twitter, images: [entry.featuredImage] }
  };
}
