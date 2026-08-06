import { describe, expect, it } from "vitest";
import { buildDiffReport, diffCatalogues } from "../../scripts/ancuong/diff";

function product(overrides: Record<string, unknown> = {}) {
  return {
    source: "ancuong",
    sourceUrl: "https://ancuong.com/online-catalogue/melamine/mfc-ms-103.html",
    sourceId: "103",
    name: "MS 103",
    productCode: "MFC - MS 103 SMM",
    normalizedProductCode: "MFC - MS 103 SMM",
    category: "Melamine",
    categorySlug: "melamine",
    normalizedHash: "hash-1",
    sourceHash: "source-1",
    status: "active",
    gallery: [],
    relatedProducts: [],
    sameColorProducts: [],
    applicationProducts: [],
    ...overrides,
  };
}

describe("An Cuong catalogue diff", () => {
  it("writes a compact report without duplicating the full catalogue", () => {
    const result = diffCatalogues([], [product()]);
    const report = buildDiffReport(result);
    expect(report).toEqual({ entries: result.entries, summary: result.summary });
    expect(report).not.toHaveProperty("catalogue");
  });

  it("classifies content, relation and media changes independently", () => {
    const previous = [
      product(),
      product({ sourceId: "relations", sourceUrl: "https://ancuong.com/p/relations", normalizedHash: "same", sameColorProducts: [] }),
      product({ sourceId: "media", sourceUrl: "https://ancuong.com/p/media", normalizedHash: "same", gallery: [{ sourceUrl: "https://ancuong.com/old.jpg", sha256: "a".repeat(64) }] }),
    ];
    const current = [
      product({ normalizedHash: "hash-2" }),
      product({ sourceId: "relations", sourceUrl: "https://ancuong.com/p/relations", normalizedHash: "same", sameColorProducts: [{ relationType: "same-color", sourceId: "20" }] }),
      product({ sourceId: "media", sourceUrl: "https://ancuong.com/p/media", normalizedHash: "same", gallery: [{ sourceUrl: "https://ancuong.com/new.jpg", sha256: "b".repeat(64) }] }),
    ];

    expect(diffCatalogues(previous, current).entries.map((entry) => entry.classification)).toEqual([
      "UPDATED",
      "MEDIA_CHANGED",
      "RELATION_CHANGED",
    ]);
  });

  it("retains missing source products and does not classify them as deleted", () => {
    const result = diffCatalogues([product()], []);
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0]).toEqual(expect.objectContaining({ classification: "MISSING_FROM_SOURCE" }));
    expect(result.catalogue[0]).toEqual(expect.objectContaining({ status: "missing", sourceId: "103" }));
  });

  it("detects new, unchanged, invalid and duplicate records deterministically", () => {
    const unchanged = product();
    const result = diffCatalogues([unchanged], [
      unchanged,
      product({ sourceId: "new", sourceUrl: "https://ancuong.com/p/new", normalizedHash: "new" }),
      product({ sourceId: "invalid", sourceUrl: "https://ancuong.com/p/invalid", status: "invalid" }),
      product({ sourceId: "new", sourceUrl: "https://ancuong.com/p/new-copy", normalizedHash: "duplicate" }),
    ]);
    expect(result.entries.map((entry) => entry.classification)).toEqual([
      "INVALID",
      "NEW",
      "DUPLICATE",
      "UNCHANGED",
    ]);
    expect(result.summary).toEqual(expect.objectContaining({ NEW: 1, UNCHANGED: 1, INVALID: 1, DUPLICATE: 1 }));
  });

  it("deduplicates by normalized code and category when source ids are absent", () => {
    const first = product({ sourceId: undefined, sourceUrl: "https://ancuong.com/p/a", normalizedProductCode: "PVC 401/LK4513", categorySlug: "chi-pvc" });
    const duplicate = product({ sourceId: undefined, sourceUrl: "https://ancuong.com/p/b", normalizedProductCode: "PVC 401/LK4513", categorySlug: "chi-pvc" });
    const result = diffCatalogues([], [first, duplicate]);
    expect(result.entries.map((entry) => entry.classification)).toEqual(["NEW", "DUPLICATE"]);
  });
});
