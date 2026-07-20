import { describe, expect, it } from "vitest";
import {
  previousVietnamDay,
  retentionCutoffs,
} from "../workers/analytics-maintenance/src/index";

describe("analytics scheduled maintenance", () => {
  it("aggregates the completed Vietnam calendar day", () => {
    const now = Date.parse("2026-07-20T18:15:00.000Z");
    expect(previousVietnamDay(now)).toEqual({
      date: "2026-07-20",
      start: Math.floor(Date.parse("2026-07-19T17:00:00.000Z") / 1_000),
      end: Math.floor(Date.parse("2026-07-20T17:00:00.000Z") / 1_000),
    });
  });

  it("uses 90-day raw and 7-day test retention", () => {
    const nowMs = Date.parse("2026-07-20T18:15:00.000Z");
    const cutoffs = retentionCutoffs(nowMs);
    expect(cutoffs.raw).toBe(Math.floor(nowMs / 1_000) - 90 * 86_400);
    expect(cutoffs.test).toBe(Math.floor(nowMs / 1_000) - 7 * 86_400);
    expect(cutoffs.aggregateCutoff).toBe("2024-06-21");
  });
});
