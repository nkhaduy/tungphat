import { describe, expect, it } from "vitest";
import { compareSearchReports, summarizeSearchRecords, type SearchMonitorRecord } from "@/lib/search-monitor";

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
});
