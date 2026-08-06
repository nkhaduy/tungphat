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
import { buildThanhThuyFullArtifacts, buildThanhThuyFullSummary } from "@/scripts/thanh-thuy/full";
import type { ImportReport, SourceManifest, ThanhThuyCatalog } from "@/scripts/thanh-thuy/types";
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

  it("stops at the declared WordPress total when the final page is exactly full", async () => {
    const source = Array.from({ length: 200 }, (_, index) => ({ id: index + 1 }));
    const pages: number[] = [];
    const result = await collectWordPressProducts(async ({ page, pageSize }) => {
      pages.push(page);
      const start = (page - 1) * pageSize;
      return { records: source.slice(start, start + pageSize) as never[], total: source.length };
    });

    expect(pages).toEqual([1, 2]);
    expect(result.records).toHaveLength(200);
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
    const reconciliation = reconcileThanhThuyProductSources(
      catalog.products,
      sourceManifest.productUrls,
      sourceManifest.productUrlEvidence,
    );

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
    expect(Object.keys(sourceManifest.productUrlEvidence)).toHaveLength(348);
    expect(
      fullManifest.records
        .filter((record) => record.pageType === "product")
        .every((record) => record.sourceParent === sourceManifest.productUrlSources[record.url]),
    ).toBe(true);
    const redirected = fullManifest.records.filter((record) => record.outcome === "redirected");
    expect(redirected).toHaveLength(322);
    expect(redirected.every((record) =>
      record.status === 200 &&
      record.canonicalUrl === sourceManifest.productUrlEvidence[record.url]?.canonicalUrl &&
      sourceManifest.productUrlEvidence[record.url]?.redirects.length > 0
    )).toBe(true);
    expect(new Set(fullManifest.records.map((record) => record.url)).size).toBe(fullManifest.records.length);
  });

  it("derives change and coverage totals instead of hardcoding the generated report", () => {
    const artifacts = buildThanhThuyFullArtifacts({ sourceManifest, catalog });
    const importReport = {
      schemaVersion: 1,
      importedAt: "2026-08-06T00:00:00.000Z",
      dryRun: false,
      sourceProducts: 348,
      catalogProducts: 348,
      previousRecords: 350,
      categories: 26,
      uniqueSourceImages: 341,
      localImages: 286,
      created: 2,
      updated: 3,
      unchanged: 343,
      removed: 4,
      statuses: {},
      catalogChecksum: catalog.checksum,
      backup: null,
    } as unknown as ImportReport;
    const summary = buildThanhThuyFullSummary({
      sourceManifest,
      catalog,
      importReport,
      ...artifacts,
    });

    expect(summary.previousRecords).toBe(350);
    expect(summary.newlyDiscoveredProducts).toBe(2);
    expect(summary.updated).toBe(3);
    expect(summary.unchanged).toBe(343);
    expect(summary.removedFromSource).toBe(4);
    expect(summary.coveragePercentage).toBe(100);
  });

  it("routes the full npm command through one orchestrator so dry-run applies to every stage", () => {
    const packageJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8")) as { scripts: Record<string, string> };
    expect(packageJson.scripts["catalog:thanh-thuy:import:full"]).toBe("tsx scripts/thanh-thuy/run-full.ts");
  });
});
