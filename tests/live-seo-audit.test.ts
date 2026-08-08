import { describe, expect, it } from "vitest";
import { parseHtmlSignals } from "@/lib/live-seo-audit";

describe("production HTML signal parser", () => {
  it("extracts canonical, robots, direct answer, H1 and JSON-LD signals", () => {
    const html = '<html><head><title>Ván MDF | Tùng Phát</title><meta name="description" content="Mô tả"><meta name="robots" content="index, follow"><link rel="canonical" href="https://mdftungphat.com/van-mdf/"><script type="application/ld+json">{"@type":"Product"}</script></head><body><h1>Ván MDF</h1><section data-answer-block>Trả lời</section><a href="/lien-he/">Liên hệ</a></body></html>';

    expect(parseHtmlSignals(html, { "x-robots-tag": "" })).toMatchObject({
      title: "Ván MDF | Tùng Phát",
      description: "Mô tả",
      robots: "index, follow",
      canonical: "https://mdftungphat.com/van-mdf/",
      h1: "Ván MDF",
      directAnswer: true,
      schemaCount: 1,
      internalLinks: ["/lien-he/"],
      indexable: true,
    });
  });

  it("treats an X-Robots-Tag noindex as non-indexable even without a meta tag", () => {
    expect(parseHtmlSignals("<html><body><h1>Preview</h1></body></html>", { "x-robots-tag": "noindex, nofollow" }).indexable).toBe(false);
  });
});
