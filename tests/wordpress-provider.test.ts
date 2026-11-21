import { expect, it, vi } from "vitest";
import { getWordPressArticles } from "../lib/wordpress/provider";
import { createContentMetadata } from "../lib/content-metadata";

it("uses published WordPress SEO fields instead of legacy article overrides", async () => {
  const post = { id: 10, slug: "mdf-thuong-va-chong-am", status: "publish", date_gmt: "2026-01-01T00:00:00", modified_gmt: "2026-01-02T00:00:00", title: { rendered: "Tiêu đề" }, excerpt: { rendered: "Mô tả mặc định" }, content: { rendered: "<p>Nội dung</p>" }, featured_media: 0, tungphat_seo: { title: "SEO mới", description: "Mô tả mới" } };
  const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify([post]), { headers: { "X-WP-TotalPages": "1" } }));
  const [article] = await getWordPressArticles({ baseUrl: "https://wp.example.test", fetcher });
  expect(article.seoTitle).toBe("SEO mới");
  expect(article.seoDescription).toBe("Mô tả mới");
  const metadata = createContentMetadata(article, "/bai-viet/mdf-thuong-va-chong-am");
  expect(metadata.title).toEqual({ absolute: "SEO mới | Tùng Phát" });
  expect(metadata.description).toBe("Mô tả mới");
});

it("maps published WordPress posts to article data without including drafts", async () => {
  const post = { id: 1, slug: "thu-local", status: "publish", date_gmt: "2026-01-01T00:00:00", modified_gmt: "2026-01-02T00:00:00", title: { rendered: "Tiêu đề &amp; nội dung" }, excerpt: { rendered: "<p>Mô tả bài viết</p>" }, content: { rendered: "<h2>Phần đầu</h2><p>Nội dung</p>" }, featured_media: 0 };
  const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify([post, { ...post, id: 2, slug: "draft", status: "draft" }]), { headers: { "X-WP-TotalPages": "1" } }));
  const articles = await getWordPressArticles({ baseUrl: "https://wp.example.test", fetcher });
  expect(articles.map((p) => p.slug)).toEqual(["thu-local"]);
  expect(articles[0].title).toBe("Tiêu đề & nội dung");
  expect(articles[0].featuredImage).toBe("");
  expect(articles[0].wordpress?.html).toContain("<h2>Phần đầu</h2>");
});

it("fails on WordPress outage and refuses unsecured non-loopback endpoints", async () => {
  await expect(getWordPressArticles({baseUrl:"https://wp.example.test", fetcher:vi.fn().mockResolvedValue(new Response("",{status:503}))})).rejects.toThrow();
  await expect(getWordPressArticles({baseUrl:"http://example.test", allowInsecureLoopback:true})).rejects.toThrow();
});

it("rejects an unknown blog source rather than silently falling back", async () => {
  vi.stubEnv("BLOG_CONTENT_PROVIDER", "wordpres-typo");
  try {
    const { getArticles } = await import("../lib/content");
    await expect(getArticles()).rejects.toThrow(/Unknown BLOG_CONTENT_PROVIDER/);
  } finally { vi.unstubAllEnvs(); }
});
