import { readFileSync } from "node:fs";
import { expect, it } from "vitest";

it("captures three final source articles and their rendered editorial figures", () => {
  const source = JSON.parse(readFileSync("docs/release-and-wordpress-migration-2026-11/fixtures/final-payload-articles.json", "utf8")) as Array<{ slug: string; body: string; renderedArticleHtml: string; canonical: string }>;
  expect(source.map((x) => x.slug)).toEqual(["mdf-thuong-va-chong-am", "chuan-bi-file-cnc", "go-ghep-la-gi"]);
  for (const post of source) {
    expect(post.renderedArticleHtml).toContain("<figure");
    expect(post.body.length).toBeGreaterThan(1000);
    expect(post.canonical).toContain(`/bai-viet/${post.slug}`);
  }
  expect(source[0].renderedArticleHtml).toContain("<table");
  expect(source[1].renderedArticleHtml).toContain("ban-ve-cnc-minh-hoa.svg");
  expect(source[2].renderedArticleHtml).toContain("go-ghep-cao-su");
});
