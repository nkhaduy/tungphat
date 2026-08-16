import { describe, expect, it } from "vitest";
import {
  getSupplierSearchIndex,
  getSupplierTotals,
  getMaterialTaxonomyOptions,
} from "@/lib/catalog/suppliers/search-index";
import { searchSupplierCatalog } from "@/lib/catalog/core/search";

describe("full supplier compact search index", () => {
  it("indexes every verified public color code exactly once", () => {
    const index = getSupplierSearchIndex();

    expect(index.records).toHaveLength(2_829);
    expect(new Set(index.records.map((record) => record.id)).size).toBe(2_829);
    expect(index.records.filter((record) => record.supplierId === "an-cuong")).toHaveLength(2_195);
    expect(index.records.filter((record) => record.supplierId === "thanh-thuy")).toHaveLength(342);
    expect(index.records.filter((record) => record.supplierId === "ba-thanh")).toHaveLength(292);
    expect(index.records.every((record) => record.recordType === "color-code" && record.code.trim())).toBe(true);
  });

  it("groups default mixed results by Thanh Thuy, Ba Thanh, then An Cuong", () => {
    const results = searchSupplierCatalog(getSupplierSearchIndex().records, "");
    const priority = { "thanh-thuy": 0, "ba-thanh": 1, "an-cuong": 2 } as const;
    const supplierRanks = results.map((record) => priority[record.supplierId]);

    expect(supplierRanks).toEqual([...supplierRanks].sort((left, right) => left - right));
  });

  it("ranks an exact normalized code before names and partial matches", () => {
    const entries = getSupplierSearchIndex().records;
    const exact = entries.find((record) => record.normalizedCode === "MFCMS01012T");
    expect(exact).toBeDefined();
    const partial = { ...exact!, id: "test-partial", code: "MFCMS01012T2", normalizedCode: "MFCMS01012T2", demandScore: 0 };
    const results = searchSupplierCatalog([...entries, partial], "MFCMS01012T");
    expect(results[0]).toMatchObject({
      supplierId: "an-cuong",
      code: "MFC - MS 01012 T",
      normalizedCode: "MFCMS01012T",
    });
    expect(results[0]?.normalizedCode).toBe("MFCMS01012T");
  });

  it("gives every An Cuong color code a canonical detail route", () => {
    expect(getSupplierSearchIndex().records
      .filter((record) => record.supplierId === "an-cuong")
      .every((record) => /^\/catalogue\/an-cuong\/[^/]+\/[^/]+\/$/.test(record.canonicalRoute))).toBe(true);
  });

  it("recovers a local swatch for every An Cuong color code", () => {
    expect(getSupplierSearchIndex().records
      .filter((record) => record.supplierId === "an-cuong" && !record.thumbnail)).toHaveLength(0);
  });

  it("never publishes family or document records", () => {
    const records = getSupplierSearchIndex().records.filter(
      (record) => record.recordType === "family" || record.recordType === "document",
    );
    expect(records).toHaveLength(0);
  });

  it("derives supplier totals only from verified public color codes", () => {
    const totals = getSupplierTotals();
    expect(totals["an-cuong"]).toMatchObject({ total: 2_195, colorCodes: 2_195, family: 0, document: 0, withLocalPreview: 2_195 });
    expect(totals["thanh-thuy"]).toMatchObject({ total: 342, colorCodes: 342, family: 0, document: 0, withLocalPreview: 342 });
    expect(totals["ba-thanh"]).toMatchObject({ total: 292, colorCodes: 292, family: 0, document: 0, retainedMelamineCodes: 259, withLocalPreview: 269, sourceMediaMissing: 23 });
  });

  it("returns only non-empty material taxonomy choices in the requested order", () => {
    const options = getMaterialTaxonomyOptions(getSupplierSearchIndex().records);
    expect(options.map((option) => option.slug)).toEqual([
      "all", "melamine", "laminate", "acrylic", "veneer", "pvc-ppet", "worktop", "edge-banding",
    ]);
    expect(options.find((option) => option.slug === "worktop")?.label).toBe("Mặt Top (Compact)");
    expect(options.every((option) => option.count > 0)).toBe(true);
  });

  it("hides material taxonomy choices that are empty for the selected supplier", async () => {
    const taxonomy = await import("@/lib/catalog/material-taxonomy");
    const optionsForSupplier = Reflect.get(taxonomy, "materialTaxonomyOptionsForSupplier");

    expect(optionsForSupplier).toBeTypeOf("function");
    const options = optionsForSupplier(getSupplierSearchIndex().records, "thanh-thuy");

    expect(options.every((option: { count: number }) => option.count > 0)).toBe(true);
    expect(options.map((option: { slug: string }) => option.slug)).not.toContain("edge-banding");
    expect(options.map((option: { slug: string }) => option.slug)).not.toContain("panel");
  });
});
