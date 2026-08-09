import { describe, expect, it } from "vitest";
import { auditCataloguePages } from "@/lib/catalogue-quality";

const catalogueHtml = `<!doctype html><html><head>
  <title>BT111 - Melamine Ba Thanh | Tung Phat</title>
  <meta name="description" content="Ma mau BT111 co thong tin nhan dien va nguon doi chieu.">
  <link rel="canonical" href="https://mdftungphat.com/catalogue/ba-thanh/melamine/bt111/">
  <script type="application/ld+json">{"@type":"Product"}</script>
</head><body>
  <nav aria-label="Breadcrumb"><a href="/catalogue/">Catalogue</a></nav>
  <h1>Ma mau BT111</h1><img src="/bt111.webp" alt="Ma mau BT111">
  <p>Nguon supplier: Ba Thanh.</p><a href="https://zalo.me/0909259160">Yeu cau doi chieu mau</a>
</body></html>`;

describe("indexable catalogue quality gate", () => {
  it("passes a page with identity, metadata, provenance, context, visual and commercial utility", () => {
    const result = auditCataloguePages({
      sitemapUrls: [
        "https://mdftungphat.com/catalogue/ba-thanh/melamine/bt111/",
      ],
      readHtml: () => catalogueHtml,
    });

    expect(result.summary).toEqual({ total: 1, passed: 1, failed: 0 });
    expect(result.pages[0]).toMatchObject({ status: "PASS", issues: [] });
  });

  it("rejects indexable catalogue pages that lose provenance or useful context", () => {
    const result = auditCataloguePages({
      sitemapUrls: ["https://mdftungphat.com/catalogue/thin-page/"],
      readHtml: () =>
        `<!doctype html><title>Thin page</title><link rel="canonical" href="https://mdftungphat.com/catalogue/thin-page/"><h1>Thin page</h1>`,
    });

    expect(result.summary).toEqual({ total: 1, passed: 0, failed: 1 });
    expect(result.pages[0].issues).toEqual(
      expect.arrayContaining([
        "missingMetadata",
        "missingVisual",
        "missingProvenance",
        "missingCategoryContext",
        "missingCommercialUtility",
        "missingStructuredData",
      ]),
    );
  });
});
