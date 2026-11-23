import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import SupplierCataloguePage from "@/app/catalogue/page";
import { supplierDefinitions } from "@/lib/catalog/core/registry";

describe("catalogue hub customer journey", () => {
  it("renders search and primary selectors before supplier browsing", () => {
    const markup = renderToStaticMarkup(SupplierCataloguePage());
    const heading = "Bộ lọc";
    const search = "Nhập mã hoặc tên màu";
    const brand = "Thanh Thuỳ";

    expect(markup).toContain(heading);
    expect(markup).toContain(search);
    expect(markup).toContain(brand);
    expect(markup.indexOf("catalogue-material-hero")).toBeLessThan(markup.indexOf(search));
    expect(markup.indexOf(search)).toBeLessThan(markup.indexOf(heading));
    expect(markup.indexOf(heading)).toBeLessThan(markup.indexOf("Theo nhà cung cấp"));
  });

  it("renders only one catalogue search interface", () => {
    const markup = renderToStaticMarkup(SupplierCataloguePage());

    expect(markup.match(/id="catalogue-search"/g)).toHaveLength(1);
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
    expect(markup).toContain("id=\"catalogue-search\"");
    expect(markup).toContain("aria-label=\"Bộ lọc catalogue\"");
    expect(markup).not.toContain("catalogue-liquid-glass");
    expect(markup).toContain("whitespace-nowrap");
    expect(markup.indexOf("catalogue-material-hero")).toBeLessThan(
      markup.indexOf('id="catalogue-search"'),
    );
    expect(markup.indexOf('id="catalogue-search"')).toBeLessThan(markup.indexOf('aria-label="Bộ lọc catalogue"'));
    expect(markup).not.toContain("Tra cứu theo mã thực tế");
    expect(markup).not.toContain(
      "Tra nhanh mã, tên màu và thương hiệu từ thư viện vật liệu đã xác minh.",
    );
  });

  it("uses compact customer-facing labels without the ranking note", () => {
    const markup = renderToStaticMarkup(SupplierCataloguePage());

    expect(markup).toContain("Lọc theo thương hiệu");
    expect(markup).toContain("Loại mã / bề mặt");
    expect(markup).toContain("Nhóm vân");
    expect(markup).not.toContain("Tông màu");
    expect(markup).not.toContain("Ứng dụng");
    expect(markup).not.toContain("Mặc định ưu tiên ý định tra mã Melamine");
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

    expect(markup.indexOf("2.910 mã màu")).toBeLessThan(
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

  it("renders supplier logos and routes while deferring the full code grid", () => {
    const markup = renderToStaticMarkup(SupplierCataloguePage());
    const explorer = readFileSync("components/catalog/shared/CatalogueResultsExplorer.tsx", "utf8");

    expect(markup).toContain("%2Fpartners%2Fthanh-thuy-logo.png");
    expect(supplierDefinitions.map((supplier) => supplier.logoSrc)).toEqual(
      expect.arrayContaining([
        "/partners/thanh-thuy-logo.png",
        "/partners/an-cuong-logo.png",
        "/partners/ba-thanh-logo.png",
      ]),
    );
    expect(markup).toContain("Mở mã màu Thanh Thuỳ");
    expect(markup.match(/data-testid="catalogue-card-link"/g)).toHaveLength(48);
    expect(explorer).toContain("/data/catalogue-search-");
  });
});
