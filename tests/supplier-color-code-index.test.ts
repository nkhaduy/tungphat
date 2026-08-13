import { describe, expect, it } from "vitest";
import { buildSupplierColorCodeIndex } from "@/scripts/catalog-suppliers/build-color-code-index";

describe("canonical supplier color-code index", () => {
  const artifact = buildSupplierColorCodeIndex();

  it("reconciles the former mixed catalogue and exposes canonical verified codes only", () => {
    expect(artifact.previousSearchableRecords).toBe(3_558);
    expect(artifact.records).toHaveLength(2_829);
    expect(artifact.removedFromPublicColorIndex).toBe(729);
    expect(artifact.purposeTotals).toEqual({
      "color-code": 3_379,
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

  it("uses the codes printed on Ba Thanh Laminate swatches instead of WAY route codes", () => {
    const laminate = artifact.records.filter(
      (record) =>
        record.supplier === "ba-thanh" && record.materialType === "laminate",
    );

    expect(laminate.map((record) => record.codeNormalized).sort()).toEqual([
      "BT117", "BT118", "BT146", "BT158", "BT159", "BT160", "BT161",
      "BT162", "BT163", "BT164", "BT165", "BT166", "BT167", "BT52",
      "BT90", "BTS8", "BTS9", "SC009MW", "SC010MW", "SC011MW",
      "SC012MW", "SC013M", "SC013MW", "SC014M", "SC014MW", "SC015M",
      "SC015MW", "SC016M", "SC016MW", "SC017M", "SC017MW", "SC018M",
      "SC018MW",
    ].sort());
    expect(laminate.some((record) => /^[PWSF]\d{4}$/.test(record.codeNormalized))).toBe(false);

    const sc017Mw = laminate.find((record) => record.codeNormalized === "SC017MW");
    expect(sc017Mw).toMatchObject({
      codeRaw: "SC 017 MW",
      displayName: "Laminate Ba Thanh SC 017 MW",
      canonicalRoute: "/catalogue/ba-thanh/laminate/p2052/",
      sourceUrl: "https://bathanh.com.vn/way-p2052",
    });
    expect(sc017Mw?.searchAliases).not.toContain("P2052");
  });

  it("keeps identical Ba Thanh printed codes separate by material", () => {
    const bt163 = artifact.records.filter(
      (record) => record.supplier === "ba-thanh" && record.codeNormalized === "BT163",
    );

    expect(bt163.map((record) => record.materialType).sort()).toEqual([
      "laminate",
      "melamine",
    ]);
    expect(new Set(bt163.map((record) => record.id)).size).toBe(2);
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
    expect(anCuong?.images.some((image) => image.role === "swatch" && image.localPath)).toBe(true);
    const baThanhLaminate = artifact.records.find(
      (record) => record.supplier === "ba-thanh" && record.codeNormalized === "BT163" && record.materialType === "laminate",
    );
    expect(baThanhLaminate?.images.some((image) => image.localPath)).toBe(true);
    const invalidBaThanh = artifact.records.find(
      (record) => record.supplier === "ba-thanh" && record.codeRaw === "BT171EV",
    );
    expect(invalidBaThanh?.images).toEqual([]);
  });
});
