import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("public SEO and UX hierarchy", () => {
  const page = readFileSync("app/page.tsx", "utf8");
  const hero = readFileSync("components/home/HomeHero.tsx", "utf8");
  const home = readFileSync("components/home/HomeContent.tsx", "utf8");

  it("keeps local material and CNC intent with two working actions", () => {
    expect(page).toContain("Tùng Phát | Ván gỗ công nghiệp & Gia công CNC tại Thủ Đức");
    expect(hero).toContain("Ván gỗ công nghiệp");
    expect(hero).toContain("&amp; gia công CNC tại Thủ Đức");
    expect(hero).toContain('href="#ma-mau"');
    expect(hero).toContain("ZALO_URL");
  });

  it("separates materials, color codes and services", () => {
    for (const anchor of ['id="vat-lieu"', 'id="ma-mau"', 'id="nang-luc-cnc"', 'id="chi-nhanh"']) {
      expect(home).toContain(anchor);
    }
    expect(home).not.toContain('id="thuong-hieu"');
    expect(home).toContain("coreMaterialCards");
    expect(home).toContain("surfaceCatalogueCards");
    expect(home).toContain("FeaturedColorCodes");
  });

  it("keeps the floating Zalo action outside the page transition", () => {
    expect(page.indexOf('className="floating-zalo fixed')).toBeGreaterThan(page.indexOf("</SiteShell>"));
  });

  it("uses a working product menu and defers catalogue routes", () => {
    const header = readFileSync("components/site/SiteHeader.tsx", "utf8");
    const mobile = readFileSync("components/site/MobileNavigation.tsx", "utf8");
    expect(header).toContain('label: lang === "vi" ? "Sản phẩm"');
    expect(header).toContain("Mã màu / Catalogue");
    expect(header).toContain('href: "/catalogue"');
    expect(header).toContain("prefetch: false");
    expect(mobile).toContain("item.children?.length");
  });

  it("retains NAP, maps, privacy and conversion links in the footer", () => {
    const footer = readFileSync("components/site/SiteFooter.tsx", "utf8");
    for (const value of ["MST", "Mở Maps", "Google Maps", "Liên hệ báo giá", "Chính sách bảo mật"]) expect(footer).toContain(value);
  });
});
