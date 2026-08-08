import { describe, expect, it } from "vitest";
import { buildRelationOnlySkuRecords } from "@/scripts/ancuong/relation-only";

describe("An Cuong relation-only products", () => {
  it("creates one noindex SKU from repeated live relation cards when the detail URL is removed", () => {
    const records = buildRelationOnlySkuRecords([
      {
        relationType: "same-color",
        sourceId: "100",
        sourceUrl: "https://ancuong.com/melamine/100.html",
        targetSourceId: "303012000",
        targetSourceUrl: "https://ancuong.com/decal/pvc-decal/303012000.html",
        targetProductCode: "PVC DECAL F025",
        targetName: "Latte",
      },
      {
        relationType: "same-color",
        sourceId: "101",
        sourceUrl: "https://ancuong.com/laminate/101.html",
        targetSourceId: "303012000",
        targetSourceUrl: "https://ancuong.com/decal/pvc-decal/303012000.html",
        targetProductCode: "PVC DECAL F025",
        targetName: "Latte",
      },
    ], [{
      sourceId: "303012000",
      sourceUrl: "https://ancuong.com/decal/pvc-decal/303012000.html",
      reason: "The sitemap URL resolved to the supplier custom 404 page",
    }], new Set(["100", "101"]), "2026-08-06T00:00:00.000Z");

    expect(records).toEqual([
      expect.objectContaining({
        recordType: "sku",
        supplier: "an-cuong",
        sourceProductId: "303012000",
        code: "PVC DECAL F025",
        name: "Latte",
        productFamily: "PVC Decal",
        sourceUrls: [
          "https://ancuong.com/decal/pvc-decal/303012000.html",
          "https://ancuong.com/laminate/101.html",
          "https://ancuong.com/melamine/100.html",
        ],
        canonicalSourceUrl: "https://ancuong.com/laminate/101.html",
        editorialStatus: "NEEDS_EDITORIAL_REVIEW",
        seoStatus: "NOINDEX_USEFUL",
      }),
    ]);
  });

  it("does not synthesize a SKU when a relation has no public code", () => {
    const records = buildRelationOnlySkuRecords([{
      relationType: "same-color",
      sourceId: "100",
      sourceUrl: "https://ancuong.com/melamine/100.html",
      targetSourceId: "200",
      targetSourceUrl: "https://ancuong.com/eco-veneer/200.html",
      targetName: "Unnamed code",
    }], [{
      sourceId: "200",
      sourceUrl: "https://ancuong.com/eco-veneer/200.html",
      reason: "Removed",
    }], new Set(["100"]), "2026-08-06T00:00:00.000Z");

    expect(records).toEqual([]);
  });
});
