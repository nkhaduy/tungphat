import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { hasLexicalContent, LexicalContent } from "../components/content/LexicalContent";

describe("LexicalContent", () => {
  it("renders article text, headings, lists, quotes, links, and media semantically", () => {
    const html = renderToStaticMarkup(
      createElement(LexicalContent, { value: {
          root: {
            type: "root",
            children: [
              { type: "paragraph", children: [{ type: "text", text: "MDF", format: 1 }] },
              { type: "heading", tag: "h2", children: [{ type: "text", text: "Cách chọn ván" }] },
              {
                type: "list",
                listType: "bullet",
                tag: "ul",
                children: [{ type: "listitem", value: 1, children: [{ type: "text", text: "Kiểm tra độ dày" }] }],
              },
              { type: "quote", children: [{ type: "text", text: "Đối chiếu nhu cầu sử dụng." }] },
              { type: "link", url: "https://example.com/guide", children: [{ type: "text", text: "Xem hướng dẫn" }] },
              {
                type: "upload",
                relationTo: "media",
                value: { url: "https://cdn.mdftungphat.com/uploads/mdf.webp", alt: "Tấm MDF" },
              },
            ],
          },
        } }),
    );

    expect(html).toContain("<strong>MDF</strong>");
    expect(html).toContain("<h2>Cách chọn ván</h2>");
    expect(html).toContain("<ul>");
    expect(html).toContain("<blockquote>");
    expect(html).toContain('href="https://example.com/guide"');
    expect(html).toContain('src="https://cdn.mdftungphat.com/uploads/mdf.webp"');
    expect(html).toContain('alt="Tấm MDF"');
  });

  it("does not create executable links or render arbitrary HTML", () => {
    const html = renderToStaticMarkup(
      createElement(LexicalContent, { value: {
          root: {
            type: "root",
            children: [
              { type: "link", url: "javascript:alert(1)", children: [{ type: "text", text: "Liên kết" }] },
              { type: "text", text: "<script>alert(1)</script>" },
            ],
          },
        } }),
    );

    expect(html).not.toContain("href=");
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("renders editorial table, code, FAQ, and allowlisted YouTube blocks", () => {
    const html = renderToStaticMarkup(
      createElement(LexicalContent, { value: {
        root: { type: "root", children: [
          { type: "block", fields: { blockType: "editorialTable", columns: [{ label: "Quy cách" }, { label: "Độ dày" }], rows: [{ cells: [{ value: "MDF" }, { value: "17 mm" }] }] } },
          { type: "block", fields: { blockType: "editorialCode", code: "<script>alert(1)</script>" } },
          { type: "block", fields: { blockType: "editorialFAQ", items: [{ question: "Chọn loại ván thế nào?", answer: "Đối chiếu môi trường sử dụng và quy cách cần đặt." }] } },
          { type: "block", fields: { blockType: "editorialVideo", title: "Video minh họa", url: "https://youtu.be/dQw4w9WgXcQ" } },
          { type: "block", fields: { blockType: "editorialVideo", title: "URL không được phép", url: "https://evil.example/video" } },
        ] },
      } }),
    );

    expect(html).toContain("<table");
    expect(html).toContain("17 mm");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("<details");
    expect(html).toContain("youtube-nocookie.com/embed/dQw4w9WgXcQ");
    expect(html).toContain('sandbox="allow-scripts allow-same-origin allow-presentation"');
    expect(html).not.toContain("evil.example");
  });

  it("distinguishes blank editor state from content to keep legacy Markdown visible", () => {
    expect(hasLexicalContent({ root: { type: "root", children: [{ type: "paragraph", children: [{ type: "text", text: "" }] }] } })).toBe(false);
    expect(hasLexicalContent({ root: { type: "root", children: [{ type: "paragraph", children: [{ type: "text", text: "Nội dung mới" }] }] } })).toBe(true);
  });
});
