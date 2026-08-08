import { describe, expect, it } from "vitest";
import { filterMaterials, toMaterialReferenceCsv } from "@/lib/material-reference";
import { getMaterialDataset } from "@/lib/materials";

describe("material reference filters", () => {
  it("filters by search term and category while preserving verified records", () => {
    const results = filterMaterials(getMaterialDataset().materials, { search: "cao su", category: "all" });
    expect(results.map((material) => material.slug)).toEqual(["go-ghep-cao-su"]);
  });

  it("exports null technical fields as unverified instead of inventing values", () => {
    const csv = toMaterialReferenceCsv(getMaterialDataset());
    expect(csv).toContain("id,recordType,slug,name,manufacturer,category,materialClass,dimensions,thicknesses,finish,surface,applications,limitations,sourceIds,lastVerified");
    expect(csv).toContain("Chưa xác minh");
  });
});
