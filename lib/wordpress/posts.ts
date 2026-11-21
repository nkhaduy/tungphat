import { z } from "zod";
import { randomUUID } from "node:crypto";

// WordPress HTML is untrusted. Rendering must pass through the allowlist and
// migration parity must be reviewed before enabling this source for release.
const rendered = z.object({ rendered: z.string(), protected: z.boolean().optional() });
const postSchema = z.object({
  id: z.number().int().positive(),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  status: z.string(),
  date_gmt: z.string().nullable(),
  modified_gmt: z.string().nullable(),
  title: rendered,
  excerpt: rendered,
  content: rendered,
  featured_media: z.number().int().nonnegative(),
  tungphat_seo: z.object({ title: z.string(), description: z.string(), noindex: z.boolean().optional() }).optional(),
}).passthrough();

export type WordPressPublicPost = {
  id: number;
  slug: string;
  canonical: string;
  publishedAtGmt: string;
  modifiedAtGmt: string;
  titleHtml: string;
  excerptHtml: string;
  untrustedHtml: string;
  featuredMediaId: number;
  seo?: { title: string; description: string; noindex?: boolean };
  embedded?: Record<string, unknown>;
};

export async function fetchPublishedWordPressPosts(baseUrl: string, fetcher: typeof fetch = fetch, options: { allowInsecureLoopback?: boolean } = {}): Promise<WordPressPublicPost[]> {
  const base = new URL(baseUrl);
  const isLocal = options.allowInsecureLoopback && base.protocol === "http:" && base.hostname === "127.0.0.1";
  if (!(base.protocol === "https:" || isLocal) || base.username || base.password || base.search || base.hash) throw new Error("WordPress URL must be HTTPS without credentials or query");
  const root = base.toString().replace(/\/$/, "");
  // Avoid stale Next Data Cache between static builds while permitting static export.
  const requestVersion = randomUUID();
  const result: WordPressPublicPost[] = [];
  const slugs = new Set<string>();
  let totalPages = 1;
  for (let page = 1; page <= totalPages; page++) {
    const response = await fetcher(`${root}/wp-json/wp/v2/posts?status=publish&per_page=100&page=${page}&_embed=1&_build=${requestVersion}`, { cache: "force-cache", redirect: "error", signal: AbortSignal.timeout(15_000), ...(isLocal ? { headers: { Cookie: "playground_auto_login_already_happened=1" } } : {}) });
    if (!response.ok) throw new Error(`WordPress posts request failed: HTTP ${response.status}`);
    const header = response.headers.get("X-WP-TotalPages");
    if (header === null) throw new Error("Missing WordPress pagination header");
    const parsedPages = Number(header);
    if (!Number.isInteger(parsedPages) || parsedPages < 0 || parsedPages > 50 || (page > 1 && parsedPages !== totalPages)) throw new Error("Invalid WordPress pagination");
    totalPages = parsedPages;
    const posts = z.array(postSchema).parse(await response.json());
    for (const post of posts) {
      if (post.status !== "publish" || post.content.protected || post.excerpt.protected) continue;
      if (!post.date_gmt || !post.modified_gmt || !Number.isFinite(Date.parse(`${post.date_gmt}Z`)) || !Number.isFinite(Date.parse(`${post.modified_gmt}Z`))) throw new Error(`Invalid WordPress post dates: ${post.id}`);
      if (Date.parse(`${post.date_gmt}Z`) > Date.now()) continue;
      if (slugs.has(post.slug)) throw new Error(`Duplicate WordPress slug: ${post.slug}`);
      slugs.add(post.slug);
      result.push({ id: post.id, slug: post.slug, canonical: `https://mdftungphat.com/bai-viet/${post.slug}/`, publishedAtGmt: post.date_gmt, modifiedAtGmt: post.modified_gmt, titleHtml: post.title.rendered, excerptHtml: post.excerpt.rendered, untrustedHtml: post.content.rendered, featuredMediaId: post.featured_media, seo: post.tungphat_seo, embedded: post._embedded as Record<string, unknown> | undefined });
    }
  }
  return result;
}
