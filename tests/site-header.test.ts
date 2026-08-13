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
});
