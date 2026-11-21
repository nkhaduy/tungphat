import { describe, expect, it } from "vitest";
import { generateLlmsIndex, type LlmsPage, type LlmsSource } from "@/lib/llms-index";

const origin = "https://gotungphat.com";
const urls = [
  "/", "/van-mdf/", "/van-hdf/", "/mdf-chong-am/", "/van-mfc/",
  "/go-ghep/", "/van-plywood/", "/melamine/", "/catalogue/",
  "/catalogue/an-cuong/", "/gia-cong-cnc/", "/lien-he/", "/bai-viet/",
  "/bai-viet/mdf-thuong-va-chong-am/", "/bai-viet/go-ghep-la-gi/",
].map((path) => `${origin}${path}`);

function source(pages: LlmsPage[] = []): LlmsSource {
  return {
    sitemapUrls: urls,
    pages,
    businessName: "Công ty TNHH TMDV Gỗ Tùng Phát",
    phone: "0909 259 160",
    zaloUrl: "https://zalo.me/0909259160",
    serviceAreas: ["TP. Hồ Chí Minh"],
  };
}

describe("llms.txt generated from public source inventory", () => {
  it("selects verified URLs once and keeps catalogue navigation compact", () => {
    const result = generateLlmsIndex(source());
    expect(result.markdown.match(/^# /gmu)).toHaveLength(1);
    expect(result.markdown).toContain("## Catalogue và mã màu");
    expect(result.markdown).toContain("https://zalo.me/0909259160");
    expect(result.included).toHaveLength(new Set(result.included).size);
    expect(result.included).not.toContain(`${origin}/catalogue/ba-thanh/`);
    expect(Buffer.byteLength(result.markdown, "utf8")).toBeLessThan(18_001);
  });

  it("updates, adds and removes articles according to the published sitemap", () => {
    const article: LlmsPage = {
      url: `${origin}/bai-viet/mdf-thuong-va-chong-am/`,
      type: "Article", name: "MDF thường và chống ẩm", description: "So sánh MDF",
      updatedAt: "2026-11-18",
    };
    const before = generateLlmsIndex(source([article]));
    expect(before.markdown).toContain("MDF thường và chống ẩm");
    const updated = generateLlmsIndex(source([{ ...article, name: "MDF chống ẩm cập nhật" }]));
    expect(updated.markdown).toContain("MDF chống ẩm cập nhật");
    const unpublished = source([article]);
    unpublished.sitemapUrls = unpublished.sitemapUrls.filter((url) => url !== article.url);
    const after = generateLlmsIndex(unpublished);
    expect(after.markdown).not.toContain(article.url);
    expect(generateLlmsIndex(source([article])).markdown).toBe(before.markdown);
  });

  it("excludes draft, unknown and off-site article links", () => {
    const pages: LlmsPage[] = [
      { url: `${origin}/bai-viet/nhap/`, type: "Article", name: "Bản nháp", description: "Nháp" },
      { url: "https://example.org/unknown/", type: "Article", name: "Outside", description: "Outside" },
      { url: `${origin}/bai-viet/go-ghep-la-gi/?preview=1`, type: "Article", name: "Preview", description: "Preview" },
    ];
    const result = generateLlmsIndex(source(pages));
    expect(result.markdown).not.toContain("Bản nháp");
    expect(result.markdown).not.toContain("example.org");
    expect(result.markdown).not.toContain("?preview=");
  });

  it("only exposes supplier material groups that exist in the published sitemap", () => {
    const withGroup = source();
    withGroup.sitemapUrls.push(`${origin}/catalogue/an-cuong/melamine/`);
    const output = generateLlmsIndex(withGroup).markdown;
    expect(output).toContain(`${origin}/catalogue/an-cuong/melamine/`);
    expect(output).not.toContain(`${origin}/catalogue/an-cuong/veneer/`);
    expect(output.indexOf("## Catalogue và mã màu")).toBeLessThan(output.indexOf("## Cắt ván, gia công CNC"));
  });

  it("decodes HTML entities and removes markup without splitting Vietnamese words", () => {
    const article: LlmsPage = {
      url: `${origin}/bai-viet/go-ghep-la-gi/`, type: "Article",
      name: "Gỗ ghép &amp; <b>ứng dụng</b>",
      description: "Cách chọn <em>gỗ ghép</em> cho tủ và kệ. Nội dung chi tiết về cấu tạo tấm.",
    };
    const output = generateLlmsIndex(source([article])).markdown;
    expect(output).toContain("Gỗ ghép & ứng dụng");
    expect(output).toContain("Cách chọn gỗ ghép cho tủ và kệ.");
    expect(output).not.toContain("<em>");
    expect(output).not.toContain("&amp;");
  });
});
