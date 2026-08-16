import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import SupplierCataloguePage from "@/app/catalogue/page";

describe("catalogue hub customer journey", () => {
  it("renders search and primary selectors before supplier browsing", () => {
    const markup = renderToStaticMarkup(SupplierCataloguePage());
    const heading = "Tìm mã màu";
    const placeholder = "Tìm mã màu, tên màu hoặc thương hiệu";
    const selector = "Melamine";
    const supplier = "Thanh Thuỳ";

    expect(markup).toContain(heading);
    expect(markup).toContain(placeholder);
    expect(markup).toContain(selector);
    expect(markup.indexOf(heading)).toBeLessThan(markup.indexOf(placeholder));
    expect(markup.indexOf(placeholder)).toBeLessThan(markup.indexOf(selector));
    expect(markup.indexOf(selector)).toBeLessThan(markup.indexOf(supplier));
  });

  it("renders Melamine discovery before supplier sections", () => {
    const markup = renderToStaticMarkup(SupplierCataloguePage());

    expect(markup.indexOf("Mã Melamine được quan tâm")).toBeLessThan(markup.indexOf("Theo nhà cung cấp"));
  });

  it("distinguishes Thanh Thuy searchable imports from public product pages", () => {
    const markup = renderToStaticMarkup(SupplierCataloguePage());
    expect(markup).toContain("342 mã màu");
    expect(markup).toContain("292 mã màu");
    expect(markup).toContain("2195 mã màu");
    expect(markup).toContain("PPET/PVC, Mặt Top và mã cạnh An Cường");
    expect(markup).not.toContain("Panel và mã cạnh An Cường");
  });

  it("keeps visible control labels inside their accessible names", () => {
    const markup = renderToStaticMarkup(SupplierCataloguePage());

    expect(markup).toContain('aria-label="Chuyển ngôn ngữ VI | EN"');
    expect(markup).toContain("Sao chép mã");
    expect(markup).not.toContain(">Copy</button>");
  });
});
