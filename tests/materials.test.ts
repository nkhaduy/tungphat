import { describe, expect, it } from "vitest";
import { getMaterialDataset, recommendMaterials } from "@/lib/materials";

describe("verified material knowledge", () => {
  it("keeps unsupported specifications null and links every published claim to provenance", () => {
    const dataset = getMaterialDataset();

    expect(dataset.materials).toHaveLength(6);
    expect(dataset.materials.every((material) => material.sourceIds.length > 0)).toBe(true);
    expect(dataset.materials.every((material) => material.dimensions === null)).toBe(true);
    expect(dataset.materials.every((material) => material.thicknesses === null)).toBe(true);
    expect(dataset.sources.every((source) => source.retrievedAt === "2026-08-08")).toBe(true);
  });

  it("recommends moisture-resistant MDF conditionally without treating it as waterproof", () => {
    const result = recommendMaterials({
      application: "cabinetry",
      moistureExposure: "humid",
      finishPreference: "decorative-surface",
      cncRequired: true,
    });

    expect(result[0]?.slug).toBe("mdf-chong-am");
    expect(result[0]?.caveats.join(" ")).toMatch(/không.*chống nước/iu);
  });

  it("prioritizes wood-joint panels when a natural wood appearance is requested", () => {
    const result = recommendMaterials({
      application: "tabletop",
      moistureExposure: "dry",
      finishPreference: "natural-wood",
      cncRequired: false,
    });

    expect(result.slice(0, 2).map((material) => material.slug)).toEqual([
      "go-ghep-cao-su",
      "go-ghep-tram",
    ]);
  });
});
