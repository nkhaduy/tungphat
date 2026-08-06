import { describe, expect, it } from "vitest";
import { buildNormalizedCategories, buildTaxonomy, dedupeProducts, normalizeProduct, stabilizeUnchangedProducts } from "@/scripts/ancuong/normalize";
import type { RawProductDetail } from "@/scripts/ancuong/types";
import type { AnCuongProduct } from "@/scripts/ancuong/types";

function product(overrides: Partial<AnCuongProduct>): AnCuongProduct {
  return {
    source: "ancuong",
    brand: "An Cường",
    supplierSource: "An Cường",
    sourceUrl: "https://ancuong.com/melamine/1.html",
    sourceId: "1",
    name: "Oak",
    productCode: "MFC - MS 1",
    normalizedProductCode: "MFC - MS 1",
    category: "Melamine",
    categorySlug: "melamine",
    dimensions: [], colors: ["Be"], surfaces: [], surfaceEffects: ["Synchronized"], specialFeatures: [], collections: ["Collection A"], solutions: [], edgeBandingTypes: [], profiles: [], standards: [], features: [], descriptions: {}, contentUsageStatus: "technical-data", gallery: [], relatedProducts: [], sameColorProducts: [], applicationProducts: [], discoveredAt: "2026-08-04T00:00:00.000Z", fetchedAt: "2026-08-04T00:01:00.000Z", sourceHash: "source", normalizedHash: "normalized", parserVersion: "1.0.0", status: "active",
    ...overrides
  };
}

describe("An Cuong normalization dataset", () => {
  it("keeps canonical timestamps stable when normalized source facts are unchanged", () => {
    const raw: RawProductDetail = {
      sourceUrl: "https://ancuong.com/melamine/1.html", sourceId: "1", category: "Melamine", categorySlug: "melamine", name: "Oak", productCode: "MFC - MS 1", facets: {}, galleryUrls: [], relatedProducts: [], sameColorProducts: [], applicationProducts: [], productLines: [], sourceHash: "new-source", discoveredAt: "2026-08-05T00:00:00.000Z", fetchedAt: "2026-08-05T00:01:00.000Z"
    };
    const current = normalizeProduct(raw);
    const previous = normalizeProduct({ ...raw, sourceHash: "old-source", discoveredAt: "2026-08-04T00:00:00.000Z", fetchedAt: "2026-08-04T00:01:00.000Z" });
    expect(current.normalizedHash).toBe(previous.normalizedHash);
    expect(stabilizeUnchangedProducts([current], [previous])).toEqual([previous]);
  });

  it("preserves discovered category slugs and adds listing product counts", () => {
    expect(buildNormalizedCategories([
      { name: "Chỉ PVC", slug: "chi-dan-canh-pvc", sourceUrl: "https://ancuong.com/chi-dan-canh-pvc.html", catalogueUrls: [] },
      { name: "Melamine", slug: "melamine", sourceUrl: "https://ancuong.com/melamine.html", catalogueUrls: [] }
    ], [
      { sourceUrl: "https://ancuong.com/chi-dan-canh-pvc/1.html", sourceId: "1", category: "Chỉ PVC", categorySlug: "chi-dan-canh-pvc", productCode: "PVC 1", name: "PVC", facetKeys: {} },
      { sourceUrl: "https://ancuong.com/chi-dan-canh-pvc/2.html", sourceId: "2", category: "Chỉ PVC", categorySlug: "chi-dan-canh-pvc", productCode: "PVC 2", name: "PVC", facetKeys: {} }
    ])).toEqual([
      { name: "Chỉ PVC", slug: "chi-dan-canh-pvc", sourceUrl: "https://ancuong.com/chi-dan-canh-pvc.html", catalogueUrls: [], productCount: 2 },
      { name: "Melamine", slug: "melamine", sourceUrl: "https://ancuong.com/melamine.html", catalogueUrls: [], productCount: 0 }
    ]);
  });

  it("deduplicates by source id before product code and category", () => {
    const result = dedupeProducts([
      product({ sourceUrl: "https://ancuong.com/melamine/old.html", sourceHash: "old" }),
      product({ sourceUrl: "https://ancuong.com/melamine/new.html", sourceHash: "new", fetchedAt: "2026-08-04T00:02:00.000Z" })
    ]);
    expect(result.products).toHaveLength(1);
    expect(result.products[0].sourceHash).toBe("new");
    expect(result.duplicates).toHaveLength(1);
  });

  it("builds separate taxonomy facets with stable counts", () => {
    const taxonomy = buildTaxonomy([
      product({ sourceId: "1" }),
      product({ sourceId: "2", sourceUrl: "https://ancuong.com/melamine/2.html", productCode: "MFC - MS 2", normalizedProductCode: "MFC - MS 2", colors: ["Be", "Nâu"] })
    ]);
    expect(taxonomy.facets.find((item) => item.facet === "Màu Sắc")?.values).toEqual([
      expect.objectContaining({ value: "Be", productCount: 2, proposedSlug: "be" }),
      expect.objectContaining({ value: "Nâu", productCount: 1, proposedSlug: "nau" })
    ]);
    expect(taxonomy.facets.some((item) => item.facet === "Hiệu Ứng Bề Mặt")).toBe(true);
  });

  it("keeps source material and pattern facets distinct when both are present", () => {
    const taxonomy = buildTaxonomy([product({
      sourceFacets: { "Vật liệu": ["Vân Gỗ"], "Loại Vân": ["Nổi"] },
      materialPattern: "Nổi"
    })]);
    expect(taxonomy.facets.find((item) => item.facet === "Vật Liệu")?.values.map((value) => value.value)).toEqual(["Vân Gỗ"]);
    expect(taxonomy.facets.find((item) => item.facet === "Loại Vân")?.values.map((value) => value.value)).toEqual(["Nổi"]);
  });
});
