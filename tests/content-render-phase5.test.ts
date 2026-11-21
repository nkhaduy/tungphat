import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { ArticleLanding } from "@/components/content/ArticleLanding";
import { applyArticleEditorial, assertCmsEditorialUnchanged, cmsEditorialFingerprint, getArticles } from "@/lib/content";
import { filterPublishedContent } from "@/lib/listing-indexability";
import { articleSchema } from "@/lib/content-schema";

it("renders CMS title and revised body plus the reviewed addition without duplication", async () => {
  const existing = (await getArticles()).find((item) => item.slug === "chuan-bi-file-cnc")!;
  const revised = applyArticleEditorial({ ...existing, title: "Tiêu đề CMS đã cập nhật", updatedAt: "2026-12-02", body: "## Mục CMS mới\nNội dung CMS mới.\n\n## Gửi yêu cầu để báo giá\nThông tin cần gửi." });
  const html = renderToStaticMarkup(createElement(ArticleLanding, { article: revised }));
  expect(html).toContain("Tiêu đề CMS đã cập nhật");
  expect(html).toContain("Nội dung CMS mới.");
  expect(html).toContain("Ví dụ kiểm tra một chi tiết trước khi gửi");
  expect(html).toContain("2026-12-02");
  expect(html.match(/Sơ đồ minh họa một chi tiết ván/g)).toHaveLength(1);
  expect(filterPublishedContent([{ ...revised, draft: true }])).toHaveLength(0);
  expect(articleSchema.safeParse({ ...revised, title: null }).success).toBe(false);
});

it("permits article metadata changes but rejects missing overridden CMS body", () => {
  const original = { slug: "mdf-thuong-va-chong-am", body: "original", _status: "published", seo: { title: "old" } };
  const fingerprint = cmsEditorialFingerprint("articles", original);
  const baseline = { "mdf-thuong-va-chong-am": fingerprint };
  expect(() => assertCmsEditorialUnchanged("articles", { ...original, seo: { title: "new" } }, baseline)).not.toThrow();
  expect(() => assertCmsEditorialUnchanged("articles", { ...original, body: null }, baseline)).toThrow(/editorial conflict/);
});
