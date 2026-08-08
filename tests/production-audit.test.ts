import { describe, expect, it } from "vitest";
import { evaluateProductionAssets, evaluateProductionQualityGates, evaluateSecurityHeaders } from "@/lib/production-audit";

describe("production audit quality gates", () => {
  it("requires all public retrieval and IndexNow endpoints", () => {
    expect(evaluateProductionAssets({ robots: 200, sitemap: 200, knowledge: 200, llms: 200, indexNowKey: 200 })).toEqual({ errors: 0, missing: [] });
    expect(evaluateProductionAssets({ robots: 200, sitemap: 200, knowledge: 404, llms: 200, indexNowKey: 404 }).missing).toEqual(["knowledge.json", "indexnow-key.txt"]);
  });

  it("checks the complete production security header baseline", () => {
    const result = evaluateSecurityHeaders({
      "content-security-policy": "default-src 'self'",
      "strict-transport-security": "max-age=31536000",
      "x-content-type-options": "nosniff",
      "referrer-policy": "strict-origin-when-cross-origin",
      "permissions-policy": "camera=()",
    });
    expect(result.errors).toBe(0);
    expect(evaluateSecurityHeaders({}).missing).toHaveLength(5);
  });

  it("fails CI when any blocking production metric regresses", () => {
    expect(evaluateProductionQualityGates({ canonicalErrors: 0, schemaErrors: 0, brokenLinks: 0, sitemapErrors: 0, aiCrawlerBlockers: 0, thinIndexablePages: 0, orphanPages: 0, retrievalAssetErrors: 0, securityErrors: 0 })).toEqual([]);
    expect(evaluateProductionQualityGates({ canonicalErrors: 0, schemaErrors: 0, brokenLinks: 1, sitemapErrors: 0, aiCrawlerBlockers: 0, thinIndexablePages: 0, orphanPages: 0, retrievalAssetErrors: 1, securityErrors: 0 })).toEqual(["brokenLinks", "retrievalAssets"]);
  });
});
