import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { ColorCodeSearch } from "@/components/catalog/ColorCodeSearch";
import { getBaThanhCodes } from "@/lib/catalog/ba-thanh";
import BaThanhMelamineHubPage from "@/app/ma-mau-melamine/ba-thanh/page";
import BaThanhCategoryPage from "@/app/ma-mau-melamine/ba-thanh/_views/category";
import ThanhThuyBrandRoute from "@/app/thuong-hieu/thanh-thuy/page";
import { ThanhThuyCategoryPage } from "@/components/thanh-thuy/ThanhThuyCategory";
import { getThanhThuyCatalog } from "@/lib/thanh-thuy";

describe("Ba Thanh search-first layout", () => {
  it("renders search and group selectors before a demand-ranked grid", () => {
    const source = getBaThanhCodes();
    const records = [
      source.find((record) => record.displayName === "BT 01")!,
      source.find((record) => record.displayName === "BT 111")!,
    ];
    const markup = renderToStaticMarkup(
      createElement(ColorCodeSearch, {
        records,
        categoryOptions: [
          { slug: "van-go", label: "Vân gỗ" },
          { slug: "don-sac", label: "Đơn sắc" },
        ],
      }),
    );

    expect(markup).toContain("Tìm mã BT 111 hoặc SC 020M");
    expect(markup.indexOf(">Vân gỗ</button>")).toBeLessThan(
      markup.indexOf(">BT 111</h3>"),
    );
    expect(markup.indexOf(">BT 111</h3>")).toBeLessThan(
      markup.indexOf(">BT 01</h3>"),
    );
  });
});

describe("supplier hub first viewport", () => {
  it("keeps Ba Thanh search in the first content section", () => {
    const markup = renderToStaticMarkup(createElement(BaThanhMelamineHubPage));
    const firstSection = markup.slice(
      markup.indexOf("<section"),
      markup.indexOf("</section>") + "</section>".length,
    );

    expect(firstSection).toContain("Tìm mã BT 111 hoặc SC 020M");
  });

  it("keeps Thanh Thuy search in the first content section", () => {
    const markup = renderToStaticMarkup(createElement(ThanhThuyBrandRoute));
    const firstSection = markup.slice(
      markup.indexOf("<section"),
      markup.indexOf("</section>") + "</section>".length,
    );

    expect(firstSection).toContain("Tìm tên hoặc mã Thanh Thuỳ");
  });

  it("keeps Ba Thanh category search before category support content", async () => {
    const page = await BaThanhCategoryPage({
      params: Promise.resolve({ category: "van-go" }),
    });
    const markup = renderToStaticMarkup(page);
    const firstSection = markup.slice(
      markup.indexOf("<section"),
      markup.indexOf("</section>") + "</section>".length,
    );

    expect(firstSection).toContain("Tìm mã BT 111 hoặc SC 020M");
  });

  it("keeps Thanh Thuy category search in the first content section", () => {
    const catalog = getThanhThuyCatalog();
    const category = catalog.categories.find(
      (item) => item.slug === "melamine",
    )!;
    const items = catalog.products.filter(
      (product) => product.categorySlug === category.slug,
    );
    const markup = renderToStaticMarkup(
      createElement(ThanhThuyCategoryPage, {
        category,
        items,
        zaloUrl: "https://zalo.me/0909259160",
      }),
    );
    const firstSection = markup.slice(
      markup.indexOf("<section"),
      markup.indexOf("</section>") + "</section>".length,
    );

    expect(firstSection).toContain("Tìm tên hoặc mã Thanh Thuỳ");
  });
});
