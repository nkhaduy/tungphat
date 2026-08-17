import { describe, expect, it } from "vitest";
import { buildSupplierColorCodeIndex } from "@/scripts/catalog-suppliers/build-color-code-index";

describe("canonical supplier color-code index", () => {
  const artifact = buildSupplierColorCodeIndex();

  it("reconciles the former mixed catalogue and exposes canonical verified codes only", () => {
    expect(artifact.previousSearchableRecords).toBe(3_639);
    expect(artifact.records).toHaveLength(2_910);
    expect(artifact.removedFromPublicColorIndex).toBe(729);
    expect(artifact.purposeTotals).toEqual({
      "color-code": 3_460,
      "product-family": 153,
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

  it("keeps every in-scope canonical supplier code and actual Ba Thanh Laminate map entry", () => {
    expect(artifact.totals).toMatchObject({
      "an-cuong": { verifiedColorCodes: 2_195, scopeExcluded: 549 },
      "thanh-thuy": { verifiedColorCodes: 342 },
      "ba-thanh": { verifiedColorCodes: 373 },
    });
    expect(
      artifact.records.filter(
        (record) =>
          record.supplier === "ba-thanh" && record.materialType === "laminate",
      ),
    ).toHaveLength(113);
    expect(
      artifact.records.some(
        (record) =>
          record.supplier === "an-cuong" &&
          record.codeRaw === "MFC - MS 465 SC04",
      ),
    ).toBe(true);
    expect(
      artifact.records
        .filter(
          (record) =>
            record.supplier === "thanh-thuy" &&
            record.materialType === "veneer",
        )
        .map((record) => record.codeRaw),
    ).toEqual(["VENEER CHEERY", "VENEER OAK", "VENEER WALNUT"]);
  });

  it("uses official WAY Laminate codes and keeps matching Melamine codes as aliases", () => {
    const laminate = artifact.records.filter(
      (record) =>
        record.supplier === "ba-thanh" && record.materialType === "laminate",
    );

    expect(laminate.map((record) => record.codeNormalized)).toContain("P2052G");
    expect(laminate.map((record) => record.codeNormalized)).toContain("W7020Z");

    const p2052 = laminate.find((record) => record.codeNormalized === "P2052G");
    expect(p2052).toMatchObject({
      codeRaw: "P 2052 G",
      displayName: "Laminate WAY P 2052",
      canonicalRoute: "/catalogue/ba-thanh/laminate/p2052/",
      sourceUrl: "https://bathanh.com.vn/way-p2052",
    });
    expect(p2052?.searchAliases).toEqual(
      expect.arrayContaining(["P2052", "P2052 G", "SC 017 MW", "SC017MW"]),
    );
  });

  it("keeps identical Ba Thanh printed codes separate by material", () => {
    const bt163 = artifact.records.filter((record) =>
      record.supplier === "ba-thanh" &&
      (record.codeNormalized === "BT163" || record.searchAliases.includes("BT163")),
    );

    expect(bt163.map((record) => [record.materialType, record.codeNormalized]).sort()).toEqual([
      ["laminate", "LW163T"],
      ["laminate", "W0502Z"],
      ["melamine", "BT163"],
    ]);
    expect(new Set(bt163.map((record) => record.id)).size).toBe(3);
  });

  it("stores mixed-supplier records in Thanh Thuy, Ba Thanh, An Cuong order", () => {
    const priority = { "thanh-thuy": 0, "ba-thanh": 1, "an-cuong": 2 } as const;
    const supplierRanks = artifact.records.map((record) => priority[record.supplier]);

    expect(supplierRanks).toEqual([...supplierRanks].sort((left, right) => left - right));
  });

  it("limits An Cuong public codes to the approved product menu plus edge banding", () => {
    const anCuongMaterials = new Set(
      artifact.records
        .filter((record) => record.supplier === "an-cuong")
        .map((record) => record.materialType),
    );

    expect(anCuongMaterials).toEqual(
      new Set([
        "melamine",
        "laminate",
        "acrylic",
        "veneer",
        "ppet",
        "pvc",
        "worktop",
        "edge-banding",
      ]),
    );
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

  it("includes recovered local previews and excludes invalid Ba Thanh detail images", () => {
    const anCuong = artifact.records.find(
      (record) => record.supplier === "an-cuong" && record.codeRaw === "MFC - MS 465 SC04",
    );
    expect(anCuong?.images.some((image) => image.role === "fullsheet" && image.localPath && image.thumbnailSrc)).toBe(true);
    const baThanhLaminate = artifact.records.find(
      (record) => record.supplier === "ba-thanh" && record.codeNormalized === "W0502Z" && record.materialType === "laminate",
    );
    expect(baThanhLaminate?.images.some((image) => image.localPath)).toBe(true);
    const invalidBaThanh = artifact.records.find(
      (record) => record.supplier === "ba-thanh" && record.codeRaw === "BT171EV",
    );
    expect(invalidBaThanh?.images).toEqual([]);
  });
});
