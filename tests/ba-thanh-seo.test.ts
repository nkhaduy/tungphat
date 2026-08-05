import { describe, expect, it } from "vitest";
import {
  baThanhCategories,
  getBaThanhCode,
  getBaThanhCodes,
  getBaThanhHubFeaturedCodes,
  getBaThanhIndexableCodes,
  searchBaThanhCodes,
} from "@/lib/catalog/ba-thanh";
import { buildBaThanhCodeMetadata, buildBaThanhProductSchema, getBaThanhSitemapPaths } from "@/lib/catalog/ba-thanh-seo";

describe("Ba Thanh catalogue repository", () => {
  it("loads every verified source code without collapsing suffix variants", () => {
    expect(getBaThanhCodes()).toHaveLength(233);
    expect(getBaThanhCode("sc-018m")?.codeNormalized).toBe("SC018M");
    expect(getBaThanhCode("sc-018mw")?.codeNormalized).toBe("SC018MW");
  });

  it("keeps the four discovered categories and their verified counts", () => {
    expect(baThanhCategories.map((category) => [category.slug, category.count])).toEqual([
      ["van-go", 153],
      ["don-sac", 62],
      ["van-da", 13],
      ["van-vai", 5],
    ]);
  });

  it("finds spacing and hyphen variants while preserving the display code", () => {
    expect(searchBaThanhCodes("bt-111").map((record) => record.displayName)).toContain("BT 111");
    expect(searchBaThanhCodes("SC 028M").map((record) => record.displayName)).toContain("SC 028M");
    expect(searchBaThanhCodes("van da", "van-da").every((record) => record.category === "van-da")).toBe(true);
  });
});

describe("Ba Thanh SEO policy", () => {
  it("allows only enriched published records into indexable output", () => {
    const indexable = getBaThanhIndexableCodes();
    expect(indexable.map((record) => record.codeNormalized)).toEqual([
      "BT111",
      "BT143",
      "BT184",
      "BTS14G",
      "SC028M",
      "SC029M",
    ]);
    expect(indexable.every((record) => record.seoStatus === "READY_TO_INDEX" && record.published)).toBe(true);
  });

  it("keeps the exact display code in every indexable editorial description", () => {
    const mismatches = getBaThanhIndexableCodes()
      .filter((record) => !record.editorialDescription?.includes(record.displayName))
      .map((record) => record.codeNormalized);

    expect(mismatches).toEqual([]);
  });

  it("server-renders every indexable code in the hub featured set", () => {
    expect(getBaThanhHubFeaturedCodes().map((record) => record.codeNormalized)).toEqual(
      getBaThanhIndexableCodes().map((record) => record.codeNormalized),
    );
  });

  it("creates self-referencing code metadata and noindexes thin records", () => {
    const ready = getBaThanhCode("bt-111")!;
    const thin = getBaThanhCode("bt-100")!;
    expect(buildBaThanhCodeMetadata(ready).alternates?.canonical).toBe("https://mdftungphat.com/ma-mau-melamine/ba-thanh/bt-111/");
    expect(buildBaThanhCodeMetadata(thin).robots).toEqual({ index: false, follow: true });
  });

  it("emits factual Product schema without Offer, price or availability", () => {
    const schema = buildBaThanhProductSchema(getBaThanhCode("bt-111")!);
    expect(schema).toMatchObject({
      "@type": "Product",
      sku: "BT 111",
      brand: { "@type": "Brand", name: "Ba Thanh" },
      category: "Melamine",
    });
    expect(schema).not.toHaveProperty("offers");
    expect(JSON.stringify(schema)).not.toMatch(/price|availability/i);
  });

  it("returns stable brand, hub, category and READY_TO_INDEX sitemap paths only", () => {
    const paths = getBaThanhSitemapPaths();
    expect(paths).toHaveLength(12);
    expect(paths).toContain("/thuong-hieu/ba-thanh/");
    expect(paths).toContain("/ma-mau-melamine/ba-thanh/van-go/");
    expect(paths).toContain("/ma-mau-melamine/ba-thanh/bt-111/");
    expect(paths).not.toContain("/ma-mau-melamine/ba-thanh/bt-110/");
    expect(paths.every((path) => !path.includes("?"))).toBe(true);
  });
});
