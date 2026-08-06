import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const publicCopyFiles = [
  "components/CatalogueView.tsx",
  "app/catalogue/page.tsx",
  "components/catalog/AnCuongCatalogueSearch.tsx",
  "components/thanh-thuy/ThanhThuyProductDetail.tsx",
  "components/Partners.tsx",
  "components/home/HomeContent.tsx",
];

describe("catalogue public copy and bundle boundary", () => {
  it("removes public sample-only catalogue wording", () => {
    for (const file of publicCopyFiles) {
      const source = fs.readFileSync(path.join(process.cwd(), file), "utf8");
      expect(source.toLowerCase(), file).not.toMatch(/dữ liệu mẫu|mẫu dữ liệu|nguồn dữ liệu mẫu|7 mẫu/);
    }
  });

  it("keeps the homepage and global shell outside the supplier search-index boundary", () => {
    const homepage = fs.readFileSync(path.join(process.cwd(), "components/home/HomeContent.tsx"), "utf8");
    const page = fs.readFileSync(path.join(process.cwd(), "app/page.tsx"), "utf8");
    expect(`${homepage}\n${page}`).not.toMatch(/supplier-search-index|suppliers\/search-index|getSupplierSearchEntries/);
  });
});
