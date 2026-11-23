import { describe, expect, it } from "vitest";
import { deriveCatalogueFacets, filterCatalogueEntries } from "@/lib/catalog/facets";
import type { CatalogSearchEntry } from "@/lib/catalog/core/types";

const entries: CatalogSearchEntry[] = [
  { id: "ac-mel-wood", supplierId: "an-cuong", supplierName: "An Cường", kind: "color-code", code: "M001", name: "Sồi sáng", thumbnail: "/m001.webp", canonicalRoute: "/catalogue/an-cuong/melamine/m001/", material: "Melamine", canonicalGroup: "woodgrain", surfaceEffect: "Bóng Mờ" },
  { id: "ac-lam-wood", supplierId: "an-cuong", supplierName: "An Cường", kind: "color-code", code: "L001", name: "Óc chó", thumbnail: "/l001.webp", canonicalRoute: "/catalogue/an-cuong/laminate/l001/", material: "Laminate", canonicalGroup: "woodgrain" },
  { id: "bt-lam-stone", supplierId: "ba-thanh", supplierName: "Ba Thanh", kind: "color-code", code: "BT01", name: "Đá nhạt", thumbnail: "/bt01.webp", canonicalRoute: "/catalogue/ba-thanh/laminate/bt01/", material: "Laminate", canonicalGroup: "stone-material" },
  { id: "tt-mel-solid", supplierId: "thanh-thuy", supplierName: "Thanh Thuỳ", kind: "color-code", code: "TT01", name: "Trắng", thumbnail: "/tt01.webp", canonicalRoute: "/catalogue/thanh-thuy/melamine/tt01/", material: "Melamine", canonicalGroup: "solid" },
  { id: "family", supplierId: "an-cuong", supplierName: "An Cường", kind: "catalogue-item", code: "MFC", name: "MFC", thumbnail: "", canonicalRoute: "/catalogue/an-cuong/mfc/", material: "Melamine" },
];

describe("catalogue facets based on verified code records", () => {
  it("excludes non-code catalogue rows and combines facet groups with AND", () => {
    const result = filterCatalogueEntries(entries, {
      supplier: ["an-cuong", "ba-thanh"],
      material: ["Laminate"],
      pattern: ["woodgrain", "stone-material"],
    });

    expect(result.map((entry) => entry.id)).toEqual(["ac-lam-wood", "bt-lam-stone"]);
  });

  it("uses OR inside a facet and reports counts after the other facets", () => {
    const facets = deriveCatalogueFacets(entries, {
      supplier: ["an-cuong"],
      pattern: ["woodgrain"],
    });

    expect(facets.material).toEqual([
      { value: "Laminate", count: 1 },
      { value: "Melamine", count: 1 },
    ]);
    expect(facets.supplier).toEqual([{ value: "an-cuong", count: 2 }]);
  });

  it("omits surface-effect options when the current result scope has no verified values", () => {
    const facets = deriveCatalogueFacets(entries, { supplier: ["ba-thanh"] });

    expect(facets.surfaceEffect).toEqual([]);
  });
});
