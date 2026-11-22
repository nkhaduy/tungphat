import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { getSiteHeaderClasses, type SiteHeaderTone } from "@/lib/site-header";

describe("site header presentation", () => {
  it("keeps the header transparent at the top and adds a solid surface after scrolling", () => {
    expect(getSiteHeaderClasses(false, "light")).toBe(
      "site-header--top site-header--tone-light",
    );
    expect(getSiteHeaderClasses(false, "light")).toContain("site-header--tone-light");
    expect(getSiteHeaderClasses(true, "light")).toBe(
      "site-header--scrolled site-header--tone-light",
    );
    expect(getSiteHeaderClasses(true, "light")).not.toContain("site-header--top");
  });

  it("uses the dark-hero contrast theme without changing the scrolled surface", () => {
    const tone: SiteHeaderTone = "dark";
    expect(getSiteHeaderClasses(false, tone)).toContain("site-header--tone-dark");
    expect(getSiteHeaderClasses(true, tone)).toContain("site-header--scrolled");
    expect(getSiteHeaderClasses(true, tone)).toContain("site-header--tone-dark");
  });

  it("uses the phone contact action and keeps the supplied asset", () => {
    const header = readFileSync("components/site/SiteHeader.tsx", "utf8");
    expect(header).toContain("Gọi số");
    expect(header).not.toContain("Gửi quy cách nhận báo giá");
    expect(existsSync("public/images/logo-zalo.webp")).toBe(true);
  });

  it("gives the shared header a little more vertical presence", () => {
    const header = readFileSync("components/site/SiteHeader.tsx", "utf8");
    expect(header).toContain("h-[80px]");
  });

  it("uses refined navigation labels and removes the workshop link from navigation", () => {
    const header = readFileSync("components/site/SiteHeader.tsx", "utf8");
    const footer = readFileSync("components/site/SiteFooter.tsx", "utf8");
    expect(header).toContain('lang === "vi" ? "Mã màu" : "Color codes"');
    expect(header).toContain('lang === "vi" ? "Cắt CNC" : "Cutting & CNC"');
    expect(header).toContain('lang === "vi" ? "Bài viết" : "Articles"');
    expect(header).not.toContain('"Xưởng & chi nhánh"');
    expect(footer).toContain('["Bài viết", "/bai-viet"]');
    expect(footer).not.toContain('"Xưởng & chi nhánh"');
  });
});
