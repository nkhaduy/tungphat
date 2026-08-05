import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CatalogueView } from "@/components/CatalogueView";
import type { Brand } from "@/lib/brands";

describe("CatalogueView", () => {
  it("does not render file actions for catalogue records without a verified PDF URL", () => {
    const brand: Brand = {
      slug: "test-brand",
      name: "Test Brand",
      logo: "",
      description: "Test catalogue data",
      products: [],
      catalogues: [{
        name: "Draft catalogue",
        thumbnail: "",
        description: "No verified file yet",
        pdfUrl: ""
      }]
    };

    const html = renderToStaticMarkup(createElement(CatalogueView, { brand }));

    expect(html).not.toContain("Xem file");
    expect(html).not.toContain("Tải PDF");
    expect(html).toContain("Chưa có file catalogue được publish");
  });
});
