import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("homepage performance contracts", () => {
  it("defers Google Analytics until the browser is idle", () => {
    const analytics = readFileSync("components/Analytics.tsx", "utf8");

    expect(analytics).toContain('strategy="lazyOnload"');
    expect(analytics).not.toContain('strategy="afterInteractive"');
  });
});
