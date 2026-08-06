import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { buildCoverageSummary, validateFullSourceManifest } from "@/lib/catalog/full-import/manifest";
import type {
  CatalogueRecord,
  DiscoveredSourceUrl,
  FullSourceManifest,
} from "@/lib/catalog/full-import/types";
import type { SupplierColorCode } from "@/lib/catalog/types";
import * as baThanhImportModule from "@/scripts/ba-thanh/import";
import * as baThanhDiscoveryModule from "@/scripts/ba-thanh/discover-full";
import * as baThanhCrawlModule from "@/scripts/ba-thanh/crawl-full";
import { runBaThanhFullImport } from "@/scripts/ba-thanh/full";

type LaminateSource = {
  sourceUrl: string;
  sourceImageUrl: string;
  category: string;
  sourceCategoryLabel: string;
  codeRaw: string;
  codeNormalized: string;
  displayName: string;
  slug: string;
  confident: boolean;
  status: "PARSED";
  heading: string;
  text: string;
  images: string[];
  discoveredAt: string;
  pageChecksum: string;
};

type FullImportApi = {
  buildBaThanhCatalogueRecords?: (options: {
    melamine: SupplierColorCode[];
    laminate: LaminateSource[];
    importedAt: string;
  }) => CatalogueRecord[];
  buildBaThanhFullSourceManifest?: (options: {
    records: CatalogueRecord[];
    discovered: DiscoveredSourceUrl[];
    generatedAt: string;
  }) => FullSourceManifest;
  checksumBaThanhRecords?: (records: CatalogueRecord[]) => string;
};

const fullImport = baThanhImportModule as typeof baThanhImportModule & FullImportApi;
const discoveryValidation = baThanhDiscoveryModule as typeof baThanhDiscoveryModule & {
  validateBaThanhDiscoveryCoverage?: (options: {
    baselineMelamineCodes: string[];
    freshMelamineCodes: string[];
    laminateCodes: string[];
  }) => { melamine: number; laminate: number };
};
const crawlValidation = baThanhCrawlModule as typeof baThanhCrawlModule & {
  validateBaThanhCrawlCoverage?: (items: Array<{ codeNormalized: string; status: string }>) => void;
  classifyBaThanhPage?: (options: {
    url: string;
    html: string;
    status: number;
    knownProductSources: Map<string, string>;
    discoveredAt: string;
  }) => { classification: { outcome: string } };
};
const importedAt = "2026-08-06T13:18:43.855Z";
const laminateGroups = {
  "van-go": ["W7020", "W7393", "W0502", "W0304", "W0504", "W9630", "W7412", "W5220"],
  "don-sac": [
    "P2052", "P2061", "P1150", "P2002", "P1010", "P2001", "P9120", "P3190",
    "P7700", "P7740", "P7790", "P9340", "P4600", "P4640", "P2660", "P9660",
  ],
  "van-da": ["S7403", "S7402", "S7382", "S4600"],
  "van-vai": ["F0022", "F3292", "F3293", "F3294", "F3295"],
} as const;

function displayCode(code: string) {
  return `${code[0]} ${code.slice(1)}`;
}

function laminateSources(): LaminateSource[] {
  return Object.entries(laminateGroups).flatMap(([category, codes]) =>
    codes.map((code) => ({
      sourceUrl: `https://bathanh.com.vn/way-${code.toLowerCase()}`,
      sourceImageUrl: `https://bathanh.com.vn/wp-content/uploads/${code}.jpg`,
      category,
      sourceCategoryLabel: category === "van-go" ? "MÀU VÂN GỖ" : category === "don-sac" ? "MÀU ĐƠN SẮC" : category === "van-da" ? "MÀU VÂN ĐÁ" : "MÀU VÂN VẢI",
      codeRaw: code,
      codeNormalized: code,
      displayName: displayCode(code),
      slug: `${code[0].toLowerCase()}-${code.slice(1).toLowerCase()}`,
      confident: true,
      status: "PARSED" as const,
      heading: `LAMINATE WAY ${code}`,
      text: `LAMINATE WAY ${code}`,
      images: [`https://bathanh.com.vn/wp-content/uploads/${code}-Z.jpg`],
      discoveredAt: importedAt,
      pageChecksum: `page-${code}`,
    })),
  );
}

