import { describe, expect, it } from "vitest";
import {
  parseSitemapLocations,
  selectCanonicalProductUrls,
} from "@/scripts/ancuong/discover-sitemaps";

describe("An Cuong full sitemap discovery", () => {
  it("extracts declared sitemap locations and decodes XML entities", () => {
    expect(parseSitemapLocations(`
      <sitemapindex>
        <sitemap><loc>https://ancuong.com/sitemap-product.xml</loc></sitemap>
        <sitemap><loc>https://ancuong.com/sitemap-category-product.xml?x=1&amp;y=2</loc></sitemap>
      </sitemapindex>
    `)).toEqual([
      "https://ancuong.com/sitemap-product.xml",
      "https://ancuong.com/sitemap-category-product.xml?x=1&y=2",
    ]);
  });

  it("chooses one Vietnamese canonical URL per numeric product ID and retains every locale alias", () => {
    const result = selectCanonicalProductUrls([
      "https://ancuong.com/melamine-panel/303000078-en.html",
      "https://ancuong.com/melamine/303000078.html",
      "https://ancuong.com/eco-veneer-en/303002267-en.html",
      "https://ancuong.com/eco-veneer/303002267.html",
      "https://ancuong.com/laminate/fine-weave-grey.html",
    ]);

    expect(result.canonicalProductUrls).toEqual([
      "https://ancuong.com/eco-veneer/303002267.html",
      "https://ancuong.com/melamine/303000078.html",
    ]);
    expect(result.aliases).toEqual(expect.arrayContaining([
      expect.objectContaining({
        url: "https://ancuong.com/melamine-panel/303000078-en.html",
        canonicalUrl: "https://ancuong.com/melamine/303000078.html",
        locale: "en",
        sourceId: "303000078",
      }),
    ]));
    expect(result.nonNumericProductUrls).toEqual([
      "https://ancuong.com/laminate/fine-weave-grey.html",
    ]);
  });
});
