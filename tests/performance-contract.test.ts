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
    const footer = readFileSync("components/site/SiteFooter.tsx", "utf8");

    expect(header).toMatch(
      /href:\s*"\/catalogue",\s*prefetch:\s*false,/,
    );
    expect(header).toContain("prefetch={item.prefetch}");
    expect(mobileNavigation).toContain("prefetch={item.prefetch}");
    expect(hero).toContain('href="/catalogue"');
    expect(hero).toContain("prefetch={false}");
    expect(footer).toContain('["Mã màu / Catalogue", "/catalogue"]');
    expect(footer).toContain('prefetch={href === "/catalogue" ? false : undefined}');
  });
});
