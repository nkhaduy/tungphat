import sanitizeHtml from "sanitize-html";
import { decodeHTML } from "entities";
import type { ContentEntry } from "@/lib/content";
import type { ArticleFrontmatter } from "@/lib/content-schema";
import { fetchPublishedWordPressPosts } from "@/lib/wordpress/posts";

function textOnly(html: string) {
  return decodeHTML(sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} })).replace(/\s+/g, " ").trim();
}
function records(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.filter((item): item is Record<string, unknown> => !!item && typeof item === "object") : [];
}

/** Separate blog source; callers select it explicitly, with no Payload fallback. */
export async function getWordPressArticles({ baseUrl, fetcher = fetch, allowInsecureLoopback = false }: { baseUrl: string; fetcher?: typeof fetch; allowInsecureLoopback?: boolean }): Promise<ContentEntry<ArticleFrontmatter>[]> {
  const origin = new URL(baseUrl).origin;
  const posts = await fetchPublishedWordPressPosts(baseUrl, fetcher, { allowInsecureLoopback });
  return posts.map((post) => {
    const title = textOnly(post.titleHtml);
    const excerpt = textOnly(post.excerptHtml);
    if (!title || !excerpt || !post.untrustedHtml.trim()) throw new Error(`Incomplete WordPress article: ${post.slug}`);
    const embedded = post.embedded ?? {};
    const media = records(embedded["wp:featuredmedia"])[0];
    const author = records(embedded.author)[0];
    const terms = Array.isArray(embedded["wp:term"]) ? (embedded["wp:term"] as unknown[]).flatMap(records) : [];
    const category = terms.find((term) => term.taxonomy === "category");
    const tags = terms.filter((term) => term.taxonomy === "post_tag").map((term) => String(term.name ?? "")).filter(Boolean);
    let featuredImage = "";
    let featuredImageAlt = "";
    let mediaMetadata: ContentEntry<ArticleFrontmatter>["mediaMetadata"];
    if (media && typeof media.source_url === "string") {
      const image = new URL(media.source_url);
      if (image.origin !== origin || image.username || image.password || !/\.(?:png|jpe?g|webp|avif)$/i.test(image.pathname)) throw new Error(`Unsafe WordPress featured image: ${post.slug}`);
      const details = media.media_details as Record<string, unknown> | undefined;
      if (!Number.isInteger(details?.width) || !Number.isInteger(details?.height) || typeof media.mime_type !== "string") throw new Error(`Missing WordPress featured image metadata: ${post.slug}`);
      featuredImage = image.href;
      featuredImageAlt = String(media.alt_text || title);
      mediaMetadata = { featuredImage: { width: details?.width as number, height: details?.height as number, type: media.mime_type } };
    } else if (post.featuredMediaId) throw new Error(`Missing WordPress featured image: ${post.slug}`);
    return {
      title, slug: post.slug, excerpt, publishedAt: post.publishedAtGmt.slice(0, 10), updatedAt: post.modifiedAtGmt.slice(0, 10),
      author: String(author?.name || "Ban biên tập"), category: String(category?.name || "Bài viết"), tags,
      featuredImage, featuredImageAlt, gallery: [], video: "", catalogue: "", ogImage: "", draft: false, featured: false,
      seoTitle: textOnly(post.seo?.title || "") || title, seoDescription: textOnly(post.seo?.description || "") || excerpt, canonical: post.canonical, noindex: post.seo?.noindex === true, relatedProducts: [], relatedArticles: [], faq: [],
      body: post.untrustedHtml, sourcePath: `wordpress://${post.id}`, mediaMetadata,
      wordpress: { html: post.untrustedHtml, mediaOrigin: origin, allowInsecureLoopback },
    };
  });
}
