import { describe, expect, it } from "vitest";
import { buildAnCuongFullSourceManifest } from "@/scripts/ancuong/build-full-manifest";
import { buildCoverageSummary, validateFullSourceManifest } from "@/lib/catalog/full-import/manifest";

describe("An Cuong full source manifest", () => {
  it("accounts canonical products, locale aliases, removed pages and family sources without gaps", () => {
    const manifest = buildAnCuongFullSourceManifest({
      discovery: {
        schemaVersion: "1.0.0",
        parserVersion: "1.0.0",
        sourceRoot: "https://ancuong.com/catalogue/catalogue-material.html",
        generatedAt: "2026-08-06T00:00:00.000Z",
        categories: [{ name: "Melamine", slug: "melamine", sourceUrl: "https://ancuong.com/melamine.html", catalogueUrls: [] }],
        productUrls: ["https://ancuong.com/melamine/1.html"],
        sitemapUrls: ["https://ancuong.com/sitemap-product.xml"],
        sitemapProductAliases: [
          { url: "https://ancuong.com/melamine/1.html", canonicalUrl: "https://ancuong.com/melamine/1.html", locale: "vi", sourceId: "1" },
          { url: "https://ancuong.com/melamine-panel/1-en.html", canonicalUrl: "https://ancuong.com/melamine/1.html", locale: "en", sourceId: "1" },
          { url: "https://ancuong.com/eco-veneer/2.html", canonicalUrl: "https://ancuong.com/eco-veneer/2.html", locale: "vi", sourceId: "2" },
        ],
        sitemapProductLineUrls: [
          "https://ancuong.com/melamine/van-dam-phu-melamine.html",
          "https://ancuong.com/melamine-panel/melamine-faced-chipboard.html",
        ],
        duplicateUrls: [],
        excludedUrls: [],
      },
      products: [{ sourceUrl: "https://ancuong.com/melamine/1.html", sourceId: "1", normalizedProductCode: "MFC 1" }],
      relationOnlyProducts: [],
      families: [{
        recordType: "family",
        supplier: "an-cuong",
        name: "Ván Dăm Phủ Melamine",
        slug: "an-cuong-van-dam-phu-melamine",
        category: "Melamine",
        specifications: {}, images: [], documents: [],
        sourceUrls: [
          "https://ancuong.com/melamine/van-dam-phu-melamine.html",
          "https://ancuong.com/melamine-panel/melamine-faced-chipboard.html",
        ],
        sourceChecksum: "a".repeat(64),
        editorialStatus: "NEEDS_EDITORIAL_REVIEW",
        seoStatus: "NEEDS_ENRICHMENT",
      }],
      documents: [],
      rejections: [{
        sourceUrl: "https://ancuong.com/eco-veneer/2.html",
        sourceId: "2",
        sourceHash: "b".repeat(64),
        outcome: "invalid",
        reason: "The sitemap URL resolved to the supplier custom 404 page",
      }],
      nonNumericAudit: { generatedAt: "2026-08-06T00:00:00.000Z", listings: [], accounting: [] },
      generatedAt: "2026-08-06T00:00:00.000Z",
    });

    expect(validateFullSourceManifest(manifest)).toEqual([]);
    expect(buildCoverageSummary(manifest)).toEqual(expect.objectContaining({
      coveragePercentage: 100,
      unaccounted: 0,
    }));
    expect(manifest.records).toEqual(expect.arrayContaining([
      expect.objectContaining({ url: "https://ancuong.com/melamine/1.html", outcome: "imported" }),
      expect.objectContaining({ url: "https://ancuong.com/melamine-panel/1-en.html", outcome: "duplicate" }),
      expect.objectContaining({ url: "https://ancuong.com/eco-veneer/2.html", outcome: "removed" }),
      expect.objectContaining({ url: "https://ancuong.com/melamine/van-dam-phu-melamine.html", outcome: "imported" }),
    ]));
  });

  it("uses the verified code when a non-numeric product has no source ID", () => {
    const sourceUrl = "https://ancuong.com/laminate/fine-weave-ivory.html";
    const manifest = buildAnCuongFullSourceManifest({
      discovery: {
        schemaVersion: "1.0.0", parserVersion: "1.0.0", sourceRoot: "https://ancuong.com/catalogue/catalogue-material.html", generatedAt: "2026-08-06T00:00:00.000Z",
        categories: [], productUrls: [sourceUrl], sitemapNonNumericProductUrls: [sourceUrl], duplicateUrls: [], excludedUrls: [],
      },
      products: [{ sourceUrl, sourceId: "", normalizedProductCode: "LK 4617 A" }],
      relationOnlyProducts: [], families: [], documents: [], rejections: [],
      nonNumericAudit: {
        generatedAt: "2026-08-06T00:00:00.000Z",
        listings: [],
        accounting: [{ sourceUrl, canonicalUrl: sourceUrl, status: 200, checksum: "a".repeat(64), productCode: "LK 4617 A", outcome: "imported" }],
      },
      generatedAt: "2026-08-06T00:00:00.000Z",
    });

    expect(manifest.records.find((record) => record.url === sourceUrl)?.recordIds).toEqual(["an-cuong:sku:LK 4617 A"]);
  });
});
