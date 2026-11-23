import { describe, expect, it } from "vitest";
import { addHtmlHeadingAnchors, extractMarkdownHeadings } from "@/lib/editorial/headings";

describe("editorial headings on the active Payload branch", () => {
  it("decodes HTML entities before deriving visible labels and stable anchors", () => {
    expect(extractMarkdownHeadings("## Gỗ &amp; ván MDF &#x43;&#78;&#67;")).toEqual([
      { id: "go-van-mdf-cnc", text: "Gỗ & ván MDF CNC", level: 2 },
    ]);

    expect(addHtmlHeadingAnchors("<h2>Gỗ &amp; ván MDF</h2>")).toEqual({
      html: '<h2 id="go-van-mdf">Gỗ &amp; ván MDF</h2>',
      headings: [{ id: "go-van-mdf", text: "Gỗ & ván MDF", level: 2 }],
    });
  });

  it("decodes named HTML references the same way as the Markdown renderer", () => {
    expect(extractMarkdownHeadings("## MDF &copy; Tùng Phát")).toEqual([
      { id: "mdf-tung-phat", text: "MDF © Tùng Phát", level: 2 },
    ]);
    expect(addHtmlHeadingAnchors("<h2>MDF &copy; Tùng Phát</h2>").headings).toEqual([
      { id: "mdf-tung-phat", text: "MDF © Tùng Phát", level: 2 },
    ]);
  });
});
