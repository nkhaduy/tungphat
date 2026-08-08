import { describe, expect, it } from "vitest";
import { buildPhase5Report } from "@/lib/phase5-report";

describe("Phase 5 snapshot", () => {
  it("keeps authenticated metrics null and public observations separate", () => {
    const report = buildPhase5Report({
      generatedAt: "2026-08-09T00:00:00.000Z",
      production: { sha: "abc", deploymentId: "dpl_test", status: "READY" },
      crawl: { indexable: 19, directAnswerPages: 18, verifiedDataPages: 11, sourceProvenancePages: 15, thinIndexablePages: 0, canonicalErrors: 0, schemaErrors: 0, brokenLinks: 0, aiCrawlerBlockers: 0 },
      indexation: { summary: { google: { observed: 0, notObserved: 0, unknown: 19 }, bing: { observed: 0, notObserved: 19, unknown: 0 } } },
      materials: { records: 9, sources: 10 },
      entity: { corroborated: 2, mismatches: 0 },
      query: { covered: 90, partial: 0, gap: 0, shouldNotTarget: 10 },
      performance: { samples: [], median: null },
      indexNow: null,
      benchmark: null,
      verification: {},
      blockers: ["Authenticated search accounts unavailable."],
    });

    expect(report.authentication.googleSearchConsole).toMatchObject({ status: "BLOCKED_AUTH", indexedUrls: null, impressions: null });
    expect(report.authentication.bingWebmaster).toMatchObject({ status: "BLOCKED_AUTH", indexedUrls: null });
    expect(report.indexation.google).toMatchObject({ observed: 0, confirmedIndexed: null, unknown: 19 });
    expect(report.indexation.bing).toMatchObject({ observed: 0, confirmedIndexed: null, notObserved: 19 });
    expect(report.seoGeo).toMatchObject({ materialRecords: 9, provenanceSources: 10, entityVerifiedConsistent: 2, queryCovered: 90, queryPartial: 0 });
    expect(report.aiRetrieval.directCitations).toBeNull();
  });
});
