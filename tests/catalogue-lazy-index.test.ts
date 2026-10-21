import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("shared catalogue payload", () => {
  it("does not embed every supplier code in the initial HTML", () => {
    const page = readFileSync("app/catalogue/page.tsx", "utf8");
    const search = readFileSync("components/catalog/shared/SupplierCatalogSearch.tsx", "utf8");
    expect(page).not.toContain("getAllSupplierSearchEntriesForCatalogue");
    expect(search).toContain("/data/catalogue-search-");
  });
});
