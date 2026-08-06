import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import SupplierCataloguePage from "@/app/catalogue/page";

describe("catalogue hub customer journey", () => {
  it("renders search and primary selectors before supplier browsing", () => {
    const markup = renderToStaticMarkup(SupplierCataloguePage());
    const heading = "Tra cứu mã vật liệu và catalogue";
    const placeholder = "Tìm mã BT 111, tên sản phẩm hoặc thương hiệu";
    const selector = "Mã Melamine";
    const supplier = "Catalogue Thanh Thuỳ";

    expect(markup).toContain(heading);
    expect(markup).toContain(placeholder);
    expect(markup).toContain(selector);
    expect(markup.indexOf(heading)).toBeLessThan(markup.indexOf(placeholder));
    expect(markup.indexOf(placeholder)).toBeLessThan(markup.indexOf(selector));
    expect(markup.indexOf(selector)).toBeLessThan(markup.indexOf(supplier));
  });

  it("renders Melamine discovery before supplier sections", () => {
    const markup = renderToStaticMarkup(SupplierCataloguePage());

    expect(markup.indexOf("Mã Melamine được quan tâm")).toBeLessThan(
      markup.indexOf("Catalogue Thanh Thuỳ"),
    );
  });

  it("distinguishes Thanh Thuy searchable imports from public product pages", () => {
    const markup = renderToStaticMarkup(SupplierCataloguePage());
    expect(markup).toContain("353 mục tra cứu");
    expect(markup).toContain("339 mã nhập");
    expect(markup).toContain("348 sản phẩm công khai");
  });
});
