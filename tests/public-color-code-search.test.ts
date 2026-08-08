import { describe, expect, it } from "vitest";
import { searchSupplierCatalog } from "@/lib/catalog/core/search";
import { findExactCatalogCodeMatch } from "@/lib/catalog/ui";
import { getSupplierSearchIndex, getSupplierTotals } from "@/lib/catalog/suppliers/search-index";

describe("public Mã màu search index", () => {
  it("contains only verified color-code records with exact codes", () => {
    const records = getSupplierSearchIndex().records;
    expect(records).toHaveLength(2_826);
    expect(records.every((record) => record.kind === "color-code")).toBe(true);
    expect(records.every((record) => record.recordType === "color-code")).toBe(true);
    expect(records.every((record) => record.code.trim() && record.normalizedCode?.trim())).toBe(true);
    expect(records.some((record) => /MDF chống ẩm|Catalogue|Ván MDF/i.test(record.name))).toBe(false);
  });

  it("keeps supplier counts on verified color codes only", () => {
    expect(getSupplierTotals()).toMatchObject({
      "an-cuong": { total: 2_195, colorCodes: 2_195 },
      "thanh-thuy": { total: 339, colorCodes: 339 },
      "ba-thanh": { total: 292, colorCodes: 292 },
    });
  });

  it("ranks exact An Cuong, Ba Thanh and Thanh Thuy codes above partial matches", () => {
    const entries = getSupplierSearchIndex().records;
    expect(searchSupplierCatalog(entries, "MS465SC04")[0]).toMatchObject({
      supplierId: "an-cuong",
      code: "MFC - MS 465 SC04",
    });
    expect(searchSupplierCatalog(entries, "BT99")[0]).toMatchObject({
      supplierId: "ba-thanh",
      code: expect.stringMatching(/BT\s*99/i),
    });
    expect(searchSupplierCatalog(entries, "SC 016M")[0]).toMatchObject({
      supplierId: "ba-thanh",
      code: expect.stringMatching(/SC\s*016M/i),
    });
    expect(searchSupplierCatalog(entries, "0029")[0]).toMatchObject({
      supplierId: "thanh-thuy",
      code: "0029",
    });
  });

  it("never returns family or document rows for an exact code search", () => {
    const results = searchSupplierCatalog(getSupplierSearchIndex().records, "MS 465 SC04");
    expect(results[0]?.kind).toBe("color-code");
    expect(results.every((record) => record.kind === "color-code")).toBe(true);
  });

  it("resolves an exact public code alias to the canonical detail route", () => {
    const results = searchSupplierCatalog(getSupplierSearchIndex().records, "MS465SC04");
    expect(findExactCatalogCodeMatch(results, "MS465SC04")).toMatchObject({
      code: "MFC - MS 465 SC04",
      canonicalRoute: "/catalogue/an-cuong/melamine/mfc-ms-465-sc04/",
    });
  });
});
