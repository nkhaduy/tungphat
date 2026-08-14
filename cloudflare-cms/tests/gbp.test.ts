import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  fetchAllReviews,
  fetchMonthlyKeywordImpressions,
  normalizeReview,
  retryGoogleRequest,
} from "../src/gbp/google";
import { reviewRetentionCutoff, reviewUpsertStatements } from "../src/gbp/storage";
import { decryptToken, encryptToken, selectTungPhatLocation, selectTungPhatLocations } from "../src/gbp/oauth";

const token = "unit-test-token";

describe("Google Business Profile review import", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("normalizes Vietnamese, rating-only, long and updated reviews without inventing fields", () => {
    expect(normalizeReview({
      reviewId: "review-1",
      reviewer: { displayName: "Nguyễn An", profilePhotoUrl: "https://example.com/avatar.jpg" },
      starRating: "FIVE",
      comment: "Ván đẹp, cắt CNC rất chuẩn. ".repeat(40),
      createTime: "2026-08-01T01:02:03Z",
      updateTime: "2026-08-02T01:02:03Z",
      reviewReply: { comment: "Cảm ơn anh.", updateTime: "2026-08-03T01:02:03Z" },
    }, "accounts/1/locations/2")).toMatchObject({
      reviewId: "review-1",
      reviewerDisplayName: "Nguyễn An",
      reviewerPhotoUrl: "https://example.com/avatar.jpg",
      rating: 5,
      locationName: "accounts/1/locations/2",
      ownerReply: "Cảm ơn anh.",
    });
    expect(normalizeReview({ reviewId: "review-2", starRating: "ONE" }, "accounts/1/locations/2"))
      .toMatchObject({ rating: 1, comment: null, reviewerDisplayName: "Khách hàng Google" });
  });

  it("follows review pagination until Google stops returning a page token", async () => {
    const pages = [
      Response.json({ reviews: [{ reviewId: "a", starRating: "FIVE" }], nextPageToken: "next" }),
      Response.json({ reviews: [{ reviewId: "b", starRating: "FOUR" }] }),
    ];
    vi.stubGlobal("fetch", vi.fn(async () => pages.shift()!));
    const reviews = await fetchAllReviews(token, "accounts/1/locations/2", 0);
    expect(reviews.map((review) => review.reviewId)).toEqual(["a", "b"]);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("paginates monthly search keyword impressions", async () => {
    const pages = [
      Response.json({ searchKeywordsCounts: [{ searchKeyword: "ván mdf", insightsValue: { value: "12" } }], nextPageToken: "next" }),
      Response.json({ searchKeywordsCounts: [{ searchKeyword: "cắt cnc", insightsValue: { threshold: "15" } }] }),
    ];
    vi.stubGlobal("fetch", vi.fn(async () => pages.shift()!));
    const rows = await fetchMonthlyKeywordImpressions(token, "locations/2", "2026-07", "2026-08", 0);
    expect(rows).toEqual([
      { keyword: "ván mdf", impressions: 12, threshold: null },
      { keyword: "cắt cnc", impressions: null, threshold: 15 },
    ]);
  });

  it.each([401, 403])("does not retry authorization failure %s", async (status) => {
    const request = vi.fn(async () => new Response("denied", { status }));
    await expect(retryGoogleRequest(request, 0)).rejects.toThrow(status === 401 ? "google_unauthorized" : "google_forbidden");
    expect(request).toHaveBeenCalledTimes(1);
  });

  it("retries timeout, quota and transient failures before succeeding", async () => {
    const request = vi.fn()
      .mockRejectedValueOnce(new DOMException("timed out", "TimeoutError"))
      .mockResolvedValueOnce(new Response("quota", { status: 429 }))
      .mockResolvedValueOnce(Response.json({ ok: true }));
    const response = await retryGoogleRequest(request, 0);
    expect(response.ok).toBe(true);
    expect(request).toHaveBeenCalledTimes(3);
  });
});

describe("GBP cache storage policy", () => {
  it("supports multiple GBP locations with stable public order", () => {
    const sql = readFileSync(new URL("../migrations/0008_gbp_multi_location.sql", import.meta.url), "utf8");
    expect(sql).not.toContain("CHECK (id = 1)");
    expect(sql).toContain("location_name TEXT UNIQUE");
    expect(sql).toContain("branch_key TEXT NOT NULL");
    expect(sql).toContain("display_order INTEGER NOT NULL");
  });

  it("uses a strict 30-day retention cutoff", () => {
    expect(reviewRetentionCutoff(Date.parse("2026-08-13T00:00:00Z")))
      .toBe(Math.floor(Date.parse("2026-07-14T00:00:00Z") / 1000));
  });

  it("builds idempotent review upserts and marks reviews missing from a completed sync", () => {
    const statements = reviewUpsertStatements({
      prepare: (sql: string) => ({ bind: (...values: unknown[]) => ({ sql, values }) }),
    } as never, "accounts/1/locations/2", [{
      reviewId: "review-1", reviewerDisplayName: "Nguyễn An", reviewerPhotoUrl: null,
      rating: 5, comment: "Tốt", createTime: "2026-08-01T00:00:00Z",
      updateTime: "2026-08-02T00:00:00Z", ownerReply: null, ownerReplyUpdateTime: null,
      locationName: "accounts/1/locations/2",
    }], 1_800_000_000);
    expect(statements).toHaveLength(3);
    expect(String((statements[0] as never as { sql: string }).sql)).toContain("ON CONFLICT(review_id) DO UPDATE");
    expect(String((statements[1] as never as { sql: string }).sql)).toContain("available=0");
    expect(String((statements[1] as never as { sql: string }).sql)).toContain("fetched_at<?");
    expect(String((statements[2] as never as { sql: string }).sql)).toContain("expires_at<?");
  });
});

describe("GBP OAuth security and location selection", () => {
  it("encrypts OAuth tokens at rest with authenticated encryption", async () => {
    const secret = "unit-test-encryption-secret-at-least-32-characters";
    const encrypted = await encryptToken("refresh-token-value", secret);
    expect(encrypted).not.toContain("refresh-token-value");
    await expect(decryptToken(encrypted, secret)).resolves.toBe("refresh-token-value");
    await expect(decryptToken(encrypted, `${secret}-wrong`)).rejects.toThrow();
  });

  it("selects the location whose website and title identify Tùng Phát", () => {
    expect(selectTungPhatLocation([
      { name: "locations/1", title: "Other business", websiteUri: "https://other.example" },
      { name: "locations/2", title: "Công ty Gỗ Tùng Phát", websiteUri: "https://mdftungphat.com/" },
    ])?.name).toBe("locations/2");
  });

  it("selects and orders both verified Tùng Phát branches", () => {
    expect(selectTungPhatLocations([
      { name: "locations/other", title: "Other business", websiteUri: "https://other.example" },
      { name: "locations/tp2", title: "Gỗ Tùng Phát", websiteUri: "https://mdftungphat.com", metadata: { placeId: "ChIJjWMBUikndTERNFK1M-j02ZY" } },
      { name: "locations/tp1", title: "Công ty Gỗ Tùng Phát", websiteUri: "https://mdftungphat.com", metadata: { placeId: "ChIJ6dw2A6YndTERr5eaiym-l-M" } },
      { name: "locations/tp2-copy", title: "Gỗ Tùng Phát", metadata: { placeId: "ChIJjWMBUikndTERNFK1M-j02ZY" } },
    ])).toMatchObject([
      { branchKey: "tp1", location: { name: "locations/tp1" }, displayOrder: 1 },
      { branchKey: "tp2", location: { name: "locations/tp2" }, displayOrder: 2, fallbackMapsUrl: "https://share.google/sv4nkFEznsGsWhRAQ" },
    ]);
  });
});
