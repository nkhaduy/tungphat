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

  it("uses the shorter Zalo contact action and the supplied wordmark asset", () => {
    const header = readFileSync("components/site/SiteHeader.tsx", "utf8");
    const hero = readFileSync("components/home/HomeHero.tsx", "utf8");
    expect(header).toContain("Liên hệ Zalo");
    expect(header).not.toContain("Gửi quy cách nhận báo giá");
    expect(existsSync("public/images/logo-zalo.webp")).toBe(true);
    expect(hero).toContain('/images/logo-zalo.webp');
  });

  it("gives the shared header a little more vertical presence", () => {
    const header = readFileSync("components/site/SiteHeader.tsx", "utf8");
    expect(header).toContain("h-[80px]");
  });
});
