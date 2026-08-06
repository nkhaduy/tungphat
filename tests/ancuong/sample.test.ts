import { describe, expect, it } from "vitest";
import { selectSampleListings } from "@/scripts/ancuong/sample";
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
});
