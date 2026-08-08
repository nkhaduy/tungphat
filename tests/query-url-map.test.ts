import { describe, expect, it } from "vitest";
import querySet from "@/data/ai-search-query-set.json";
import { buildQueryUrlMap } from "@/lib/query-url-map";

describe("AI search query URL mapping", () => {
  it("maps every query once and avoids targeting noindex catalogue placeholders", () => {
    const result = buildQueryUrlMap(querySet.queries);

    expect(result).toHaveLength(100);
    expect(new Set(result.map((entry) => entry.query)).size).toBe(100);
    expect(result.filter((entry) => entry.targetUrl.startsWith("/catalogue/"))).toEqual([]);
    expect(result.find((entry) => entry.query === "catalogue An Cường tại Tùng Phát")?.currentStatus).toBe("SHOULD_NOT_TARGET");
  });

  it("consolidates supported comparison intent into the material reference center", () => {
    const result = buildQueryUrlMap(querySet.queries);
    const comparison = result.find((entry) => entry.query === "MDF thường và MDF chống ẩm khác nhau thế nào");

    expect(comparison).toMatchObject({
      targetUrl: "/tham-chieu-vat-lieu/",
      currentStatus: "COVERED",
      coverage: "comparison-table",
    });
  });
});
