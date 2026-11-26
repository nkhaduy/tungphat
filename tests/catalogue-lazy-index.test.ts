import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("shared catalogue payload", () => {
  it("does not embed every supplier code in the initial HTML", () => {
    const page = readFileSync("app/catalogue/page.tsx", "utf8");
    const search = readFileSync("components/catalog/shared/CatalogueResultsExplorer.tsx", "utf8");
    expect(page).not.toContain("getAllSupplierSearchEntriesForCatalogue");
    expect(search).toContain("/data/catalogue-search-");
    expect(page).toContain("catalogueCodes.slice(0, 48)");
  });
});
