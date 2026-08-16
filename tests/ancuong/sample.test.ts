import { describe, expect, it } from "vitest";
import { paths } from "@/scripts/ancuong/config";
import { runSamplePipeline, selectSampleListings } from "@/scripts/ancuong/sample";
import type { ListingProduct } from "@/scripts/ancuong/types";

function listing(sourceId: string, categorySlug: string, facetKeys: Record<string, string[]> = {}): ListingProduct {
  return {
    sourceId,
    sourceUrl: `https://ancuong.com/${categorySlug}/${sourceId}.html`,
    category: categorySlug,
    categorySlug,
    productCode: sourceId,
    name: sourceId,
    facetKeys,
  };
}

describe("An Cuong representative sample selection", () => {
  it("covers core material groups and source-backed special cases", () => {
    const selected = selectSampleListings([
      listing("1", "melamine"),
      listing("2", "laminate"),
      listing("3", "acrylic"),
      listing("4", "chi-abs"),
      listing("5", "tam-3d", { "Kích Thước (mm)": ["1220*2440", "1220*3050"] }),
      listing("6", "veneer", { "Bộ Sưu Tập": ["Collection A"] }),
      listing("7", "laminate", { "Hiệu Ứng Bề Mặt": ["Synchronized"] }),
      listing("8", "san-go"),
    ], 5);

    expect(selected).toHaveLength(7);
    expect(selected.some((item) => item.categorySlug === "melamine")).toBe(true);
    expect(selected.some((item) => item.categorySlug === "laminate")).toBe(true);
    expect(selected.some((item) => /acrylic|veneer/.test(item.categorySlug))).toBe(true);
    expect(selected.some((item) => /chi-(?:abs|pvc|dan-canh)/.test(item.categorySlug))).toBe(true);
    expect(selected.some((item) => (item.facetKeys["Kích Thước (mm)"]?.length ?? 0) > 1)).toBe(true);
    expect(selected.some((item) => "Bộ Sưu Tập" in item.facetKeys)).toBe(true);
    expect(selected.some((item) => "Hiệu Ứng Bề Mặt" in item.facetKeys)).toBe(true);
  });

  it("keeps discovery, listing, detail and resume state isolated from canonical full-import artifacts", async () => {
    const calls: string[] = [];
    const source = [listing("1", "melamine")];

    await runSamplePipeline({
      dryRun: false,
      resume: false,
      force: false,
      changedOnly: false,
      skipMedia: true,
      verbose: false,
      concurrency: 1,
    }, {
      sampleDiscoveryPath: `${paths.reports}/sample-discovery-manifest.json`,
      sampleListingsPath: "/tmp/ancuong-sample/sample-listings.json",
      sampleDetailsPath: "/tmp/ancuong-sample/sample-details.json",
      sampleListingsStatePath: `${paths.state}/sample-crawl-listings.json`,
      sampleDetailsStatePath: `${paths.state}/sample-crawl-details.json`,
      discover: async (_options, dependencies) => {
        calls.push(`discover:${dependencies.outputPath}`);
        return {} as never;
      },
      crawlListings: async (_options, dependencies) => {
        calls.push(`listings:${dependencies.discoveryPath}:${dependencies.outputPath}:${dependencies.statePath}`);
        return source;
      },
      writeListings: async (path, records) => {
        calls.push(`write:${path}:${records.length}`);
      },
      crawlDetails: async (_options, dependencies) => {
        calls.push(`details:${dependencies.listingsPath}:${dependencies.outputPath}:${dependencies.statePath}`);
        return [];
      },
    });

    expect(calls).toEqual([
      `discover:${paths.reports}/sample-discovery-manifest.json`,
      `listings:${paths.reports}/sample-discovery-manifest.json:/tmp/ancuong-sample/sample-listings.json:${paths.state}/sample-crawl-listings.json`,
      "write:/tmp/ancuong-sample/sample-listings.json:1",
      `details:/tmp/ancuong-sample/sample-listings.json:/tmp/ancuong-sample/sample-details.json:${paths.state}/sample-crawl-details.json`,
    ]);
    expect(calls.join("\n")).not.toContain(`${paths.raw}/listings.json`);
    expect(calls.join("\n")).not.toContain(`${paths.state}/crawl-listings.json`);
    expect(calls.join("\n")).not.toContain(`${paths.state}/crawl-details.json`);
    expect(calls.join("\n")).not.toContain(`${paths.reports}/discovery-manifest.json`);
    expect(calls.join("\n")).not.toContain("data/imports/ancuong/normalized");
    expect(calls.join("\n")).not.toContain("data/imports/ancuong/export");
  });
});
