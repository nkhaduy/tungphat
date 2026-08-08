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

  it("marks evidence-backed quote and existing comparison answers as covered", () => {
    const result = buildQueryUrlMap(querySet.queries);
    expect(result.find((entry) => entry.query === "nhận báo giá ván MDF theo số lượng")?.currentStatus).toBe("COVERED");
    expect(result.find((entry) => entry.query === "gỗ ghép cao su và gỗ ghép tràm")?.currentStatus).toBe("COVERED");
    expect(result.find((entry) => entry.query === "MDF và plywood khác nhau thế nào")?.currentStatus).toBe("COVERED");
  });

  it("marks process comparisons covered when the existing service pages answer them", () => {
    const result = buildQueryUrlMap(querySet.queries);
    const coveredQueries = [
      "ván nguyên tấm và danh sách chi tiết khác nhau khi báo giá",
      "cắt CNC MDF và cắt CNC gỗ ghép khác nhau gì",
      "cắt theo kích thước và CNC theo file khác nhau gì",
      "file kỹ thuật và bản phác thảo dùng khi nào",
      "bề mặt melamine và laminate nên kiểm tra gì",
      "mua tấm nguyên và thuê gia công trọn yêu cầu",
    ];

    for (const query of coveredQueries) {
      expect(result.find((entry) => entry.query === query)?.currentStatus, query).toBe("COVERED");
    }
    expect(result.find((entry) => entry.query === "bề mặt melamine và laminate nên kiểm tra gì")?.targetUrl).toBe("/van-go-cong-nghiep/");
    expect(result.filter((entry) => entry.currentStatus === "PARTIAL")).toHaveLength(0);
    expect(result.filter((entry) => entry.currentStatus === "COVERED")).toHaveLength(90);
  });
});
