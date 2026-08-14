import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchDailyMetrics } from "../src/gbp/google";

describe("GBP Performance normalization", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("parses the API's string-valued daily metrics", async () => {
    const googleFetch = vi.fn(async () => Response.json({
      timeSeries: {
        datedValues: [{ date: { year: 2026, month: 8, day: 1 }, value: "7" }],
      },
    }));
    vi.stubGlobal("fetch", googleFetch);

    const rows = await fetchDailyMetrics("token", "locations/123", "2026-08-01", "2026-08-02");

    expect(rows).toHaveLength(11);
    expect(rows.every((row) => row.value === 7)).toBe(true);
    expect(googleFetch).toHaveBeenCalledTimes(11);
  });
});
