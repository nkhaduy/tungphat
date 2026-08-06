import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CatalogueView } from "@/components/CatalogueView";
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

  it("puts An Cuong sample search in the first content section", () => {
    const brand = getBrand("an-cuong")!;
    const html = renderToStaticMarkup(createElement(CatalogueView, { brand }));
    const firstSection = html.slice(
      html.indexOf("<section"),
      html.indexOf("</section>") + "</section>".length,
    );

    expect(firstSection).toContain("Tìm mã hoặc tên mẫu An Cường");
    expect(firstSection).toContain("7 mẫu dữ liệu tham khảo");
  });
});
