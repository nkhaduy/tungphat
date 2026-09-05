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
    expect(hero).toContain("Liên hệ báo giá");
  });

  it("keeps products and color-code lookup as separate homepage groups", () => {
    const content = readFileSync("components/home/HomeContent.tsx", "utf8");
    const taxonomy = readFileSync("lib/product-taxonomy.ts", "utf8");

    expect(content).toContain("MDF, MFC, Plywood và gỗ ghép");
    expect(content).toContain('eyebrow="Sản phẩm"');
    expect(content).toContain("Mã màu theo vật liệu");
    expect(content).toContain('>MÃ MÀU<');
    expect(content).toContain("Mở mã màu");
    expect(content).toContain("Cốt ván / vật liệu chính");
    expect(content).toContain("Bề mặt / catalogue");
    expect(content).not.toContain("Nhà cung cấp &amp; bảng mã");
    expect(content).not.toContain("Chọn nhóm bề mặt");
    expect(taxonomy).toContain("Melamine");
    expect(taxonomy).toContain("Laminate");
    expect(taxonomy).toContain("Acrylic");
    expect(taxonomy).toContain("Veneer");
    expect(taxonomy).not.toContain("PVC");
    expect(content).toContain('record.id === "thanh-thuy:301"');
    expect(content).toContain("record.canonicalRoute");
    expect(content).not.toContain("Sản phẩm nổi bật");
    expect(content).not.toContain("Bắt đầu với loại ván và độ dày cần dùng");
  });

  it("keeps the homepage floating Zalo bubble outside the animated content wrapper", () => {
    const page = readFileSync("app/page.tsx", "utf8");
    const siteShellEnd = page.indexOf("</SiteShell>");
    const floatingZalo = page.indexOf('className="floating-zalo fixed');

    expect(siteShellEnd).toBeGreaterThan(-1);
    expect(floatingZalo).toBeGreaterThan(siteShellEnd);
  });

  it("uses the shorter CNC, address, article, and quote labels", () => {
    const content = readFileSync("components/home/HomeContent.tsx", "utf8");

    for (const label of [
      "Cắt và gia công CNC",
      "Dán chỉ",
      "Thiết kế theo hình ảnh, yêu cầu",
      "Báo giá rõ ràng trước khi cắt",
      "Địa chỉ",
      "Bài viết nổi bật",
      "Liên hệ báo giá",
    ]) {
      expect(content).toContain(label);
    }
    expect(content).not.toContain("Khoan liên kết");
    expect(content).not.toContain("Soi rãnh");
    expect(content).not.toContain("Cắt biên dạng");
    expect(content).not.toContain("Địa điểm Tùng Phát");
    expect(content).not.toContain("Trao đổi nhu cầu thực tế");
    expect(content).not.toContain("Gửi danh sách chi tiết, vật liệu, độ dày và số lượng.");
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
    expect(footer).toContain("Liên hệ báo giá");
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
