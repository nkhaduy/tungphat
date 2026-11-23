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

  it("ignores only explicitly isolated CMS routes missing from a preview export", () => {
    const rootDir = mkdtempSync(path.join(tmpdir(), "tungphat-seo-preview-audit-"));
    const html = '<!doctype html><html><head><title>Preview</title><meta name="description" content="Preview page"><link rel="canonical" href="https://example.com/"></head><body><a href="/staging-known/">Known staging route</a><a href="/unexpected-missing/">Unexpected route</a></body></html>';
    writeFileSync(path.join(rootDir, "index.html"), html);
    writeFileSync(path.join(rootDir, "sitemap.xml"), "<urlset><url><loc>https://example.com/</loc></url></urlset>");
    writeFileSync(path.join(rootDir, "robots.txt"), "User-agent: *\nAllow: /\nSitemap: https://example.com/sitemap.xml\n");

    const result = auditStaticOutput({ rootDir, siteUrl: "https://example.com", allowedMissingRoutes: ["/staging-known/"] });

    expect(result.brokenLinks).toBe(1);
  });

  it("validates preview canonicals and content while ignoring the private sitemap's production indexability", () => {
    const rootDir = mkdtempSync(path.join(tmpdir(), "tungphat-seo-preview-indexing-"));
    const html = '<!doctype html><html><head><title>Trang preview</title><meta name="description" content="Nội dung kiểm thử preview"><meta name="robots" content="noindex, nofollow"><link rel="canonical" href="https://example.com/san-pham/"></head><body><h1>Sản phẩm</h1><section data-answer-block><p>Thông tin sản phẩm dùng để kiểm tra nội dung.</p></section></body></html>';
    mkdirSync(path.join(rootDir, "san-pham"), { recursive: true });
    writeFileSync(path.join(rootDir, "san-pham", "index.html"), html);
    writeFileSync(path.join(rootDir, "sitemap.xml"), "<urlset><url><loc>https://example.com/san-pham/</loc></url></urlset>");
    writeFileSync(path.join(rootDir, "robots.txt"), "User-agent: *\nAllow: /\nSitemap: https://example.com/sitemap.xml\n");

    const result = auditStaticOutput({
      rootDir,
      siteUrl: "https://example.com",
      previewBuild: true,
      expectedDirectAnswerRoutes: ["/san-pham/"],
    });

    expect(result.indexableUrls).toBe(0);
    expect(result.invalidCanonicals).toBe(0);
    expect(result.sitemapErrors).toBe(0);
    expect(result.missingDirectAnswerRoutes).toEqual([]);
  });

  it("still catches invalid canonicals on noindex preview pages", () => {
    const rootDir = mkdtempSync(path.join(tmpdir(), "tungphat-seo-preview-canonical-"));
    const html = '<!doctype html><html><head><title>Preview</title><meta name="robots" content="noindex, nofollow"><link rel="canonical" href="https://example.com/wrong/"></head><body><h1>Preview page</h1></body></html>';
    mkdirSync(rootDir, { recursive: true });
    writeFileSync(path.join(rootDir, "index.html"), html);
    writeFileSync(path.join(rootDir, "sitemap.xml"), "<urlset></urlset>");
    writeFileSync(path.join(rootDir, "robots.txt"), "User-agent: *\nAllow: /\nSitemap: https://example.com/sitemap.xml\n");

    const result = auditStaticOutput({ rootDir, siteUrl: "https://example.com", previewBuild: true });

    expect(result.invalidCanonicals).toBe(1);
  });
});
