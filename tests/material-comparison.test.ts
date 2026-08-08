import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { getMaterialComparisonMatrix, toMaterialComparisonCsv } from "@/lib/material-reference";

describe("verified material comparison matrix", () => {
  it("covers six fixed families without guessing unknown cells", () => {
    const matrix = getMaterialComparisonMatrix();
    expect(matrix.map((row) => row.id)).toEqual([
      "family-mdf",
      "family-mdf-moisture-resistant",
      "family-hdf",
      "family-mfc",
      "family-plywood",
      "family-finger-jointed-wood",
    ]);
    expect(matrix.every((row) => row.sourceIds.length > 0)).toBe(true);
    expect(matrix.some((row) => row.density === null)).toBe(true);
  });

  it("keeps generated JSON and CSV assets in parity with the source dataset", () => {
    const matrix = getMaterialComparisonMatrix();
    const json = JSON.parse(fs.readFileSync("public/material-comparison-matrix.json", "utf8"));
    const csv = fs.readFileSync("public/material-comparison-matrix.csv", "utf8");
    expect(json.records).toEqual(matrix);
    expect(csv).toBe(toMaterialComparisonCsv(matrix));
  });
});