function melamineCatalog(): SupplierColorCode[] {
  return JSON.parse(
    fs.readFileSync(path.join(process.cwd(), "data/catalogs/ba-thanh.json"), "utf8"),
  ) as SupplierColorCode[];
}

function buildRecords() {
  return fullImport.buildBaThanhCatalogueRecords?.({
    melamine: melamineCatalog(),
    laminate: laminateSources(),
    importedAt,
  });
}

describe("Ba Thanh full catalogue records", () => {
  it("retains the known baseline while accepting newly discovered Melamine and Laminate codes", () => {
    expect(discoveryValidation.validateBaThanhDiscoveryCoverage).toBeTypeOf("function");
    expect(crawlValidation.validateBaThanhCrawlCoverage).toBeTypeOf("function");

    expect(discoveryValidation.validateBaThanhDiscoveryCoverage?.({
      baselineMelamineCodes: ["BT001", "SC001"],
      freshMelamineCodes: ["BT001", "SC001", "SC037DL"],
      laminateCodes: ["W7020", "P1010", "W9999"],
    })).toEqual({ melamine: 3, laminate: 3 });
    expect(() => crawlValidation.validateBaThanhCrawlCoverage?.([
      { codeNormalized: "W7020", status: "PARSED" },
      { codeNormalized: "P1010", status: "PARSED" },
      { codeNormalized: "W9999", status: "PARSED" },
    ])).not.toThrow();
  });

  it("does not classify a corporate page as a family duplicate only because it mentions materials", () => {
    expect(crawlValidation.classifyBaThanhPage).toBeTypeOf("function");
    const result = crawlValidation.classifyBaThanhPage?.({
      url: "https://bathanh.com.vn/lien-he-2",
      html: "<main><h1>Liên hệ</h1><p>Liên hệ để được tư vấn Veneer, Melamine và MDF.</p></main>",
      status: 200,
      knownProductSources: new Map(),
      discoveredAt: importedAt,
    });

    expect(result?.classification.outcome).toBe("non-product");
  });

  it("retains all 233 Melamine codes and all four exact source group counts", () => {
    const records = buildRecords();
    const melamine = records?.filter(
      (record) => record.recordType === "sku" && record.productFamily === "Melamine",
    );

    expect(melamine).toHaveLength(233);
    expect(Object.fromEntries(
      ["van-go", "don-sac", "van-da", "van-vai"].map((group) => [
        group,
        melamine?.filter((record) => record.attributes.sourceGroup === group).length,
      ]),
    )).toEqual({ "van-go": 153, "don-sac": 62, "van-da": 13, "van-vai": 5 });
  });

  it("imports all 33 verified public WAY Laminate codes as real SKU records", () => {
    const records = buildRecords();
    const laminate = records?.filter(
      (record) => record.recordType === "sku" && record.productFamily === "WAY Laminate",
    );
    const expectedCodes = Object.values(laminateGroups).flat();

    expect(laminate).toHaveLength(33);
    expect(laminate?.map((record) => record.code).sort()).toEqual([...expectedCodes].sort());
    expect(laminate?.every((record) => record.canonicalSourceUrl.includes(`/way-${record.code.toLowerCase()}`))).toBe(true);
  });

  it("rejects supplier-page images that visibly belong to a different Melamine code", () => {
    const source = laminateSources().find((item) => item.codeNormalized === "W0502")!;
    const records = fullImport.buildBaThanhCatalogueRecords?.({
      melamine: [],
      laminate: [{
        ...source,
        sourceImageUrl: "https://bathanh.com.vn/wp-content/uploads/BT-163.jpg",
        images: [
          "https://bathanh.com.vn/wp-content/uploads/SC-017-MW.jpg",
          "https://bathanh.com.vn/wp-content/uploads/W0502-Z.jpg",
        ],
      }],
      importedAt,
    });

    expect(records?.find((record) => record.recordType === "sku")?.images.map((image) => image.sourceUrl)).toEqual([
      "https://bathanh.com.vn/wp-content/uploads/W0502-Z.jpg",
    ]);
  });

  it("uses family records for public board specifications instead of thickness-derived fake SKUs", () => {
    const records = buildRecords();
    const families = records?.filter((record) => record.recordType === "family");
    const skus = records?.filter((record) => record.recordType === "sku");

    expect(families?.map((record) => record.slug).sort()).toEqual([
      "chi-dan-canh-veneer-pvc",
      "van-go-ghep",
      "van-hdf",
      "van-mdf",
      "van-mdf-chong-am-hmr",
      "van-okal-mfc",
      "van-phu-giay",
      "van-phu-melamine",
      "van-phu-veneer",
      "van-san-dongwha-natus",
      "van-san-dongwha-sanus",
    ]);
    expect(families?.every((record) => !("code" in record))).toBe(true);
    expect(skus?.some((record) => /MDF(?:3|5|9|12|15|17|25)MM/.test(record.normalizedCode))).toBe(false);

    const mdf = families?.find((record) => record.slug === "van-mdf");
    expect(mdf?.specifications).toEqual(expect.objectContaining({
      availableThicknessesMm: [3, 5, 9, 12, 15, 17, 25],
      thicknessRangeMm: [2.5, 25],
    }));
    const joined = families?.find((record) => record.slug === "van-go-ghep");
    expect(joined?.specifications).toEqual(expect.objectContaining({
      woodSpecies: ["Cao su", "Thông", "Tràm", "Xoan mộc"],
      grades: ["AA", "AB", "AC"],
      moisturePercent: [8, 12],
      glueStandard: "F4",
    }));
    const okal = families?.find((record) => record.slug === "van-okal-mfc");
    expect(okal?.specifications).toEqual(expect.objectContaining({
      densityKgM3: [650, 750],
      formatsMm: ["1220 x 2440", "1830 x 2440"],
      availableThicknessesMm: [17, 18, 25],
    }));
  });

  it("adds the official 24-page Melamine and 14-page Dongwha catalogue assets", () => {
    const documents = buildRecords()?.filter((record) => record.recordType === "document");

    expect(documents).toHaveLength(2);
    expect(documents?.map((record) => ({ slug: record.slug, pages: record.images.length }))).toEqual([
      { slug: "catalogue-melamine-ba-thanh-2025", pages: 24 },
      { slug: "catalogue-van-san-dongwha", pages: 14 },
    ]);
    expect(documents?.flatMap((record) => record.images).every((image) => image.rightsStatus === "UNCONFIRMED")).toBe(true);
    expect(documents?.flatMap((record) => record.documents).every((document) => document.sourceUrl.startsWith("https://drive.google.com/file/d/"))).toBe(true);
  });

  it("keeps supplier contact details out of normalized Tung Phat catalogue records", () => {
    const serialized = JSON.stringify(buildRecords());

    expect(serialized).not.toMatch(/3970[.\s-]*1399|0986[.\s-]*94[.\s-]*95[.\s-]*86|group@bathanh/i);
  });
});

