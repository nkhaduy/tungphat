import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
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
  });
});
