import { describe, expect, it } from "vitest";
import {
  buildColorCodeAliases,
  normalizeColorCode,
} from "@/lib/catalog/color-codes/normalize";

describe("color-code normalization", () => {
  it("preserves the full An Cuong surface identity while adding compact search aliases", () => {
    expect(normalizeColorCode("MFC - MS 465 SC04")).toBe("MFCMS465SC04");
    expect(buildColorCodeAliases("MFC - MS 465 SC04")).toEqual([
      "MFC - MS 465 SC04",
      "MFCMS465SC04",
      "MS 465 SC04",
      "MS465SC04",
      "465 SC04",
      "465SC04",
    ]);
  });

  it("supports exact compact and spaced supplier code searches", () => {
    expect(buildColorCodeAliases("BT99")).toEqual(["BT99", "BT 99"]);
    expect(buildColorCodeAliases("SC016M")).toEqual(["SC016M", "SC 016M"]);
  });

  it("never invents an alias for an empty code", () => {
    expect(normalizeColorCode("  ")).toBe("");
    expect(buildColorCodeAliases("  ")).toEqual([]);
  });
});