describe("Ba Thanh full source accounting", () => {
  it("accounts every discovered URL exactly once with stable 100% coverage", () => {
    const records = buildRecords();
    const discoveredWithDuplicates: DiscoveredSourceUrl[] = [
      ...(records ?? []).flatMap((record) => record.sourceUrls.map((url) => ({
        supplier: "ba-thanh" as const,
        url,
        discoveredFrom: record.recordType === "document" ? "catalogue-document" as const : "sitemap" as const,
        locale: "vi" as const,
        pageType: record.recordType === "sku" ? "product" as const : record.recordType === "family" ? "product-family" as const : "catalogue" as const,
      }))),
      {
        supplier: "ba-thanh",
        url: "https://bathanh.com.vn/robots.txt",
        discoveredFrom: "html-link",
        locale: "unknown",
        pageType: "unknown",
        classification: {
          outcome: "non-product",
          reason: "Fetched robots policy is discovery infrastructure.",
          evidence: { kind: "infrastructure", status: 200, checksum: "robots-checksum" },
        },
      },
      {
        supplier: "ba-thanh",
        url: "https://bathanh.com.vn/sitemap_index.xml",
        discoveredFrom: "sitemap",
        locale: "unknown",
        pageType: "unknown",
        classification: {
          outcome: "non-product",
          reason: "Fetched sitemap index is discovery infrastructure.",
          evidence: { kind: "infrastructure", status: 200, checksum: "sitemap-checksum" },
        },
      },
      {
        supplier: "ba-thanh",
        url: "https://bathanh.com.vn/san-pham",
        discoveredFrom: "sitemap",
        locale: "vi",
        pageType: "collection",
      },
      {
        supplier: "ba-thanh",
        url: "https://bathanh.com.vn/portfolio",
        discoveredFrom: "sitemap",
        locale: "vi",
        pageType: "collection",
      },
    ];
    const discovered = [...new Map(
      discoveredWithDuplicates.map((item) => [new URL(item.url).toString(), item]),
    ).values()] as unknown as DiscoveredSourceUrl[];
    const manifest = records && fullImport.buildBaThanhFullSourceManifest?.({ records, discovered, generatedAt: importedAt });

    expect(manifest).toBeDefined();
    expect(validateFullSourceManifest(manifest!)).toEqual([]);
    expect(buildCoverageSummary(manifest!)).toEqual(expect.objectContaining({
      totalDiscovered: discovered.length,
      accounted: discovered.length,
      unaccounted: 0,
      coveragePercentage: 100,
    }));
    expect(new Set(manifest?.records.map((record) => record.url)).size).toBe(discovered.length);
    expect(manifest?.records.filter((record) => [
      "https://bathanh.com.vn/san-pham",
      "https://bathanh.com.vn/portfolio",
    ].includes(record.url)).every((record) => record.outcome === "imported" && record.recordIds?.length)).toBe(true);
  });

  it("does not call an unclassified page non-product without crawl evidence", () => {
    const records = buildRecords()!;
    const url = "https://bathanh.com.vn/public-page-without-classification";
    const manifest = fullImport.buildBaThanhFullSourceManifest?.({
      records,
      generatedAt: importedAt,
      discovered: [{
        supplier: "ba-thanh",
        url,
        discoveredFrom: "sitemap",
        locale: "vi",
        pageType: "unknown",
      }],
    });

    expect(manifest?.records[0]).toEqual(expect.objectContaining({ url, outcome: undefined }));
    expect(buildCoverageSummary(manifest!)).toEqual(expect.objectContaining({
      accounted: 0,
      unaccounted: 1,
      coveragePercentage: 0,
    }));
  });

  it("associates evidenced duplicate catalogue routes and evidenced non-product pages", () => {
    const records = buildRecords()!;
    const duplicateUrl = "https://bathanh.com.vn/map-ma-melamine/van-phu-verneer";
    const nonProductUrl = "https://bathanh.com.vn/lien-he-2";
    const discovered = [
      {
        supplier: "ba-thanh",
        url: duplicateUrl,
        discoveredFrom: "sitemap",
        locale: "vi",
        pageType: "product-family",
        classification: {
          outcome: "duplicate",
          reason: "Fetched page describes the same Veneer-faced board family.",
          canonicalUrl: "https://bathanh.com.vn/portfolio/van-phu-veneer",
          evidence: { kind: "http-html", status: 200, checksum: "duplicate-page-checksum" },
        },
      },
      {
        supplier: "ba-thanh",
        url: nonProductUrl,
        discoveredFrom: "sitemap",
        locale: "vi",
        pageType: "unknown",
        classification: {
          outcome: "non-product",
          reason: "Fetched page is the supplier contact page and contains no catalogue record.",
          evidence: { kind: "http-html", status: 200, checksum: "contact-page-checksum" },
        },
      },
    ] as unknown as DiscoveredSourceUrl[];
    const manifest = fullImport.buildBaThanhFullSourceManifest?.({ records, discovered, generatedAt: importedAt });
    const duplicate = manifest?.records.find((record) => record.url === duplicateUrl);
    const nonProduct = manifest?.records.find((record) => record.url === nonProductUrl);

    expect(duplicate).toEqual(expect.objectContaining({
      outcome: "duplicate",
      recordIds: ["ba-thanh:family:van-phu-veneer"],
    }));
    expect(nonProduct).toEqual(expect.objectContaining({
      outcome: "non-product",
      reason: expect.stringContaining("contact page"),
    }));
    expect(validateFullSourceManifest(manifest!)).toEqual([]);
  });

  it("keeps importer output unchanged when a fresh discovery only changes timestamps", async () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "ba-thanh-idempotency-"));
    try {
      const importDir = path.join(tempRoot, "data/imports/ba-thanh");
      fs.mkdirSync(importDir, { recursive: true });
      fs.mkdirSync(path.join(tempRoot, "data/catalogs"), { recursive: true });
      fs.mkdirSync(path.join(tempRoot, "public/catalog"), { recursive: true });
      fs.copyFileSync("data/catalogs/ba-thanh.json", path.join(tempRoot, "data/catalogs/ba-thanh.json"));
      for (const filename of ["full-discovery.json", "discovered-codes.json", "discovered-laminate-codes.json"]) {
        fs.copyFileSync(path.join("data/imports/ba-thanh", filename), path.join(importDir, filename));
      }
      const discoveryFixturePath = path.join(importDir, "full-discovery.json");
      const discoveryFixture = JSON.parse(fs.readFileSync(discoveryFixturePath, "utf8"));
      const previousManifest = JSON.parse(fs.readFileSync("data/imports/ba-thanh/full-source-manifest.json", "utf8"));
      const previousByUrl = new Map(previousManifest.records.map((record: { url: string }) => [record.url, record]));
      discoveryFixture.discovered = discoveryFixture.discovered.map((item: DiscoveredSourceUrl) => {
        const previous = previousByUrl.get(item.url) as { outcome?: string; reason?: string } | undefined;
        if (previous?.outcome !== "non-product") return item;
        return {
          ...item,
          classification: {
            outcome: "non-product",
            reason: previous.reason ?? "Fixture page was previously classified as non-product.",
            evidence: { kind: "http-html", status: 200, checksum: `fixture-${item.url}` },
          },
        };
      });
      fs.writeFileSync(discoveryFixturePath, `${JSON.stringify(discoveryFixture, null, 2)}\n`);
      fs.symlinkSync(path.join(process.cwd(), "public/catalog/ba-thanh"), path.join(tempRoot, "public/catalog/ba-thanh"));

      const first = await runBaThanhFullImport({ root: tempRoot });
      const firstFile = fs.readFileSync(path.join(importDir, "full-records.json"), "utf8");
      const discoveryPath = path.join(importDir, "full-discovery.json");
      const laminatePath = path.join(importDir, "discovered-laminate-codes.json");
      const discovery = JSON.parse(fs.readFileSync(discoveryPath, "utf8"));
      const laminate = JSON.parse(fs.readFileSync(laminatePath, "utf8"));
      discovery.discoveredAt = "2026-08-07T00:00:00.000Z";
      for (const item of laminate) item.discoveredAt = discovery.discoveredAt;
      fs.writeFileSync(discoveryPath, `${JSON.stringify(discovery, null, 2)}\n`);
      fs.writeFileSync(laminatePath, `${JSON.stringify(laminate, null, 2)}\n`);

      const second = await runBaThanhFullImport({ root: tempRoot });
      const secondFile = fs.readFileSync(path.join(importDir, "full-records.json"), "utf8");

      expect(first?.recordFile.checksum).toBe(second?.recordFile.checksum);
      expect(second?.report).toEqual(expect.objectContaining({ created: 0, updated: 0 }));
      expect(second?.report.unchanged).toBe(second?.report.totalImported);
      expect(secondFile).toBe(firstFile);
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });
});
