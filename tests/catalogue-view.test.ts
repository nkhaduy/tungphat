import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CatalogueView } from "@/components/CatalogueView";
import { AnCuongCatalogueSearch } from "@/components/catalog/AnCuongCatalogueSearch";
import type { CatalogSearchEntry } from "@/lib/catalog/core/types";
import { getBrand, type Brand } from "@/lib/brands";

describe("CatalogueView", () => {
  it("does not render file actions for catalogue records without a verified PDF URL", () => {
    const brand: Brand = {
      slug: "test-brand",
      name: "Test Brand",
      logo: "",
      description: "Test catalogue data",
      products: [],
      catalogues: [
        {
          name: "Draft catalogue",
          thumbnail: "",
          description: "No verified file yet",
          pdfUrl: "",
        },
      ],
    };

    const html = renderToStaticMarkup(createElement(CatalogueView, { brand }));

    expect(html).not.toContain("Xem file");
    expect(html).not.toContain("Tải PDF");
    expect(html).toContain("Chưa có file catalogue được publish");
  });

  it("puts the complete An Cuong search in the first content section without sample-only wording", () => {
    const brand = getBrand("an-cuong")!;
    const html = renderToStaticMarkup(createElement(CatalogueView, { brand }));
    const firstSection = html.slice(
      html.indexOf("<section"),
      html.indexOf("</section>") + "</section>".length,
    );

    expect(firstSection).toContain("Tìm mã, tên hoặc dòng vật liệu An Cường");
    expect(firstSection).toMatch(/[1-9][0-9]{3} mục tra cứu/);
    expect(firstSection.toLowerCase()).not.toContain("dữ liệu mẫu");
  });

  it("bounds An Cuong result rendering for mobile and large catalogues", () => {
    const entries: CatalogSearchEntry[] = Array.from({ length: 100 }, (_, index) => ({
      id: `an-cuong:sku:${index}`,
      supplierId: "an-cuong",
      supplierName: "An Cường",
      kind: "catalogue-item",
      recordType: "sku",
      code: `AC ${index}`,
      normalizedCode: `AC${index}`,
      name: `Vật liệu ${index}`,
      thumbnail: "",
      canonicalRoute: "/catalogue/an-cuong/",
      category: "Melamine",
      material: "melamine",
    }));
    const html = renderToStaticMarkup(createElement(AnCuongCatalogueSearch, { entries }));

    expect((html.match(/<article/g) ?? [])).toHaveLength(48);
    expect(html).toContain("100 mục phù hợp");
  });

  it("shows unavailable swatches and a direct An Cuong inquiry action", () => {
    const entry: CatalogSearchEntry = {
      id: "an-cuong:sku:swatch-check",
      supplierId: "an-cuong",
      supplierName: "An Cường",
      kind: "catalogue-item",
      recordType: "sku",
      code: "MFC - MS 01012 T",
      normalizedCode: "MFCMS01012T",
      name: "Laricio Pine",
      thumbnail: "",
      canonicalRoute: "/catalogue/an-cuong/melamine/",
      category: "Melamine",
      material: "melamine",
    };
    const html = renderToStaticMarkup(createElement(AnCuongCatalogueSearch, { entries: [entry] }));
    expect(html).toContain("Chưa có swatch cục bộ");
    expect(html).toContain("Gửi mã qua Zalo");
  });
});
