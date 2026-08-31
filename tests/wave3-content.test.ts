import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { getArticles } from "@/lib/content";

const articleSlugs = ["chuan-bi-file-cnc", "go-ghep-la-gi", "mdf-thuong-va-chong-am"] as const;
const forbiddenPublicLanguage = [
  "repository",
  "JSON",
  "numeric field",
  "website chưa công bố",
  "Nguồn và giới hạn dữ liệu",
  "không thay thế",
  "dữ liệu được kiểm tra",
  "dữ liệu thực tế",
  "cần xác minh",
];

function source(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("Wave 3 public knowledge copy", () => {
  it("keeps the hub customer-facing", () => {
    const hub = source("app/bai-viet/page.tsx");

    expect(hub).toContain("Đọc trước khi hỏi hàng");
    expect(hub).toContain("Đọc hướng dẫn");
    expect(hub).not.toContain("CMS");
    expect(hub).not.toContain("publish");
    expect(hub).not.toContain("không thay thế");

    const landing = source("components/content/ArticleLanding.tsx");
    expect(landing).not.toContain("đối chiếu theo dữ liệu thực tế");
    expect(landing).toContain("Gửi file qua Zalo");
  });

  it("keeps the three published articles distinct and buyer-first", async () => {
    const articles = await getArticles();
    const selected = articleSlugs.map((slug) => articles.find((article) => article.slug === slug));

    expect(selected.every(Boolean)).toBe(true);
    const bodies = selected.map((article) => article?.body ?? "");
    const headings = bodies.map((body) => [...body.matchAll(/^## (.+)$/gmu)].map((match) => match[1]));
    expect(new Set(headings.map((items) => items.join("|"))).size).toBe(3);

    for (const body of bodies) {
      for (const phrase of forbiddenPublicLanguage) expect(body).not.toContain(phrase);
    }

    for (const article of selected) {
      for (const item of article?.faq ?? []) {
        for (const phrase of forbiddenPublicLanguage) expect(`${item.question} ${item.answer}`).not.toContain(phrase);
      }
    }

    const cnc = bodies[0];
    const wood = bodies[1];
    const mdf = bodies[2];
    expect(cnc).toContain("cần trao đổi");
    expect(cnc).toContain("Đơn vị đo");
    expect(cnc).toMatch(/số lượng/iu);
    expect(wood).toContain("Gỗ ghép là");
    expect(wood).toContain("mối ghép");
    expect(wood).toContain("/go-ghep-cao-su/");
    expect(wood).toContain("/go-ghep-tram/");
    expect(mdf).toContain("MDF chống ẩm không đồng nghĩa chống nước.");
    expect(mdf).toContain("/van-mdf/");
    expect(mdf).toContain("/mdf-chong-am/");
  });

  it("preserves the article route and relationship graph", async () => {
    const articles = await getArticles();
    const bySlug = new Map(articles.map((article) => [article.slug, article]));

    expect(bySlug.get("chuan-bi-file-cnc")?.relatedProducts).toEqual(["van-mdf", "mdf-chong-am", "go-ghep"]);
    expect(bySlug.get("chuan-bi-file-cnc")?.relatedArticles).toEqual(["go-ghep-la-gi"]);
    expect(bySlug.get("go-ghep-la-gi")?.relatedProducts).toEqual(["go-ghep", "go-ghep-cao-su", "go-ghep-tram"]);
    expect(bySlug.get("go-ghep-la-gi")?.relatedArticles).toEqual(["chuan-bi-file-cnc"]);
    expect(bySlug.get("mdf-thuong-va-chong-am")?.relatedProducts).toEqual(["van-mdf", "mdf-chong-am"]);
    expect(bySlug.get("mdf-thuong-va-chong-am")?.relatedArticles).toEqual(["go-ghep-la-gi"]);
    expect(bySlug.get("mdf-thuong-va-chong-am")?.canonical).toBe("https://mdftungphat.com/bai-viet/mdf-thuong-va-chong-am");
  });
});
