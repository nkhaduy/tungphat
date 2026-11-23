import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getCatalogueListingEntries, splitCataloguePages } from "@/lib/catalog/listing";
import { getSupplierSearchIndex } from "@/lib/catalog/suppliers/search-index";
import { searchSupplierCatalog } from "@/lib/catalog/core/search";

describe("static catalogue listing integrity", () => {
  it("preserves the verified brand, indexability and preview baseline", () => {
    const entries = getCatalogueListingEntries();
    const totals = Object.fromEntries(["an-cuong", "ba-thanh", "thanh-thuy"].map((supplier) => [
      supplier, entries.filter((entry) => entry.supplierId === supplier).length,
    ]));

    expect(entries).toHaveLength(2910);
    expect(totals).toEqual({ "an-cuong": 2195, "ba-thanh": 373, "thanh-thuy": 342 });
    expect(entries.filter((entry) => entry.indexable).length).toBe(2601);
    expect(entries.filter((entry) => !entry.indexable).length).toBe(309);
    expect(entries.filter((entry) => !entry.thumbnail).length).toBe(55);
    expect(new Set(entries.map((entry) => entry.id)).size).toBe(entries.length);
    expect(new Set(entries.map((entry) => entry.canonicalRoute)).size).toBe(entries.length);
  });

  it("keeps the SSR page, fetched batches and static pages in identical deterministic order", () => {
    const entries = getCatalogueListingEntries();
    const pages = splitCataloguePages(entries);
    const loaded = [entries.slice(0, 48), ...pages.slice(1)].flat();
    const browserEntries = getSupplierSearchIndex().records.filter((entry) => entry.kind === "color-code");
    const browserOrder = searchSupplierCatalog(browserEntries, "");

    expect(pages).toHaveLength(61);
    expect(pages.every((page, index) => page.length === (index === 60 ? 30 : 48))).toBe(true);
    expect(loaded.map((entry) => entry.id)).toEqual(entries.map((entry) => entry.id));
    expect(browserOrder.map((entry) => entry.id)).toEqual(entries.map((entry) => entry.id));
  });

  it("keeps fetched browser indexes on the same 2,910-record color-code set", () => {
    const entries = getCatalogueListingEntries();
    const searchIndexes = ["thanh-thuy", "ba-thanh", "an-cuong"].flatMap((supplier) =>
      JSON.parse(readFileSync(join("public/data", `catalogue-search-${supplier}.json`), "utf8")) as typeof entries,
    );
    const colorCodes = searchIndexes.filter((entry) => entry.kind === "color-code");

    expect(searchIndexes.every((entry) => entry.kind === "color-code")).toBe(true);
    expect(colorCodes.map((entry) => entry.id).sort()).toEqual(entries.map((entry) => entry.id).sort());
    expect(new Set(colorCodes.map((entry) => entry.id)).size).toBe(2910);
    expect(searchSupplierCatalog(colorCodes, "").map((entry) => entry.id)).toEqual(entries.map((entry) => entry.id));
  });
});
