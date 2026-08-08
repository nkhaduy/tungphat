import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { auditStaticOutput } from "@/lib/seo-output-audit";

describe("static SEO output audit", () => {
  it("counts indexability and catches duplicate metadata and canonical errors", () => {
    const rootDir = mkdtempSync(path.join(tmpdir(), "tungphat-seo-audit-"));
    mkdirSync(path.join(rootDir, "other"), { recursive: true });
    mkdirSync(path.join(rootDir, "orphan"), { recursive: true });
    const html = (title: string, canonical: string, robots = "index, follow") => `<!doctype html><html><head><title>${title}</title><meta name="description" content="same"><meta name="robots" content="${robots}"><link rel="canonical" href="${canonical}"></head><body><h1>${title}</h1><a href="/other/">Other</a></body></html>`;
    writeFileSync(path.join(rootDir, "index.html"), html("Same title", "https://example.com/wrong/"));
    writeFileSync(path.join(rootDir, "other", "index.html"), html("Same title", "https://example.com.evil/other/").replace("</body>", '<a href="/missing/">Missing</a><a href="/material-reference.csv">CSV asset</a><script type="application/ld+json">{broken}</script></body>'));
    writeFileSync(path.join(rootDir, "orphan", "index.html"), html("Orphan title", "https://example.com/orphan"));
    writeFileSync(path.join(rootDir, "sitemap.xml"), "<urlset><url><loc>https://example.com/</loc></url><url><loc>https://example.com/missing/</loc></url></urlset>");
    writeFileSync(path.join(rootDir, "robots.txt"), "User-agent: *\nAllow: /\n\nUser-agent: GPTBot\nDisallow: /\n\nSitemap: https://example.com/sitemap.xml\n");

    const result = auditStaticOutput({ rootDir, siteUrl: "https://example.com", expectedDirectAnswerRoutes: ["/"] });

    expect(result.indexableUrls).toBe(3);
    expect(result.invalidCanonicals).toBe(3);
    expect(result.duplicateTitles).toBe(1);
    expect(result.duplicateDescriptions).toBe(1);
    expect(result.brokenLinks).toBe(1);
    expect(result.schemaErrors).toBe(1);
    expect(result.orphanPages).toBe(1);
    expect(result.thinIndexablePages).toBe(3);
    expect(result.missingDirectAnswerRoutes).toEqual(["/"]);
    expect(result.aiCrawlerBlockers).toBe(1);
    expect(result.sitemapErrors).toBeGreaterThan(0);
  });
});
