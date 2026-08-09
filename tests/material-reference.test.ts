import { describe, expect, it } from "vitest";
import {
  filterMaterials,
  toMaterialComparisonJson,
  toMaterialReferenceCsv,
} from "@/lib/material-reference";
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

  it("keeps machine-readable comparison rows connected to their source records", () => {
    const json = JSON.parse(toMaterialComparisonJson(getMaterialDataset()));

    expect(json).toMatchObject({
      schemaVersion: "2.0",
      caveat: expect.stringContaining("Family-level comparison"),
      methodology: {
        includedData: expect.stringContaining("family-level"),
        sourceHierarchy: ["P1_PRIMARY_MANUFACTURER", "P3_FIRST_PARTY_BUSINESS", "P4_REPUTABLE_SECONDARY"],
        unknownHandling: expect.stringContaining("null"),
        lastVerified: getMaterialDataset().lastVerified,
        factBoundary: expect.stringContaining("manufacturer"),
      },
    });
    expect(json.sources).toHaveLength(10);
    expect(json.records[0]).toMatchObject({
      id: "family-mdf",
      sourceIds: ["epf-mdf"],
    });
    expect(json.sources.find((source: { id: string }) => source.id === "epf-mdf")).toMatchObject({
      sourceTitle: "Medium density fibreboard",
      sourceUrl: expect.stringContaining("europanels.org"),
    });
  });
});
