import { describe, expect, it } from "vitest";
import {
  getThanhThuyMerchandisingScore,
  searchThanhThuyItems,
} from "@/lib/catalog/thanh-thuy-search";

const items = [
  {
    slug: "acrylic-am-204",
    code: "AM 204",
    name: "AM 204 Sugar Glitter",
    categorySlug: "acrylic",
    categoryName: "Acrylic",
    seriesName: "Glass Series",
    image: "/catalog/acrylic.webp",
    imageAlt: "AM 204",
    seoStatus: "NEEDS_ENRICHMENT",
  },
  {
    slug: "laminate-le-004g",
    code: "LE 004G",
    name: "LE 004G White",
    categorySlug: "laminate",
    categoryName: "Laminate",
    seriesName: "LE Đơn Sắc",
    image: "/catalog/laminate.webp",
    imageAlt: "LE 004G",
    seoStatus: "NEEDS_ENRICHMENT",
  },
  {
    slug: "melamine-142",
    code: "142",
    name: "Mã Melamine 142",
    categorySlug: "melamine",
    categoryName: "Melamine",
    seriesName: "Melamine Vân Gỗ",
    image: "/catalog/melamine.webp",
    imageAlt: "Mã Melamine 142",
    seoStatus: "READY_TO_INDEX",
  },
] as const;

describe("Thanh Thuy search and merchandising", () => {
  it("puts high-intent Melamine before source/A-Z order by default", () => {
    const results = searchThanhThuyItems([...items], "", "");

    expect(results.map((item) => item.code)).toEqual([
      "142",
      "LE 004G",
      "AM 204",
    ]);
  });

  it("puts an exact normalized code before merchandising priority", () => {
    const results = searchThanhThuyItems([...items], "le004g", "");

    expect(results[0]?.code).toBe("LE 004G");
  });

  it("exposes a transparent score and uses code order only as final tie-break", () => {
    expect(getThanhThuyMerchandisingScore(items[2])).toBeGreaterThan(
      getThanhThuyMerchandisingScore(items[0]),
    );

    const tied = searchThanhThuyItems(
      [
        { ...items[0], code: "ZZ 02", name: "Mẫu hai", slug: "mau-hai" },
        { ...items[0], code: "AA 01", name: "Mẫu một", slug: "mau-mot" },
      ],
      "",
      "",
    );
    expect(tied.map((item) => item.code)).toEqual(["AA 01", "ZZ 02"]);
  });
});
