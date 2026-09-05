import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("homepage editorial material hero", () => {
  const hero = readFileSync("components/home/HomeHero.tsx", "utf8");
  const catalogue = readFileSync(
    "components/catalog/shared/SupplierCatalogSearch.tsx",
    "utf8",
  );

  it("uses the supplied material image as a responsive LCP asset", () => {
    expect(hero).toContain("/images/material-panels-hero.webp");
    expect(hero).toContain("/images/material-panels-hero.avif");
    expect(hero).toContain("/images/material-panels-hero-960.avif");
    expect(hero).toContain('fetchPriority="high"');
    expect(hero).toContain('loading="eager"');
    expect(hero).toContain("material-panels-hero-image");
  });

  it("keeps the homepage hero editorial and leaves the catalogue hero untouched", () => {
    expect(hero).toContain('id="trang-chu"');
    expect(hero).toContain("CÔNG TY TNHH TMDV GỖ TÙNG PHÁT");
    expect(hero).not.toContain("Vật liệu gỗ &amp; gia công tại xưởng");
    expect(hero).toContain("home-hero-copy");
    expect(hero).toContain("home-hero-visual");
    expect(hero).toContain("leading-[1.12]");
    expect(hero).not.toContain("home-dot-grid");
    expect(hero).not.toContain("cnc-service-home.webp");
    expect(catalogue).toContain("catalogue-material-hero");
    expect(catalogue).toContain("/images/material-color-hero.webp");
    expect(catalogue).not.toContain("material-panels-hero");
  });

  it("keeps focused local commercial hero actions", () => {
    expect(hero).toContain("Xem vật liệu");
    expect(hero).toContain("Mở catalogue");
    expect(hero).toContain("Gửi quy cách qua Zalo");
    expect(hero).toContain("/catalogue");
    expect(hero).toContain("/san-pham");
    expect(hero).not.toContain("Liên hệ");
    expect(hero).not.toContain("Xem báo giá");
    expect(hero.match(/className="pressable inline-flex/g)).toHaveLength(3);
  });

  it("removes the homepage utility, benefits, and answer blocks", () => {
    const page = readFileSync("app/page.tsx", "utf8");
    const content = readFileSync("components/home/HomeContent.tsx", "utf8");
    expect(page).not.toContain("RequirementFinder");
    expect(page).not.toContain("HomeBenefits");
    expect(page).not.toContain("thirdMobileAction");
    expect(page).not.toContain("requirement-finder");
    expect(content).not.toContain("data-answer-block");
    expect(content).not.toContain("Trả lời nhanh");
  });

  it("keeps the hero image covering the full frame without exposed edges", () => {
    const styles = readFileSync("app/globals.css", "utf8");
    expect(styles).toContain(".material-panels-hero-image");
    expect(styles).toContain("transform: scale(1.01)");
  });
});
