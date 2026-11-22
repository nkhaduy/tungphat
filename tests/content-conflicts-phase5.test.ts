import { describe, expect, it } from "vitest";
import * as conflicts from "@/lib/content";

describe("CMS editorial conflict guard", () => {
  it("detects an edited body before a repository override hides it", () => {
    expect(typeof conflicts.assertCmsEditorialUnchanged).toBe("function");
    const original = { slug: "mdf-thuong-va-chong-am", body: "Original CMS body", _status: "published" };
    const baseline = conflicts.cmsEditorialFingerprint("articles", original);
    expect(() => conflicts.assertCmsEditorialUnchanged("articles", { ...original, body: "CMS revised" }, { "mdf-thuong-va-chong-am": baseline })).toThrow(/mdf-thuong-va-chong-am/);
    expect(() => conflicts.assertCmsEditorialUnchanged("articles", { ...original, title: "Updated title" }, { "mdf-thuong-va-chong-am": baseline })).not.toThrow();
  });
  it("detects overwritten product fields while allowing CMS publication changes", () => {
    const original = { slug: "van-mdf", title: "Original", body: "Original", _status: "published", seo: { title: "SEO", canonical: "https://example.com/" } };
    const baseline = conflicts.cmsEditorialFingerprint("products", original);
    expect(() => conflicts.assertCmsEditorialUnchanged("products", { ...original, title: "Revised" }, { "van-mdf": baseline })).toThrow(/van-mdf/);
    expect(() => conflicts.assertCmsEditorialUnchanged("products", { ...original, _status: "draft", title: "Revised" }, { "van-mdf": baseline })).not.toThrow();
    expect(() => conflicts.assertCmsEditorialUnchanged("products", { ...original, seo: { ...original.seo, canonical: "https://example.com/new/" } }, { "van-mdf": baseline })).not.toThrow();
  });
});

describe("CMS article additions", () => {
  const entry = { slug: "chuan-bi-file-cnc", body: "## Gửi yêu cầu để báo giá\nCMS body", updatedAt: "2026-12-01" };
  it("keeps CMS revisions and does not overwrite a newer update date", () => {
    expect(conflicts.applyArticleEditorial(entry).body).toContain("CMS body");
    expect(conflicts.applyArticleEditorial(entry).updatedAt).toBe("2026-12-01");
  });
  it("fails visibly if an insertion heading is missing or ambiguous", () => {
    expect(() => conflicts.applyArticleEditorial({ ...entry, body: "## CMS đã đổi heading" })).toThrow(/heading/i);
    expect(() => conflicts.applyArticleEditorial({ ...entry, body: `${entry.body}\n${entry.body}` })).toThrow(/heading/i);
  });
  it("does not add a duplicate section already owned by CMS", () => {
    const body = `## Ví dụ kiểm tra một chi tiết trước khi gửi\nĐã sửa trong CMS.\n\n${entry.body}`;
    const result = conflicts.applyArticleEditorial({ ...entry, body });
    expect(result.body.match(/## Ví dụ kiểm tra một chi tiết trước khi gửi/g)).toHaveLength(1);
    expect(result.body).toContain("Đã sửa trong CMS.");
  });
});

it("places the wood-joinery addition at an explicit end-of-body slot without depending on a CMS heading", () => {
  const article = { slug: "go-ghep-la-gi", body: "## Heading CMS đã đổi\nNội dung CMS.", updatedAt: "2026-12-01" };
  const result = conflicts.applyArticleEditorial(article);
  expect(result.body.startsWith(article.body)).toBe(true);
  expect(result.body).toContain("## Chọn mặt bàn hay cánh tủ cần xem gì khác nhau?");
});

it("rejects a missing CMS article body rather than publishing an orphan editorial addition", () => {
  expect(() => conflicts.applyArticleEditorial({ slug: "go-ghep-la-gi", body: null as unknown as string, updatedAt: "2026-11-13" })).toThrow(/body/i);
});

it("fails closed if a required editorial baseline is missing", () => {
  expect(() => conflicts.assertCmsEditorialUnchanged("articles", { slug: "mdf-thuong-va-chong-am", body: "text", _status: "published" }, {})).toThrow(/baseline/i);
  expect(() => conflicts.assertCmsEditorialUnchanged("products", { slug: "van-mdf", title: "text", _status: "published" }, {})).toThrow(/baseline/i);
});
