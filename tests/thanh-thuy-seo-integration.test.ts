import { describe, expect, it } from "vitest";
import { absoluteUrl } from "@/lib/seo";
import { buildThanhThuySitemapEntries } from "@/lib/thanh-thuy-sitemap";

describe("catalogue canonical URL policy", () => {
  it("matches the site's trailing-slash export policy", () => {
    expect(absoluteUrl("/san-pham/melamine")).toBe(
      "https://mdftungphat.com/san-pham/melamine/",
    );
    expect(absoluteUrl("/thuong-hieu/thanh-thuy?x=1#catalogue")).toBe(
      "https://mdftungphat.com/thuong-hieu/thanh-thuy/?x=1#catalogue",
    );
    expect(absoluteUrl("/sitemap.xml")).toBe(
      "https://mdftungphat.com/sitemap.xml",
    );
  });

  it("publishes the canonical Thanh Thuy brand landing without source URLs", () => {
    const urls = buildThanhThuySitemapEntries(
      { supplier: "Thanh Thùy", sourceName: "Gỗ Thanh Thuỳ", categories: [], products: [] },
      "2026-08-04",
    ).map((entry) => entry.url);
    expect(urls).toContain("https://mdftungphat.com/thuong-hieu/thanh-thuy/");
    expect(urls.some((url) => url.includes("gothanhthuy.com"))).toBe(false);
  });
});
