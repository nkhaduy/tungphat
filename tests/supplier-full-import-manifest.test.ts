import { describe, expect, it } from "vitest";
import {
  buildCoverageSummary,
  checksumFullSourceManifest,
  validateFullSourceManifest,
} from "@/lib/catalog/full-import/manifest";
import type { FullSourceManifest } from "@/lib/catalog/full-import/types";

function manifest(records: FullSourceManifest["records"]): FullSourceManifest {
  return {
    schemaVersion: 1,
    supplier: "an-cuong",
    generatedAt: "2026-08-06T00:00:00.000Z",
    records,
    checksum: "",
  };
}

describe("supplier full-source manifests", () => {
  it("counts every explicit outcome as accounted coverage", () => {
    const source = manifest([
      {
        supplier: "an-cuong",
        url: "https://ancuong.com/melamine/1.html",
        canonicalUrl: "https://ancuong.com/melamine/1.html",
        discoveredFrom: "html-link",
        sourceParent: "https://ancuong.com/melamine.html",
        locale: "vi",
        pageType: "product",
        outcome: "imported",
        recordIds: ["an-cuong:1"],
      },
      {
        supplier: "an-cuong",
        url: "https://ancuong.com/melamine-panel/1.html",
        canonicalUrl: "https://ancuong.com/melamine/1.html",
        discoveredFrom: "sitemap",
        sourceParent: "https://ancuong.com/sitemap-product.xml",
        locale: "en",
        pageType: "product",
        outcome: "duplicate",
        reason: "English locale supplements the Vietnamese canonical record",
        recordIds: ["an-cuong:1"],
      },
      {
        supplier: "an-cuong",
        url: "https://ancuong.com/gia-cong-canh-shaker.html",
        discoveredFrom: "sitemap",
        locale: "vi",
        pageType: "category",
        outcome: "non-product",
        reason: "Processing service page without public product records",
      },
    ]);

    expect(buildCoverageSummary(source)).toEqual({
      totalDiscovered: 3,
      accounted: 3,
      unaccounted: 0,
      coveragePercentage: 100,
      outcomes: { imported: 1, duplicate: 1, "non-product": 1 },
    });
    expect(validateFullSourceManifest(source)).toEqual([]);
  });

  it("rejects duplicate source URLs, unaccounted records and outcomes without reasons", () => {
    const source = manifest([
      {
        supplier: "an-cuong",
        url: "https://ancuong.com/melamine/1.html",
        discoveredFrom: "html-link",
        locale: "vi",
        pageType: "product",
      },
      {
        supplier: "an-cuong",
        url: "https://ancuong.com/melamine/1.html",
        discoveredFrom: "sitemap",
        locale: "vi",
        pageType: "product",
        outcome: "invalid",
      },
    ]);

    expect(validateFullSourceManifest(source).map((issue) => issue.code)).toEqual(expect.arrayContaining([
      "DUPLICATE_SOURCE_URL",
      "UNACCOUNTED_SOURCE_URL",
      "OUTCOME_REASON_REQUIRED",
    ]));
  });

  it("produces a stable checksum independent of discovery order and generated time", () => {
    const left = manifest([
      {
        supplier: "an-cuong",
        url: "https://ancuong.com/melamine/2.html",
        discoveredFrom: "sitemap",
        locale: "vi",
        pageType: "product",
        outcome: "imported",
        recordIds: ["2"],
      },
      {
        supplier: "an-cuong",
        url: "https://ancuong.com/melamine/1.html",
        discoveredFrom: "html-link",
        locale: "vi",
        pageType: "product",
        outcome: "imported",
        recordIds: ["1"],
      },
    ]);
    const right = { ...left, generatedAt: "2026-08-07T00:00:00.000Z", records: [...left.records].reverse() };

    expect(checksumFullSourceManifest(left)).toBe(checksumFullSourceManifest(right));
  });
});
