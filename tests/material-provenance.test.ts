import { describe, expect, it } from "vitest";
import { getMaterialDataset, validateMaterialDatasetProvenance } from "@/lib/materials";

describe("material dataset v2 provenance", () => {
  it("uses stable family/product records, source tiers, and null unknown specifications", () => {
    const dataset = getMaterialDataset();
    expect(dataset.schemaVersion).toBe("2.0");
    expect(dataset.materials.length).toBeGreaterThan(6);
    expect(new Set(dataset.materials.map((item) => item.id)).size).toBe(dataset.materials.length);
    expect(dataset.materials.every((item) => ["MATERIAL_FAMILY", "PRODUCT_CODE"].includes(item.recordType))).toBe(true);
    expect(dataset.sources.every((source) => /^P[1-5]_/u.test(source.qualityTier))).toBe(true);
    expect(dataset.materials.some((item) => item.dimensions === null && item.thicknesses === null)).toBe(true);
    expect(validateMaterialDatasetProvenance(dataset)).toEqual([]);
  });

  it("contains evidence-backed family records needed by the comparison matrix", () => {
    const ids = new Set(getMaterialDataset().materials.map((item) => item.id));
    expect(ids).toEqual(expect.objectContaining({ size: expect.any(Number) }));
    for (const id of ["family-mdf", "family-mdf-moisture-resistant", "family-hdf", "family-mfc", "family-plywood", "family-finger-jointed-wood"]) {
      expect(ids.has(id), id).toBe(true);
    }
  });
});
