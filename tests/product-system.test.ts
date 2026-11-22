import { describe, expect, it } from "vitest";
import { homeProductCards } from "@/lib/product-taxonomy";

const expected = ["van-mdf", "mdf-chong-am", "van-okal", "van-plywood", "go-ghep-cao-su", "melamine", "laminate", "tam-veneer", "van-nhua-pvc", "chi-nep-nhua"];

describe("complete material discovery", () => {
  it("shows exactly the ten main groups in their required order", () => {
    expect(homeProductCards.map((card) => card.href.replace(/^\//, "").replace(/\/$/, ""))).toEqual(expected);
    expect(new Set(homeProductCards.map((card) => card.href)).size).toBe(expected.length);
  });
  it("uses the two supplied photos for the corresponding MDF families", () => {
    expect(homeProductCards.find((card) => card.href === "/van-mdf/")?.image).toBe("/sanpham-media/van-mdf.webp");
    expect(homeProductCards.find((card) => card.href === "/mdf-chong-am/")?.image).toBe("/sanpham-media/mdf-chong-am.webp");
  });
});
