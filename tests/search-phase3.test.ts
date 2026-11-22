import { describe, expect, it } from "vitest";
import { materialAdditionalSections, materialBodyOverrides } from "@/lib/content-overhaul";
import { productEditorial } from "@/lib/product-editorial";

describe("material search paths and answers", () => {
  it("links readers to crawlable supplier collections from relevant material guides", () => {
    expect(materialBodyOverrides.acrylic).toContain("/catalogue/an-cuong/acrylic/");
    expect(materialAdditionalSections.melamine).toContain("/catalogue/an-cuong/melamine/");
    expect(materialAdditionalSections.laminate).toContain("/catalogue/an-cuong/laminate/");
  });
  it("connects MDF selection to MFC comparison and CNC preparation", () => {
    expect(materialBodyOverrides["van-mdf"]).toContain("/van-mfc/");
    expect(materialBodyOverrides["van-mdf"]).toContain("/bai-viet/chuan-bi-file-cnc/");
  });
  it("answers the moisture-versus-water question in the visible opening", () => {
    expect(productEditorial["mdf-chong-am"].intro.toLowerCase()).toContain("không chống nước");
  });
});
