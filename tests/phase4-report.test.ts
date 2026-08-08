import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("Phase 4 snapshot", () => {
  it("records measured growth and preserves unavailable authenticated metrics as null", () => {
    const directory = mkdtempSync(path.join(tmpdir(), "tungphat-phase4-report-"));
    const output = path.join(directory, "phase4-search-growth.json");

    execFileSync("./node_modules/.bin/tsx", ["scripts/build-phase4-report.ts"], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        PHASE4_REPORT_OUTPUT: output,
        DEPLOYED_SHA: "test-sha",
        DEPLOYMENT_ID: "test-deployment",
        LIGHTHOUSE_MOBILE_SCORE: "91",
        LIGHTHOUSE_LCP_MS: "2400",
      },
    });

    const report = JSON.parse(readFileSync(output, "utf8"));
    expect(report).toMatchObject({ phase: "4", production: { deployedSha: "test-sha", deploymentId: "test-deployment" } });
    expect(report.performance.before.mobileScore).toBe(78);
    expect(report.performance.after).toMatchObject({ mobileScore: 91, lcpMs: 2400 });
    expect(report.queryMap).toMatchObject({ queryCount: 100, covered: 87, partial: 3, gap: 0, shouldNotTarget: 10 });
    expect(report.authentication.googleSearchConsole).toMatchObject({ status: "BLOCKED_AUTH", clicks: null, impressions: null });
    expect(report.searchBenchmark.phase4).toBeNull();
    expect(report.verification.productionCrawl).toBeNull();
    expect(report.performance.before.source).toContain("Phase 3");
    expect(report.performance.fieldData).toBeNull();
    expect(report.informationMoat.cncPreflightChecks).toBe(12);
    expect(report.informationMoat.publishedArticles).toBe(3);
    expect(report.blockers).toContain("GSC/Google Business Profile authentication unavailable in Codex browser session.");
  });

  it("uses only explicit Phase 4 evidence and derives auth blockers from statuses", () => {
    const directory = mkdtempSync(path.join(tmpdir(), "tungphat-phase4-evidence-"));
    const output = path.join(directory, "phase4-search-growth.json");
    const crawlPath = path.join(directory, "crawl.json");
    const monitorPath = path.join(directory, "monitor.json");
    const gscPath = path.join(directory, "gsc.json");
    const bingPath = path.join(directory, "bing.json");
    writeFileSync(crawlPath, JSON.stringify({ indexable: 19, schemaErrors: 0, brokenLinks: 0 }));
    writeFileSync(monitorPath, JSON.stringify({ summary: { foundCount: 1, citedCount: null }, comparison: {}, records: [] }));
    writeFileSync(gscPath, JSON.stringify({ status: "PASS", clicks: 1, impressions: 10 }));
    writeFileSync(bingPath, JSON.stringify({ status: "VERIFIED", indexedUrls: 19 }));

    execFileSync("./node_modules/.bin/tsx", ["scripts/build-phase4-report.ts"], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        PHASE4_REPORT_OUTPUT: output,
        PHASE4_CRAWL_PATH: crawlPath,
        PHASE4_MONITOR_PATH: monitorPath,
        GSC_BASELINE_PATH: gscPath,
        BING_BASELINE_PATH: bingPath,
        GBP_STATUS: "VERIFIED",
        BING_PLACES_STATUS: "VERIFIED",
      },
    });

    const report = JSON.parse(readFileSync(output, "utf8"));
    expect(report.searchBenchmark.phase4.summary.foundCount).toBe(1);
    expect(report.verification.productionCrawl.indexable).toBe(19);
    expect(report.authentication.googleSearchConsole.status).toBe("PASS");
    expect(report.authentication.bingWebmaster.status).toBe("VERIFIED");
    expect(report.blockers.join(" ")).not.toMatch(/GSC|Bing Webmaster|Business Profile authentication/u);
  });
});
