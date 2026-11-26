import { describe, expect, it } from "vitest";
import source from "@/data/catalogs/supplier-color-codes.json";
import { getPublicColorCode, getPublicColorCodes } from "@/lib/catalog/color-codes/public";
import { getSupplierSearchIndex } from "@/lib/catalog/suppliers/search-index";

describe("confirmed unavailable legacy colour swatches", () => {
  it.each(["SC009MW", "SC010MW", "SC011MW", "SC012MW", "SC013MW", "SC014MW", "SC015MW"])("retains %s and its provenance without requesting its missing image", code => {
    const original = source.records.find(record => record.codeNormalized === code)!;
    const record = getPublicColorCode("ba-thanh", "melamine", code.toLowerCase())!;
    expect(record).toBeDefined();
    expect(record.codeRaw).toBe(original.codeRaw);
    expect(record.sourceUrl).toBe(original.sourceUrl);
    expect(record.canonicalRoute).toBe(original.canonicalRoute);
    expect(original.images.length).toBeGreaterThan(0); // Original provenance stays intact.
    expect(record.images).toEqual([]); // Existing gallery renders its honest missing-source state.
    const search = getSupplierSearchIndex().records.find(item => item.id === record.id)!;
    expect(search.thumbnail).toBe("");
    expect(search.canonicalRoute).toBe(record.canonicalRoute);
  });

  it("keeps every searchable code and valid media", () => {
    expect(getPublicColorCodes()).toHaveLength(source.records.length);
    const valid = getPublicColorCode("ba-thanh", "melamine", "bt99")!;
    expect(valid.images.length).toBeGreaterThan(0);
    expect(getSupplierSearchIndex().records.find(item => item.id === valid.id)?.thumbnail).toContain("bt99");
    const unavailable = new Set(["SC009MW", "SC010MW", "SC011MW", "SC012MW", "SC013MW", "SC014MW", "SC015MW"]);
    for (const original of source.records.filter(record => !unavailable.has(record.codeNormalized))) {
      expect(getPublicColorCodes().find(record => record.id === original.id)?.images.length).toBe(original.images.length);
    }
  });
});
