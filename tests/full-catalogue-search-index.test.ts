import { describe, expect, it } from "vitest";
import {
  getSupplierSearchIndex,
  getSupplierTotals,
  getMaterialTaxonomyOptions,
} from "@/lib/catalog/suppliers/search-index";
import { searchSupplierCatalog } from "@/lib/catalog/core/search";

describe("full supplier compact search index", () => {
  it("indexes every verified public color code plus unique non-code families", () => {
    const index = getSupplierSearchIndex();
    const records = index.allRecords;

    expect(records.length).toBeGreaterThan(2_829);
    expect(new Set(records.map((record) => record.id)).size).toBe(records.length);
    expect(records.filter((record) => record.recordType === "color-code")).toHaveLength(2_829);
    expect(records.filter((record) => record.recordType === "document")).toHaveLength(0);
  });

  it("groups default mixed results by Thanh Thuy, Ba Thanh, then An Cuong", () => {
    const results = searchSupplierCatalog(getSupplierSearchIndex().allRecords, "");
    const priority = { "thanh-thuy": 0, "ba-thanh": 1, "an-cuong": 2 } as const;
    const supplierRanks = results.map((record) => priority[record.supplierId]);

    expect(supplierRanks).toEqual([...supplierRanks].sort((left, right) => left - right));
  });

  it("ranks an exact normalized code before names and partial matches", () => {
    const entries = getSupplierSearchIndex().allRecords;
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
    expect(getSupplierSearchIndex().allRecords
      .filter((record) => record.supplierId === "an-cuong" && record.recordType === "color-code")
      .every((record) => /^\/catalogue\/an-cuong\/[^/]+\/[^/]+\/$/.test(record.canonicalRoute))).toBe(true);
  });

  it("recovers a local swatch for every An Cuong color code", () => {
    expect(getSupplierSearchIndex().allRecords
      .filter((record) => record.supplierId === "an-cuong" && record.recordType === "color-code" && !record.thumbnail)).toHaveLength(0);
  });

  it("publishes the five Thanh Thuy edge families without inventing codes", () => {
    const records = getSupplierSearchIndex().allRecords.filter(
      (record) =>
        record.supplierId === "thanh-thuy" &&
        record.recordType === "family" &&
        record.material === "edge-banding",
    );

    expect(records).toHaveLength(5);
    expect(records.every((record) => !record.code && !record.indexable)).toBe(true);
    expect(records.every((record) => record.canonicalRoute === "/san-pham/chi-nep-nhua/")).toBe(true);
    expect(records.filter((record) => record.canonicalGroup === "woodgrain")).toHaveLength(3);
  });

  it("represents each Thanh Thuy source product once across codes and families", () => {
    const records = getSupplierSearchIndex().allRecords.filter(
      (record) => record.supplierId === "thanh-thuy",
    );

    expect(records).toHaveLength(348);
    expect(records.filter((record) => record.recordType === "color-code")).toHaveLength(342);
    expect(records.filter((record) => record.recordType === "family")).toHaveLength(6);
    expect(
      records.filter(
        (record) =>
          record.recordType === "family" &&
          /VENEER (?:CHEERY|OAK|WALNUT)/.test(record.name),
      ),
    ).toHaveLength(0);
  });

  it("derives supplier totals only from verified public color codes", () => {
    const totals = getSupplierTotals();
    expect(totals["an-cuong"]).toMatchObject({ total: 2_195, colorCodes: 2_195, family: 0, document: 0, withLocalPreview: 2_195 });
    expect(totals["thanh-thuy"]).toMatchObject({ total: 342, colorCodes: 342, family: 0, document: 0, withLocalPreview: 342 });
    expect(totals["ba-thanh"]).toMatchObject({ total: 292, colorCodes: 292, family: 0, document: 0, retainedMelamineCodes: 259, withLocalPreview: 269, sourceMediaMissing: 23 });
  });

  it("returns only non-empty material taxonomy choices in the requested order", () => {
    const options = getMaterialTaxonomyOptions(getSupplierSearchIndex().allRecords);
    expect(options.map((option) => option.slug)).toEqual([
      "all", "melamine", "laminate", "acrylic", "veneer", "pvc-ppet", "worktop", "edge-banding", "panel", "other-decorative",
    ]);
    expect(options.find((option) => option.slug === "worktop")?.label).toBe("Mặt Top (Compact)");
    expect(options.every((option) => option.count > 0)).toBe(true);
  });

  it("hides material taxonomy choices that are empty for the selected supplier", async () => {
    const taxonomy = await import("@/lib/catalog/material-taxonomy");
    const optionsForSupplier = Reflect.get(taxonomy, "materialTaxonomyOptionsForSupplier");

    expect(optionsForSupplier).toBeTypeOf("function");
    const options = optionsForSupplier(getSupplierSearchIndex().allRecords, "thanh-thuy");

    expect(options.every((option: { count: number }) => option.count > 0)).toBe(true);
    expect(options.map((option: { slug: string }) => option.slug)).toContain("edge-banding");
    expect(options.map((option: { slug: string }) => option.slug)).not.toContain("panel");
  });
});
