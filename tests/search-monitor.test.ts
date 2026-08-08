import { describe, expect, it } from "vitest";
import { annotateSearchRecords, compareSearchReports, summarizeSearchRecords, type SearchMonitorRecord } from "@/lib/search-monitor";

const record = (overrides: Partial<SearchMonitorRecord> = {}): SearchMonitorRecord => ({
  query: "ván MDF là gì",
  category: "informational",
  engine: "Bing Web Search RSS",
  checkedAt: "2026-08-09T00:00:00.000Z",
  responseStatus: 200,
  searchAvailable: true,
  found: false,
  sourcePosition: null,
  directAiCitation: null,
  targetUrl: "/van-mdf/",
  targetStatus: 200,
  targetIndexable: true,
  targetAvailable: true,
  competitorSources: ["kosmos.vn"],
  limitation: "Public web search source observation; not a direct AI-answer citation and not a ranking guarantee.",
  ...overrides,
});

describe("search monitor reports", () => {
  it("summarizes comparable records by category and competitor frequency", () => {
    const summary = summarizeSearchRecords([record(), record({ query: "MDF chống ẩm là gì", category: "commercial", found: true, competitorSources: ["govi.vn"] })]);
    expect(summary.foundCount).toBe(1);
    expect(summary.citedCount).toBeNull();
    expect(summary.directAiCitationAvailable).toBe(false);
    expect(summary.categoryCounts.informational).toMatchObject({ queries: 1, found: 0 });
    expect(summary.topCompetitors[0]).toEqual({ domain: "govi.vn", observationCount: 1 });
  });

  it("detects gained/lost presence, new competitors, and target indexability changes", () => {
    const previous = [record()];
    const current = [record({ found: true, sourcePosition: 3, competitorSources: ["govi.vn"] }), record({ query: "MDF chống ẩm là gì", targetIndexable: false })];
    expect(compareSearchReports(current, previous)).toEqual({
      gainedPresence: ["ván MDF là gì"],
      lostPresence: [],
      newCompetitors: ["govi.vn"],
      indexabilityChanges: [],
    });
  });

  it("does not report losses when the current measurement is unavailable", () => {
    const previous = [record({ found: true, sourcePosition: 2 })];
    const current = [record({ searchAvailable: false, responseStatus: 429, found: false, targetAvailable: false, targetStatus: null, targetIndexable: null })];
    expect(compareSearchReports(current, previous)).toMatchObject({ lostPresence: [], indexabilityChanges: [] });
  });

  it("adds comparable per-query change states and previous presence", () => {
    const previous = [record({ query: "gained", found: false }), record({ query: "same", found: true }), record({ query: "lost", found: true })];
    const current = [record({ query: "gained", found: true }), record({ query: "same", found: true }), record({ query: "lost", found: false }), record({ query: "absent", found: false })];

    expect(annotateSearchRecords(current, previous, "phase4-20260809").map(({ query, runId, previousPresence, changeState }) => ({ query, runId, previousPresence, changeState }))).toEqual([
      { query: "gained", runId: "phase4-20260809", previousPresence: false, changeState: "NEW" },
      { query: "same", runId: "phase4-20260809", previousPresence: true, changeState: "SAME" },
      { query: "lost", runId: "phase4-20260809", previousPresence: true, changeState: "LOST" },
      { query: "absent", runId: "phase4-20260809", previousPresence: null, changeState: "NOT_FOUND" },
    ]);
  });

  it("labels rate-limited or timed-out observations as unavailable", () => {
    const unavailable = record({ searchAvailable: false, responseStatus: 429, found: false });

    expect(annotateSearchRecords([unavailable], [], "phase4-20260809")[0]).toMatchObject({
      previousPresence: null,
      changeState: "UNAVAILABLE",
    });
  });
});
