import { describe, expect, it } from "vitest";
import { materialBodyOverrides, articleBodyOverrides } from "@/lib/content-overhaul";
import { mergeProductEditorial } from "@/lib/product-editorial";

describe("reviewed material guides", () => {
  it("adds decision guidance specific to Acrylic and MDF", () => {
    expect(materialBodyOverrides.acrylic).toContain("## So sánh Acrylic với Melamine và Laminate");
    expect(materialBodyOverrides.acrylic).toContain("không đồng nghĩa");
    expect(materialBodyOverrides["van-mdf"]).toContain("khoảng đỡ");
    expect(materialBodyOverrides["van-mdf"]).toContain("tài liệu kỹ thuật");
    const acrylic = mergeProductEditorial([]).find((entry) => entry.slug === "acrylic");
    expect(acrylic?.body).toBe(materialBodyOverrides.acrylic);
  });
  it("makes the MDF comparison explain water exposure and verification", () => {
    expect(articleBodyOverrides["mdf-thuong-va-chong-am"]).toContain("không đồng nghĩa");
    expect(articleBodyOverrides["mdf-thuong-va-chong-am"]).toContain("tài liệu kỹ thuật");
    expect(articleBodyOverrides["mdf-thuong-va-chong-am"]).toContain("/van-mdf/");
  });
});
