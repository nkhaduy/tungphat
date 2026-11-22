import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { WordPressArticleBody } from "../components/content/WordPressArticleBody";

describe("WordPress article body", () => {
  it("renders supported Gutenberg markup through the sanitizer", () => {
    const html = renderToStaticMarkup(createElement(WordPressArticleBody, { html: '<h2>Section</h2><p>Text</p><figure><img src="https://wp.example.test/a.jpg" alt="Sample"><figcaption>Caption</figcaption></figure>', mediaOrigins: ["https://wp.example.test"] }));
    expect(html).toContain("<h2>Section</h2>");
    expect(html).toContain("<figcaption>Caption</figcaption>");
  });
  it("fails closed when a Gutenberg block or media cannot be preserved", () => {
    expect(() => renderToStaticMarkup(createElement(WordPressArticleBody, { html: '<iframe src="https://example.com"></iframe>', mediaOrigins: [] }))).toThrow(/Unsupported element/);
    expect(() => renderToStaticMarkup(createElement(WordPressArticleBody, { html: '<img src="https://evil.test/a.jpg">', mediaOrigins: [] }))).toThrow(/Unsafe image/);
  });
});
