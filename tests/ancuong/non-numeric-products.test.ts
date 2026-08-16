import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { reconcileNonNumericProductPages, run } from "@/scripts/ancuong/crawl-non-numeric";
import type { CliOptions } from "@/scripts/ancuong/types";

const options: CliOptions = { dryRun: false, resume: false, force: false, concurrency: 2, changedOnly: false, skipMedia: false, verbose: false };

function productHtml(name: string, code: string): string {
  return `
    <main id="product-page">
      <div class="breadcrumb"><a href="/laminate.html">Laminate</a></div>
      <div class="title-info"><h1>${name}</h1><p>Product Code: <strong>${code}</strong></p></div>
      <section class="product-details"><div class="details-pic" data-full="https://ancuong.com/products/products-full/${code}.jpg"></div></section>
    </main>
  `;
}

describe("An Cuong non-numeric sitemap products", () => {
  it("deduplicates locale routes by verified product code and prefers a current category route", () => {
    const result = reconcileNonNumericProductPages([
      {
        sourceUrl: "https://ancuong.com/laminate-panel/fine-weave-ivory-en.html",
        status: 200,
        contentHash: "a".repeat(64),
        html: productHtml("Fine Weave Ivory", "LK 4617 A"),
      },
      {
        sourceUrl: "https://ancuong.com/laminate/fine-weave-ivory.html",
        status: 200,
        contentHash: "b".repeat(64),
        html: productHtml("Fine Weave Ivory", "LK 4617 A"),
      },
    ], new Set(["laminate"]), "2026-08-06T00:00:00.000Z");

    expect(result.listings).toEqual([
      expect.objectContaining({
        sourceUrl: "https://ancuong.com/laminate/fine-weave-ivory.html",
        sourceId: "",
        productCode: "LK 4617 A",
        categorySlug: "laminate",
      }),
    ]);
    expect(result.accounting).toEqual(expect.arrayContaining([
      expect.objectContaining({
        sourceUrl: "https://ancuong.com/laminate/fine-weave-ivory.html",
        outcome: "imported",
      }),
      expect.objectContaining({
        sourceUrl: "https://ancuong.com/laminate-panel/fine-weave-ivory-en.html",
        canonicalUrl: "https://ancuong.com/laminate/fine-weave-ivory.html",
        outcome: "duplicate",
      }),
    ]));
  });

  it("accounts a custom 404 response as invalid instead of creating a product", () => {
    const sourceUrl = "https://ancuong.com/laminate-flooring/=T10&%22-en%22.html";
    const result = reconcileNonNumericProductPages([{
      sourceUrl,
      status: 200,
      contentHash: "c".repeat(64),
      html: "<html><head><title>404</title></head><body>Page not found</body></html>",
    }], new Set(["laminate-flooring"]), "2026-08-06T00:00:00.000Z");

    expect(result.listings).toEqual([]);
    expect(result.accounting).toEqual([
      expect.objectContaining({
        sourceUrl,
        outcome: "invalid",
        reason: "The sitemap URL resolved to a non-product page",
      }),
    ]);
  });

  it("writes an accounted audit for every discovered non-numeric sitemap URL", async () => {
    const directory = await mkdtemp(join(tmpdir(), "ancuong-non-numeric-"));
    const discoveryPath = join(directory, "discovery.json");
    const outputPath = join(directory, "audit.json");
    const cacheDirectory = join(directory, "cache");
    const urls = [
      "https://ancuong.com/laminate/fine-weave-ivory.html",
      "https://ancuong.com/laminate-flooring/=T10&%22-en%22.html",
    ];
    await writeFile(discoveryPath, JSON.stringify({
      categories: [{ slug: "laminate" }],
      sitemapNonNumericProductUrls: urls,
    }));

    const result = await run(options, {
      discoveryPath,
      outputPath,
      cacheDirectory,
      now: () => "2026-08-06T00:00:00.000Z",
      fetchText: async (url) => ({
        body: url.includes("laminate-flooring") ? "<title>404</title>" : productHtml("Fine Weave Ivory", "LK 4617 A"),
        status: 200,
        contentHash: url.includes("laminate-flooring") ? "c".repeat(64) : "b".repeat(64),
      }),
    });

    expect(result.accounting).toHaveLength(urls.length);
    expect(result.listings).toHaveLength(1);
    expect(JSON.parse(await readFile(outputPath, "utf8"))).toEqual(result);
  });

  it("resumes from the local page cache without requesting the source again", async () => {
    const directory = await mkdtemp(join(tmpdir(), "ancuong-non-numeric-resume-"));
    const discoveryPath = join(directory, "discovery.json");
    const outputPath = join(directory, "audit.json");
    const cacheDirectory = join(directory, "cache");
    const sourceUrl = "https://ancuong.com/laminate/fine-weave-ivory.html";
    await writeFile(discoveryPath, JSON.stringify({
      categories: [{ slug: "laminate" }],
      sitemapNonNumericProductUrls: [sourceUrl],
    }));
    await run(options, {
      discoveryPath,
      outputPath,
      cacheDirectory,
      fetchText: async () => ({ body: productHtml("Fine Weave Ivory", "LK 4617 A"), status: 200, contentHash: "b".repeat(64) }),
    });

    const resumed = await run({ ...options, resume: true }, {
      discoveryPath,
      outputPath,
      cacheDirectory,
      fetchText: async () => { throw new Error("network should not be used"); },
    });

    expect(resumed.listings).toHaveLength(1);
    expect(resumed.accounting[0]).toEqual(expect.objectContaining({ sourceUrl, outcome: "imported" }));
  });
});
