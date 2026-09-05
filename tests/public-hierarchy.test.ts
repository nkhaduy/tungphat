import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("public SEO and UX hierarchy", () => {
  it("owns broad homepage intent without replacing dedicated material pages", () => {
    const page = readFileSync("app/page.tsx", "utf8");
    const hero = readFileSync("components/home/HomeHero.tsx", "utf8");

    expect(page).toContain(
      "MDF, MFC, Plywood, Gỗ Ghép & Gia Công CNC tại Thủ Đức | Tùng Phát",
    );
    expect(page).toContain("gỗ ghép, MDF, MFC, Plywood và chỉ dán cạnh");
    expect(hero).toMatch(/Vật liệu gỗ[\s\S]*và gia công CNC tại Thủ Đức/);
    expect(hero).toContain('href="/san-pham"');
    expect(hero).toContain('href="/catalogue"');
    expect(hero).toContain("Gửi quy cách qua Zalo");
  });

  it("keeps core materials and surface catalogue as separate homepage groups", () => {
    const content = readFileSync("components/home/HomeContent.tsx", "utf8");

    expect(content).toContain("MDF, MFC, Plywood và gỗ ghép");
    expect(content).toContain("Cốt ván / vật liệu");
    expect(content).toContain("Mã màu và bề mặt");
    expect(content).toContain("Nhà cung cấp &amp; bảng mã");
    expect(content).toContain('record.id === "thanh-thuy:301"');
    expect(content).toContain("record.canonicalRoute");
    expect(content).not.toContain("Sản phẩm nổi bật");
    expect(content).not.toContain("Bắt đầu với loại ván và độ dày cần dùng");
  });

  it("uses controlled navigation groups and keeps catalogue payload deferred", () => {
    const header = readFileSync("components/site/SiteHeader.tsx", "utf8");
    const mobile = readFileSync("components/site/MobileNavigation.tsx", "utf8");

    expect(header).toContain("Vật liệu");
    expect(header).toContain("Mã màu / Catalogue");
    expect(header).toContain("MFC & Plywood");
    expect(header).toContain("Gỗ ghép");
    expect(header).toContain('href: "/catalogue"');
    expect(header).toContain("prefetch: false");
    expect(mobile).toContain("item.children?.length");
    expect(mobile).toContain("{child.label}");
  });

  it("removes third-party footer embeds while retaining NAP and conversion links", () => {
    const footer = readFileSync("components/site/SiteFooter.tsx", "utf8");

    expect(footer).toContain("MST");
    expect(footer).toContain("Mở Maps");
    expect(footer).toContain("Gửi quy cách qua Zalo");
    expect(footer).not.toContain("facebook.com/plugins/page.php");
    expect(footer).not.toContain("<iframe");
  });

  it("derives legacy brand presentation from verified catalogue data", () => {
    const brand = readFileSync("components/BrandPage.tsx", "utf8");

    expect(brand).toContain("getSupplierSearchIndex");
    expect(brand).toContain("Dữ liệu catalogue");
    expect(brand).toContain("Nhóm mã đang có");
    expect(brand).not.toContain("Chưa có catalogue phù hợp trên trang");
    expect(brand).not.toContain("Chưa có mã sản phẩm trên trang");
  });
});
