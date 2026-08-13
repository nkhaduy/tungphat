import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("homepage editorial material hero", () => {
  const hero = readFileSync("components/home/HomeHero.tsx", "utf8");

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
    expect(hero).toContain("Vật liệu gỗ &amp; gia công tại xưởng");
    expect(hero).toContain("home-hero-copy");
    expect(hero).toContain("home-hero-visual");
    expect(hero).not.toContain("home-dot-grid");
    expect(hero).not.toContain("cnc-service-home.webp");
  });
});
