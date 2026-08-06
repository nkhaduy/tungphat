import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { collectWordPressProducts } from "@/scripts/thanh-thuy/crawl";
import {
  buildThanhThuyCatalogueRecords,
  buildThanhThuyFullSourceManifest,
  reconcileThanhThuyProductSources,
  THANH_THUY_DOCUMENT_SOURCES,
} from "@/scripts/thanh-thuy/full-import";
import type { SourceManifest, ThanhThuyCatalog } from "@/scripts/thanh-thuy/types";
import { buildCoverageSummary, validateFullSourceManifest } from "@/lib/catalog/full-import/manifest";

const root = process.cwd();

describe("Thanh Thuy full source pagination", () => {
  it("collects every WordPress REST page through the final partial page", async () => {
    const source = Array.from({ length: 348 }, (_, index) => ({
      id: index + 1,
      slug: `product-${index + 1}`,
      link: `https://www.gothanhthuy.com/product/melamine/product-${index + 1}/`,
    }));
    const pages: number[] = [];

    const result = await collectWordPressProducts(async ({ page, pageSize }) => {
      pages.push(page);
      const start = (page - 1) * pageSize;
      return source.slice(start, start + pageSize) as never[];
    });

    expect(pages).toEqual([1, 2, 3, 4]);
    expect(result.records).toHaveLength(348);
    expect(result.pagesFetched).toBe(4);
  });
});

describe("Thanh Thuy full catalogue records", () => {
  const catalog = JSON.parse(
    fs.readFileSync(path.join(root, "data/catalogs/thanh-thuy/catalog.json"), "utf8"),
  ) as ThanhThuyCatalog;

  it("represents code-less public products as families without invented codes", () => {
    const records = buildThanhThuyCatalogueRecords(catalog);
    const skuRecords = records.filter((record) => record.recordType === "sku");
    const familyRecords = records.filter((record) => record.recordType === "family");

    expect(catalog.products).toHaveLength(348);
    expect(skuRecords).toHaveLength(339);
    expect(familyRecords).toHaveLength(9);
    expect(familyRecords.every((record) => !("code" in record))).toBe(true);
    expect(familyRecords.map((record) => record.sourceUrls[0])).toEqual(
      catalog.products.filter((product) => !product.code).map((product) => product.sourceUrl),
    );
  });

  it("adds four public catalogue pages and Color Map as source-only document records", () => {
    const records = buildThanhThuyCatalogueRecords(catalog);
    const documents = records.filter((record) => record.recordType === "document");

    expect(THANH_THUY_DOCUMENT_SOURCES).toHaveLength(5);
    expect(documents).toHaveLength(5);
    expect(documents.every((record) => record.needsEditorialReview)).toBe(true);
    expect(documents.every((record) => record.seoStatus === "SOURCE_ONLY")).toBe(true);
    expect(documents.map((record) => record.sourceUrls[0])).toEqual(
      THANH_THUY_DOCUMENT_SOURCES.map((source) => source.url),
    );
  });
});

describe("Thanh Thuy complete source accounting", () => {
  const sourceManifest = JSON.parse(
    fs.readFileSync(path.join(root, "data/imports/thanh-thuy/source-manifest.json"), "utf8"),
  ) as SourceManifest;
  const catalog = JSON.parse(
    fs.readFileSync(path.join(root, "data/catalogs/thanh-thuy/catalog.json"), "utf8"),
  ) as ThanhThuyCatalog;

  it("reconciles every sitemap product URL to exactly one public API product", () => {
    const reconciliation = reconcileThanhThuyProductSources(catalog.products, sourceManifest.productUrls);

    expect(sourceManifest.productUrls).toHaveLength(348);
    expect(reconciliation.apiOnly).toEqual([]);
    expect(reconciliation.sitemapOnly).toEqual([]);
    expect(reconciliation.matched).toBe(348);
  });

  it("accounts for every discovered URL with a stable full-source manifest", () => {
    const fullManifest = buildThanhThuyFullSourceManifest({
      sourceManifest,
      catalog,
      generatedAt: "2026-08-06T00:00:00.000Z",
    });
    const coverage = buildCoverageSummary(fullManifest);

    expect(validateFullSourceManifest(fullManifest)).toEqual([]);
    expect(coverage.unaccounted).toBe(0);
    expect(coverage.coveragePercentage).toBe(100);
    expect(fullManifest.records.filter((record) => record.pageType === "product")).toHaveLength(348);
    expect(Object.keys(sourceManifest.productUrlSources)).toHaveLength(348);
    expect(
      fullManifest.records
        .filter((record) => record.pageType === "product")
        .every((record) => record.sourceParent === sourceManifest.productUrlSources[record.url]),
    ).toBe(true);
    expect(new Set(fullManifest.records.map((record) => record.url)).size).toBe(fullManifest.records.length);
  });
});
