import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import SupplierMaterialRoute from "@/app/catalogue/[supplier]/[material]/page";
import { CatalogueView } from "@/components/CatalogueView";
import { getBrand } from "@/lib/brands";
import { getSupplierSitemapEntries } from "@/lib/catalog/suppliers/sitemap";

function sitemapPaths(prefix: string, segmentCount: number) {
  return getSupplierSitemapEntries("2026-08-09T00:00:00.000Z")
    .map((entry) => entry.path)
    .filter((path) => path.startsWith(prefix) && path.split("/").filter(Boolean).length === segmentCount);
}

function renderedHref(path: string) {
  return path === "/" ? path : path.replace(/\/$/u, "");
}

describe("crawlable supplier catalogue links", () => {
  it("links every indexable An Cuong material collection from its supplier hub", () => {
    const brand = getBrand("an-cuong");
    expect(brand).toBeDefined();

    const markup = renderToStaticMarkup(createElement(CatalogueView, { brand: brand! }));
    const materialPaths = sitemapPaths("/catalogue/an-cuong/", 3);

    expect(materialPaths.length).toBeGreaterThan(1);
    for (const path of materialPaths) expect(markup).toContain(`href="${renderedHref(path)}"`);
  });

  it("links every indexable Ba Thanh melamine detail from its material collection", async () => {
    const page = await SupplierMaterialRoute({
      params: Promise.resolve({ supplier: "ba-thanh", material: "melamine" }),
    });
    const markup = renderToStaticMarkup(page);
    const detailPaths = sitemapPaths("/catalogue/ba-thanh/melamine/", 4);

    expect(detailPaths.length).toBeGreaterThan(1);
    for (const path of detailPaths) expect(markup).toContain(`href="${renderedHref(path)}"`);
  });
});
