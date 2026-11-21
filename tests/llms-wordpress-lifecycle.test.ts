import { afterEach, describe, expect, it, vi } from "vitest";

const url = "https://gotungphat.com/bai-viet/vat-lieu-thu-nghiem/";
const post = { id: 1, slug: "vat-lieu-thu-nghiem", status: "publish", date_gmt: "2026-01-01T00:00:00", modified_gmt: "2026-01-02T00:00:00", title: { rendered: "Cách chọn vật liệu nội thất" }, excerpt: { rendered: "Giới thiệu cách chọn vật liệu nội thất theo nhu cầu thực tế." }, content: { rendered: "<p>Nội dung bài viết đã công bố.</p>" }, featured_media: 0 };

async function build(posts: Record<string, unknown>[], failure = false) {
  vi.resetModules();
  vi.stubEnv("BLOG_CONTENT_PROVIDER", "wordpress");
  vi.stubEnv("WORDPRESS_BASE_URL", "https://wp.example.test");
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
    const target = new URL(String(input));
    if (target.hostname === "wp.example.test") return failure ? new Response("unavailable", { status: 503 }) : Response.json(posts, { headers: { "X-WP-TotalPages": "1" } });
    if (target.pathname.startsWith("/api/")) return Response.json({ docs: [], hasNextPage: false });
    throw new Error(`Unexpected URL ${target}`);
  }));
  const { GET } = await import("@/app/llms.txt/route");
  return (await GET()).text();
}

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.resetModules(); });

describe("WordPress publication and llms build integration", () => {
  it("adds and updates a published post on the next build", async () => {
    expect(await build([post])).toContain(url);
    const result = await build([{ ...post, title: { rendered: "Chọn ván cho tủ nội thất" } }]);
    expect(result).toContain("Chọn ván cho tủ nội thất");
    expect(result).not.toContain("Cách chọn vật liệu nội thất");
  });
  it("removes unpublished and deleted posts from the next build", async () => {
    expect(await build([{ ...post, status: "draft" }])).not.toContain(url);
    expect(await build([])).not.toContain(url);
  });
  it("excludes a published WordPress post marked noindex", async () => {
    expect(await build([{ ...post, tungphat_seo: { title: "", description: "", noindex: true } }])).not.toContain(url);
    const { getArticle } = await import("@/lib/content");
    expect((await getArticle(post.slug))?.noindex).toBe(true);
  });
  it("rejects an unavailable WordPress source so a broken build cannot replace the last release", async () => {
    await expect(build([], true)).rejects.toThrow("WordPress posts request failed: HTTP 503");
  });
});
