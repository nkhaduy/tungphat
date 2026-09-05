import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import SupplierCataloguePage from "@/app/catalogue/page";
import { supplierDefinitions } from "@/lib/catalog/core/registry";

describe("catalogue hub customer journey", () => {
  it("renders search and primary selectors before supplier browsing", () => {
    const markup = renderToStaticMarkup(SupplierCataloguePage());
    const heading = "Tra cứu mã màu";
    const placeholder = "Nhập mã màu, tên màu hoặc thương hiệu...";
    const selector = "Melamine";

    expect(markup).toContain(heading);
    expect(markup).toContain(placeholder);
    expect(markup).toContain(selector);
    expect(markup.indexOf(heading)).toBeLessThan(markup.indexOf(placeholder));
    expect(markup.indexOf(placeholder)).toBeLessThan(markup.indexOf(selector));
    expect(markup.indexOf("catalogue-filter-deck")).toBeLessThan(
      markup.indexOf("Theo nhà cung cấp"),
    );
  });

  it("renders only one catalogue search interface", () => {
    const markup = renderToStaticMarkup(SupplierCataloguePage());

    expect(
      markup.match(/aria-label="Nhập mã màu, tên màu hoặc thương hiệu\.\.\."/g),
    ).toHaveLength(1);
    expect(markup).not.toContain('data-testid="catalogue-search-floating"');
    expect(markup).not.toContain("inert=");
  });

  it("renders a full-bleed image hero before the separate search interface", () => {
    const markup = renderToStaticMarkup(SupplierCataloguePage());

    expect(markup).toContain("%2Fimages%2Fmaterial-color-hero.webp");
    expect(markup).toContain(
      'alt="Các tấm ván MDF phủ bề mặt với nhiều màu và vân gỗ"',
    );
    expect(markup).toContain('fetchPriority="high"');
    expect(markup).toContain(">Mã màu</h1>");
    expect(markup).not.toContain(">Mã màu vật liệu</h1>");
    expect(markup).toContain('aria-label="Breadcrumb"');
    expect(markup).toContain("catalogue-hero-breadcrumb");
    expect(markup).toContain("catalogue-search-panel");
    expect(markup).toContain("catalogue-filter-deck");
    expect(markup).not.toContain("catalogue-liquid-glass");
    expect(markup).toContain("whitespace-nowrap");
    expect(markup.indexOf("catalogue-material-hero")).toBeLessThan(
      markup.indexOf('aria-label="Nhập mã màu, tên màu hoặc thương hiệu..."'),
    );
    expect(
      markup.indexOf('aria-label="Nhập mã màu, tên màu hoặc thương hiệu..."'),
    ).toBeLessThan(markup.indexOf("catalogue-filter-deck"));
    expect(markup.indexOf("catalogue-search-panel")).toBeLessThan(
      markup.indexOf("catalogue-filter-deck"),
    );
    expect(markup).not.toContain("Tra cứu theo mã thực tế");
    expect(markup).not.toContain(
      "Tra nhanh mã, tên màu và thương hiệu từ thư viện vật liệu đã xác minh.",
    );
  });

  it("uses compact customer-facing labels without the ranking note", () => {
    const markup = renderToStaticMarkup(SupplierCataloguePage());

    expect(markup).toContain(">Phân loại</p>");
    expect(markup).toContain(">Theo thương hiệu</span>");
    expect(markup.match(/>Theo thương hiệu<\/span>/g)).toHaveLength(1);
    expect(markup).toContain(">Tất cả thương hiệu</option>");
    expect(markup).not.toContain("Chọn nhóm vật liệu");
    expect(markup).not.toContain("Lọc theo nhà cung cấp");
    expect(markup).not.toContain("Mặc định ưu tiên ý định tra mã Melamine");
    expect(markup).toContain("catalogue-filter-row");
    expect(markup).not.toContain("Kiểu vân / màu");
    expect(markup).not.toContain("2.829</span>");
    expect(markup).not.toContain("846</span>");
  });

  it("keeps the requested ma-mau URL as a permanent alias", () => {
    const config = JSON.parse(readFileSync("vercel.json", "utf8")) as {
      redirects: Array<{
        source: string;
        destination: string;
        permanent: boolean;
      }>;
    };

    expect(config.redirects).toContainEqual({
      source: "/ma-mau/",
      destination: "/catalogue/",
      permanent: true,
    });
  });

  it("renders matching results before supplier sections", () => {
    const markup = renderToStaticMarkup(SupplierCataloguePage());

    expect(markup.indexOf("Kết quả phù hợp")).toBeLessThan(
      markup.indexOf("Theo nhà cung cấp"),
    );
  });

  it("distinguishes Thanh Thuy searchable imports from public product pages", () => {
    const markup = renderToStaticMarkup(SupplierCataloguePage());
    expect(markup).toContain("342 mã màu");
    expect(markup).toContain("373 mã màu");
    expect(markup).toContain("2195 mã màu");
    expect(markup).toContain("PPET/PVC, Mặt Top và mã cạnh An Cường");
    expect(markup).not.toContain("Panel và mã cạnh An Cường");
  });

  it("keeps visible control labels inside their accessible names", () => {
    const markup = renderToStaticMarkup(SupplierCataloguePage());

    expect(markup).toContain('aria-label="Chuyển ngôn ngữ VI | EN"');
    expect(markup).not.toContain("Sao chép mã");
    expect(markup).not.toContain(">Chi tiết<");
  });

  it("renders reusable supplier logos inside compact catalogue cards", () => {
    const markup = renderToStaticMarkup(SupplierCataloguePage());

    expect(markup).toContain("%2Fpartners%2Fthanh-thuy-logo.png");
    expect(supplierDefinitions.map((supplier) => supplier.logoSrc)).toEqual([
      "/partners/thanh-thuy-logo.png",
      "/partners/ba-thanh-logo.png",
      "/partners/an-cuong-logo.png",
    ]);
    expect(markup).toContain('data-testid="catalogue-card-link"');
  });
});
