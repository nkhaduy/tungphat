import { describe, expect, it } from "vitest";
import { validatePublishedProvenance } from "@/lib/source-quality";

describe("published provenance validation", () => {
  const sources = [
    { id: "manufacturer", qualityTier: "P1_PRIMARY_MANUFACTURER" as const },
    { id: "business", qualityTier: "P3_FIRST_PARTY_BUSINESS" as const },
    { id: "unverified", qualityTier: "P5_UNVERIFIED" as const },
  ];

  it("accepts sourced facts and null unknowns", () => {
    expect(validatePublishedProvenance({
      sources,
      fields: [
        { recordId: "mdf", field: "composition", value: "Wood fibres and resin", sourceIds: ["manufacturer"] },
        { recordId: "mdf", field: "dimensions", value: null, sourceIds: [] },
      ],
    })).toEqual([]);
  });

  it("rejects published technical facts backed only by P5 or missing sources", () => {
    const errors = validatePublishedProvenance({
      sources,
      fields: [
        { recordId: "hdf", field: "density", value: "Above 800 kg/m3", sourceIds: ["unverified"] },
        { recordId: "mfc", field: "substrate", value: "Particleboard", sourceIds: [] },
      ],
    });

    expect(errors).toHaveLength(2);
    expect(errors.join("\n")).toMatch(/P5_UNVERIFIED/u);
    expect(errors.join("\n")).toMatch(/missing source/u);
  });
});
