import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("homepage performance contracts", () => {
  it("defers Google Analytics until the browser is idle", () => {
    const analytics = readFileSync("components/Analytics.tsx", "utf8");

    expect(analytics).toContain('strategy="lazyOnload"');
    expect(analytics).not.toContain('strategy="afterInteractive"');
  });

  it("does not prefetch catalogue-scale routes from the initial shell", () => {
    const header = readFileSync("components/site/SiteHeader.tsx", "utf8");
    const mobileNavigation = readFileSync(
      "components/site/MobileNavigation.tsx",
      "utf8",
    );
    const hero = readFileSync("components/home/HomeHero.tsx", "utf8");
    const featuredCodes = readFileSync("components/home/FeaturedColorCodes.tsx", "utf8");
    const footer = readFileSync("components/site/SiteFooter.tsx", "utf8");

    expect(header).toMatch(
      /href:\s*DEFAULT_CATALOGUE_URL,\s*prefetch:\s*false,/,
    );
    expect(header).toContain("prefetch={item.prefetch}");
    expect(mobileNavigation).toContain("prefetch={item.prefetch}");
    expect(hero).toContain('href={DEFAULT_CATALOGUE_URL} prefetch={false}');
    expect(hero).toContain('fetchPriority="high"');
    expect(hero).not.toContain('href="/catalogue"');
    expect(featuredCodes).toContain('href={code.href} prefetch={false}');
    expect(footer).toContain('["Mã màu", DEFAULT_CATALOGUE_URL]');
    expect(footer).toContain('prefetch={href === DEFAULT_CATALOGUE_URL ? false : undefined}');
  });

  it("keeps featured color cards horizontally swipeable on touch screens", () => {
    const styles = readFileSync("app/globals.css", "utf8");
    const marqueeRules = styles.match(/\.color-code-marquee\s*\{[^}]*\}/)?.[0] ?? "";
    expect(marqueeRules).toContain("overflow-x: auto");
    expect(marqueeRules).toContain("touch-action: pan-x");
  });
});
