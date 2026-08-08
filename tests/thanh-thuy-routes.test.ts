import { describe, expect, it } from "vitest";
import {
  getThanhThuyCategories,
  getThanhThuyIndexableProducts,
  getThanhThuyProduct,
  getThanhThuyTopCategories,
  isThanhThuyIndexable,
  thanhThuyPath,
  type ThanhThuyProduct,
} from "@/lib/thanh-thuy";

const readyProduct: ThanhThuyProduct = {
  slug: "lp-101-104g",
  code: "LP 101/104G",
  name: "Melamine trắng LP 101/104G",
  categorySlug: "melamine",
  categoryName: "Melamine",
  seriesSlug: "don-sac",
  seriesName: "Màu đơn sắc",
  image: "/catalog/thanh-thuy/lp-101-104g.webp",
  imageAlt: "Mẫu Melamine trắng LP 101/104G",
  description: "Bề mặt Melamine màu trắng cho hạng mục nội thất cần hoàn thiện gọn.",
  applications: ["Tủ và kệ nội thất"],
  seoStatus: "READY_TO_INDEX",
  published: true,
  price: null,
  sourceUrl: "https://thanhthuy.example/products/lp-101-104g",
};

describe("Thanh Thuy route selectors", () => {
  it("builds stable trailing-slash paths from taxonomy and product slugs", () => {
    expect(thanhThuyPath()).toBe("/thuong-hieu/thanh-thuy/");
    expect(thanhThuyPath("melamine")).toBe("/san-pham/melamine/");
    expect(thanhThuyPath("melamine", readyProduct.slug)).toBe(
      "/san-pham/melamine/lp-101-104g/",
    );
  });

  it("only treats published ready records as indexable", () => {
    expect(isThanhThuyIndexable(readyProduct)).toBe(true);
    expect(
      isThanhThuyIndexable({ ...readyProduct, seoStatus: "NEEDS_ENRICHMENT" }),
    ).toBe(false);
    expect(isThanhThuyIndexable({ ...readyProduct, published: false })).toBe(
      false,
    );
  });

  it("does not expose a product through a different category path", () => {
    expect(getThanhThuyProduct("laminate", readyProduct.slug)).toBeUndefined();
  });

  it("returns deduplicated categories and indexable products", () => {
    const categories = getThanhThuyCategories();
    expect(new Set(categories.map((category) => category.slug)).size).toBe(
      categories.length,
    );
    expect(getThanhThuyIndexableProducts().every(isThanhThuyIndexable)).toBe(
      true,
    );
  });

  it("keeps source parent taxonomy so only six material groups become top-level routes", () => {
    const top = getThanhThuyTopCategories();
    expect(top.map((category) => category.slug)).toEqual([
      "laminate",
      "melamine",
      "acrylic",
      "pvc-film",
      "veneer",
      "chi-nep-nhua",
    ]);
  });
});
