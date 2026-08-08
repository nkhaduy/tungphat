import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildProductLineFamilyRecords, enrichProductLineFamilyRecords, parseProductLinePage, run } from "@/scripts/ancuong/crawl-product-lines";
import type { CliOptions, RawProductDetail } from "@/scripts/ancuong/types";

const viUrl = "https://ancuong.com/melamine/van-dam-phu-melamine.html";
const enUrl = "https://ancuong.com/melamine-panel/melamine-faced-chipboard-mfc.html";
const options: CliOptions = { dryRun: false, resume: false, force: false, concurrency: 2, changedOnly: false, skipMedia: false, verbose: false };

function page(locale: "vi" | "en"): string {
  const vi = locale === "vi";
  return `
    <link rel="alternate" href="${viUrl}" hreflang="vi-vn">
    <link rel="alternate" href="${enUrl}" hreflang="en-us">
    <main id="product-page">
      <h1>${vi ? "Ván Dăm Phủ Melamine" : "Melamine Faced Chipboard"}</h1>
      <div class="box-content">Marketing description</div>
      <div class="list-features"><h3>${vi ? "Tính năng" : "Features"}</h3><div class="features-item" data-tip="Dễ thi công"><img src="feature.png"></div></div>
      <div class="list-features"><h3>${vi ? "Tiêu chuẩn" : "Standards"}</h3><div class="features-item" data-tip="ENF"><img src="standard.png"></div></div>
      <div class="details-pic"><img src="https://ancuong.com/pictures/files/products/dong-san-pham/melamine/melamine-faced-chipboard.jpg"></div>
      <table><tr class="t-head-top"><td class="t-left">Kích thước</td><td class="t-num">18</td></tr><tr><td class="t-left">1220 x 2440</td><td>o</td></tr></table>
    </main>
  `;
}

describe("An Cuong product-line families", () => {
  it("merges Vietnamese and English product-line pages into one factual family record", () => {
    const records = buildProductLineFamilyRecords([
      parseProductLinePage(page("en"), enUrl, "a".repeat(64)),
      parseProductLinePage(page("vi"), viUrl, "b".repeat(64)),
    ]);

    expect(records).toEqual([
      expect.objectContaining({
        recordType: "family",
        supplier: "an-cuong",
        name: "Ván Dăm Phủ Melamine",
        category: "Melamine",
        sourceUrls: [enUrl, viUrl],
        specifications: {
          features: ["Dễ thi công"],
          standards: ["ENF"],
          dimensionThicknessMatrix: [{ dimension: "1220x2440", thicknesses: ["18"] }],
        },
        images: [expect.objectContaining({
          sourceUrl: "https://ancuong.com/pictures/files/products/dong-san-pham/melamine/melamine-faced-chipboard.jpg",
          mediaType: "product",
          rightsStatus: "UNCONFIRMED",
        })],
        editorialStatus: "NEEDS_EDITORIAL_REVIEW",
        seoStatus: "NEEDS_ENRICHMENT",
      }),
    ]);
  });

  it("crawls every product-line sitemap URL and writes locale-deduplicated family records", async () => {
    const directory = await mkdtemp(join(tmpdir(), "ancuong-product-lines-"));
    const discoveryPath = join(directory, "discovery.json");
    const outputPath = join(directory, "families.json");
    const cacheDirectory = join(directory, "cache");
    await writeFile(discoveryPath, JSON.stringify({ sitemapProductLineUrls: [viUrl, enUrl] }));

    const records = await run(options, {
      discoveryPath,
      outputPath,
      cacheDirectory,
      fetchText: async (url) => ({ body: page(url === viUrl ? "vi" : "en"), status: 200, contentHash: url === viUrl ? "b".repeat(64) : "a".repeat(64) }),
    });

    expect(records).toHaveLength(1);
    expect(JSON.parse(await readFile(outputPath, "utf8"))).toEqual(records);
  });

  it("uses the reciprocal locale link when one page exposes a broken category-level alternate", () => {
    const viPage = parseProductLinePage(page("vi").replace(
      `<link rel="alternate" href="${viUrl}" hreflang="vi-vn">`,
      `<link rel="alternate" href="https://ancuong.com/chi-dan-canh-pvc.html" hreflang="vi-vn">`,
    ), viUrl, "b".repeat(64));
    const enPage = parseProductLinePage(page("en"), enUrl, "a".repeat(64));

    expect(buildProductLineFamilyRecords([viPage, enPage])).toHaveLength(1);
  });

  it("enriches family formats from factual product-line matrices embedded on product pages", () => {
    const records = buildProductLineFamilyRecords([
      parseProductLinePage(page("vi"), viUrl, "b".repeat(64)),
    ]);
    const detail = {
      sourceUrl: "https://ancuong.com/melamine/303000078.html",
      sourceId: "303000078",
      category: "Melamine",
      categorySlug: "melamine",
      name: "Milky White",
      productCode: "MFC - MS 106 SH",
      facets: {}, galleryUrls: [], relatedProducts: [], sameColorProducts: [], applicationProducts: [],
      productLines: [{
        name: "Ván Dăm Phủ Melamine",
        sourceUrl: viUrl,
        features: ["Độ bền bề mặt cao"],
        standards: ["E1"],
        dimensionThicknessMatrix: [{ dimension: "1220x2440", thicknesses: ["9", "18"] }],
        technicalWarnings: [],
      }],
      sourceHash: "c".repeat(64),
      discoveredAt: "2026-08-06T00:00:00.000Z",
      fetchedAt: "2026-08-06T00:01:00.000Z",
    } satisfies RawProductDetail;

    expect(enrichProductLineFamilyRecords(records, [detail])[0]?.specifications).toEqual({
      features: ["Dễ thi công", "Độ bền bề mặt cao"],
      standards: ["E1", "ENF"],
      dimensionThicknessMatrix: [{ dimension: "1220x2440", thicknesses: ["9", "18"] }],
    });
  });

  it("keeps family slugs unique when the supplier reuses the same display name", () => {
    const html = `<main id="product-page"><h1>Chỉ PVC</h1></main>`;
    const records = buildProductLineFamilyRecords([
      parseProductLinePage(html, "https://ancuong.com/chi-dan-canh-pvc/chi-foil.html", "a".repeat(64)),
      parseProductLinePage(html, "https://ancuong.com/chi-dan-canh-pvc/chi-pvc.html", "b".repeat(64)),
    ]);

    expect(new Set(records.map((record) => record.slug)).size).toBe(records.length);
  });
});
