import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  getSupplierSearchIndex,
  getSupplierTotals,
  getMaterialTaxonomyOptions,
} from "@/lib/catalog/suppliers/search-index";
import { searchSupplierCatalog } from "@/lib/catalog/core/search";

const canonicalFiles = [
  "data/imports/ancuong/normalized/catalogue.json",
  "data/imports/ancuong/normalized/relation-only-products.json",
  "data/imports/ancuong/normalized/product-families.json",
  "data/imports/ancuong/normalized/documents.json",
  "data/imports/thanh-thuy/full-records.json",
  "data/imports/ba-thanh/full-records.json",
];

describe("full supplier compact search index", () => {
  it("indexes every canonical searchable record exactly once", () => {
    const index = getSupplierSearchIndex();
    const canonicalCount = canonicalFiles.reduce((total, file) => {
      const parsed = JSON.parse(fs.readFileSync(path.join(process.cwd(), file), "utf8"));
      return total + (Array.isArray(parsed) ? parsed.length : parsed.records.length);
    }, 0);

    expect(index.records).toHaveLength(canonicalCount);
    expect(new Set(index.records.map((record) => record.id)).size).toBe(canonicalCount);
    expect(index.records.filter((record) => record.supplierId === "an-cuong")).toHaveLength(2_900);
    expect(index.records.filter((record) => record.supplierId === "thanh-thuy")).toHaveLength(353);
    expect(index.records.filter((record) => record.supplierId === "ba-thanh")).toHaveLength(305);
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

  it("keeps non-curated An Cuong records on owned routes instead of 404 category routes", () => {
    const curated = new Set([
      "/catalogue/an-cuong/melamine/",
      "/catalogue/an-cuong/laminate/",
      "/catalogue/an-cuong/acrylic/",
      "/catalogue/an-cuong/",
    ]);
    expect(getSupplierSearchIndex().records
      .filter((record) => record.supplierId === "an-cuong")
      .every((record) => curated.has(record.canonicalRoute))).toBe(true);
  });

  it("uses an explicit unavailable swatch state when no verified local image exists", () => {
    expect(getSupplierSearchIndex().records
      .filter((record) => record.supplierId === "an-cuong")
      .every((record) => record.thumbnail === "")).toBe(true);
  });

  it("does not invent codes for family or document records", () => {
    const records = getSupplierSearchIndex().records.filter(
      (record) => record.recordType === "family" || record.recordType === "document",
    );
    expect(records.length).toBeGreaterThan(0);
    expect(records.every((record) => !record.code && !record.normalizedCode)).toBe(true);
  });

  it("derives supplier totals and separates expanded records from retained Ba Thanh codes", () => {
    const totals = getSupplierTotals();
    expect(totals["an-cuong"]).toMatchObject({ total: 2_900, sku: 2_745, family: 136, document: 19 });
    expect(totals["thanh-thuy"]).toMatchObject({ total: 353, sku: 339, family: 9, document: 5 });
    expect(totals["ba-thanh"]).toMatchObject({ total: 305, sku: 292, family: 11, document: 2, retainedMelamineCodes: 233 });
  });

  it("returns only non-empty material taxonomy choices in the requested order", () => {
    const options = getMaterialTaxonomyOptions(getSupplierSearchIndex().records);
    expect(options.map((option) => option.slug)).toEqual(
      expect.arrayContaining(["all", "melamine", "laminate", "acrylic", "pvc-ppet", "veneer", "mdf-hdf", "mfc-okal"]),
    );
    expect(options.map((option) => option.slug)).toEqual(
      options.map((option) => option.slug).slice().sort((left, right) =>
        ["all", "melamine", "laminate", "acrylic", "pvc-ppet", "veneer", "mdf-hdf", "mfc-okal", "joined-wood", "edge-banding", "outdoor-panels", "decorative-panels", "accessories", "flooring"].indexOf(left) -
        ["all", "melamine", "laminate", "acrylic", "pvc-ppet", "veneer", "mdf-hdf", "mfc-okal", "joined-wood", "edge-banding", "outdoor-panels", "decorative-panels", "accessories", "flooring"].indexOf(right),
      ),
    );
    expect(options.every((option) => option.count > 0)).toBe(true);
  });
});
