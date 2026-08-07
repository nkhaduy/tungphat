import { describe, expect, it } from "vitest";
import { buildSupplierColorCodeIndex } from "@/scripts/catalog-suppliers/build-color-code-index";

describe("canonical supplier color-code index", () => {
  const artifact = buildSupplierColorCodeIndex();

  it("reconciles the former mixed catalogue and exposes canonical verified codes only", () => {
    expect(artifact.previousSearchableRecords).toBe(3_558);
    expect(artifact.records).toHaveLength(3_375);
    expect(artifact.removedFromPublicColorIndex).toBe(183);
    expect(artifact.purposeTotals).toEqual({
      "color-code": 3_376,
      "product-family": 156,
      technical: 0,
      document: 26,
      other: 0,
    });
    expect(artifact.duplicateAliases).toBe(1);
    expect(
      artifact.records.every(
        (record) =>
          record.recordType === "color-code" &&
          record.confidence === "verified" &&
          record.searchable === true &&
          record.codeRaw.trim().length > 0,
      ),
    ).toBe(true);
  });

  it("keeps every canonical supplier code and actual Ba Thanh Laminate map entry", () => {
    expect(artifact.totals).toMatchObject({
      "an-cuong": { verifiedColorCodes: 2_744 },
      "thanh-thuy": { verifiedColorCodes: 339 },
      "ba-thanh": { verifiedColorCodes: 292 },
    });
    expect(
      artifact.records.filter(
        (record) =>
          record.supplier === "ba-thanh" && record.materialType === "laminate",
      ),
    ).toHaveLength(33);
    expect(
      artifact.records.some(
        (record) =>
          record.supplier === "an-cuong" &&
          record.codeRaw === "MFC - MS 465 SC04",
      ),
    ).toBe(true);
  });

  it("merges duplicate source aliases without discarding provenance or images", () => {
    const duplicated = artifact.records.find(
      (record) =>
        record.supplier === "an-cuong" &&
        record.codeNormalized === "ACRYLICPARC100",
    );
    expect(duplicated).toBeDefined();
    expect(duplicated?.sourceUrls.length).toBeGreaterThan(1);
    expect(new Set(duplicated?.images.map((image) => image.sourceUrl)).size).toBe(
      duplicated?.images.length,
    );
  });

  it("generates detail routes only from non-empty canonical codes", () => {
    expect(
      artifact.records.every(
        (record) =>
          record.canonicalRoute.startsWith(`/catalogue/${record.supplier}/`) &&
          record.canonicalRoute.endsWith(`/${record.slug}/`) &&
          !record.canonicalRoute.includes("undefined") &&
          !record.canonicalRoute.includes("null"),
      ),
    ).toBe(true);
  });
});
