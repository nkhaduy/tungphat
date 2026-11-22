import { afterEach, describe, expect, it, vi } from "vitest";

const origin = "https://mdftungphat.com";
const articlePath = "/bai-viet/kiem-tra-vong-doi-llms/";
const articleUrl = `${origin}${articlePath}`;

function articleDoc(overrides: Record<string, unknown> = {}) {
  return {
    slug: "kiem-tra-vong-doi-llms",
    _status: "published",
    title: "Hướng dẫn chọn vật liệu làm nội thất",
    excerpt: "Thông tin tham khảo để đối chiếu các loại vật liệu và tìm đúng nhóm sản phẩm phù hợp với nhu cầu sử dụng.",
    body: "## Chọn vật liệu\n\nNội dung đã được công bố và có thể tra cứu.",
    author: "Tùng Phát",
    category: "Kiến thức vật liệu",
    publishedAt: "2026-11-17T00:00:00Z",
    updatedAt: "2026-11-18T00:00:00Z",
    featuredImage: "/images/material-color-hero.webp",
    featuredImageAlt: "Mẫu vật liệu gỗ dùng trong nội thất",
    seo: {
      title: "Tìm hiểu cách chọn vật liệu gỗ công nghiệp phù hợp",
      description: "Tổng quan những điểm cần lưu ý khi chọn ván công nghiệp cho nội thất, cách xác định nhu cầu và trao đổi thông tin sản phẩm phù hợp.",
      noindex: false,
    },
    ...overrides,
  };
}

async function buildFixture(documents: Record<string, unknown>[], status = 200) {
  vi.resetModules(); // Clear the Payload collection promise cache between independent builds.
  vi.stubEnv("BLOG_CONTENT_PROVIDER", "payload");
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
    const url = new URL(String(input));
    if (!url.pathname.startsWith("/api/")) throw new Error(`Unexpected request ${url}`);
    if (status !== 200) return new Response("CMS unavailable", { status });
    return Response.json({ docs: url.pathname === "/api/articles" ? documents : [], hasNextPage: false });
  }));

  const [{ default: sitemap }, { buildKnowledgeIndex }, { GET }] = await Promise.all([
    import("@/app/sitemap"),
    import("@/lib/knowledge"),
    import("@/app/llms.txt/route"),
  ]);
  const [entries, knowledge, response] = await Promise.all([sitemap(), buildKnowledgeIndex(), GET()]);
  const markdown = await response.text();
  return {
    sitemapUrls: entries.map((entry) => entry.url),
    page: knowledge.pages.find((entry) => entry.url === articleUrl),
    markdown,
    contentType: response.headers.get("Content-Type"),
  };
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe("Payload article publication lifecycle through sitemap, knowledge and llms.txt", () => {
  it("adds a newly published article to all three discovery surfaces", async () => {
    const result = await buildFixture([articleDoc()]);
    expect(result.sitemapUrls).toContain(articleUrl);
    expect(result.page?.name).toBe("Hướng dẫn chọn vật liệu làm nội thất");
    expect(result.markdown).toContain(articleUrl);
    expect(result.contentType).toBe("text/plain; charset=utf-8");
  });

  it("refreshes the published title and description on a new build", async () => {
    const original = await buildFixture([articleDoc()]);
    const revised = await buildFixture([articleDoc({
      title: "Hướng dẫn chọn ván cho tủ và bàn làm việc",
      excerpt: "Đối chiếu các loại ván với môi trường sử dụng, thiết kế tủ và bàn để chọn vật liệu phù hợp cho từng hạng mục nội thất.",
    })]);
    expect(original.markdown).toContain("Hướng dẫn chọn vật liệu làm nội thất");
    expect(revised.page?.name).toBe("Hướng dẫn chọn ván cho tủ và bàn làm việc");
    expect(revised.markdown).toContain("Đối chiếu các loại ván với môi trường sử dụng");
    expect(revised.markdown).not.toContain("Hướng dẫn chọn vật liệu làm nội thất");
    expect(revised.sitemapUrls).toContain(articleUrl);
  });

  it.each([
    ["unpublished", { _status: "draft" }],
    ["noindex", { seo: { ...articleDoc().seo as object, noindex: true } }],
  ])("excludes %s content from all discovery surfaces", async (_status, override) => {
    const result = await buildFixture([articleDoc(override)]);
    expect(result.sitemapUrls).not.toContain(articleUrl);
    expect(result.page).toBeUndefined();
    expect(result.markdown).not.toContain(articleUrl);
  });

  it("does not advertise an article URL whose canonical points to a different page", async () => {
    const result = await buildFixture([articleDoc({
      seo: { ...articleDoc().seo as object, canonical: `${origin}/bai-viet/go-ghep-la-gi/` },
    })]);
    expect(result.sitemapUrls).not.toContain(articleUrl);
    expect(result.page).toBeUndefined();
    expect(result.markdown).not.toContain(articleUrl);
  });

  it("fails a rebuild on CMS outage instead of producing an empty replacement index", async () => {
    await expect(buildFixture([], 503)).rejects.toThrow("Payload articles fetch failed: HTTP 503");
  });
});
