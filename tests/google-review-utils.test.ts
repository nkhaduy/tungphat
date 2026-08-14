import { describe, expect, it } from "vitest";
import { parseReviewPayload, reviewerInitial, safePhotoUrl, sortReviews } from "../components/reviews/google-review-utils";
import type { Review } from "../components/reviews/google-review-types";

const review = (review_id: string, comment: string | null, update_time = "2026-08-01T00:00:00Z"): Review => ({
  review_id,
  reviewer_display_name: "Khách hàng",
  reviewer_photo_url: null,
  rating: 5,
  comment,
  create_time: update_time,
  update_time,
  owner_reply: null,
});

describe("Google review presentation utilities", () => {
  it("sorts long written reviews before short and rating-only reviews", () => {
    const ratingOnly = review("rating-only", null, "2026-08-03T00:00:00Z");
    const short = review("short", "Tốt", "2026-08-02T00:00:00Z");
    const detailed = review("detailed", "Tư vấn kỹ, giao hàng đúng hẹn và hỗ trợ rất có tâm.", "2026-08-01T00:00:00Z");
    expect(sortReviews([ratingOnly, short, detailed]).map((item) => item.review_id)).toEqual(["detailed", "short", "rating-only"]);
  });

  it("uses recency only when normalized comment lengths are equal", () => {
    expect(sortReviews([
      review("older", "Rất tốt", "2026-08-01T00:00:00Z"),
      review("newer", "Khá tốt", "2026-08-03T00:00:00Z"),
    ]).map((item) => item.review_id)).toEqual(["newer", "older"]);
  });

  it("creates safe identity and photo fallbacks", () => {
    expect(reviewerInitial("  Nguyễn Văn An ")).toBe("N");
    expect(reviewerInitial(" ")).toBe("G");
    expect(safePhotoUrl("https://example.com/avatar.jpg")).toBe("https://example.com/avatar.jpg");
    expect(safePhotoUrl("javascript:alert(1)")).toBeNull();
    expect(safePhotoUrl("http://example.com/avatar.jpg")).toBeNull();
  });

  it("parses two independent branches and rejects malformed reviews", () => {
    const payload = parseReviewPayload({ status: "ready", branches: [{
      branchKey: "tp2", status: "ready", location: "Tùng Phát 2", mapsUrl: null,
      count: 2, averageRating: 4.9, reviews: [
        { review_id: "valid", reviewer_display_name: "Lan", rating: 5, comment: "Tốt" },
        { review_id: "invalid", reviewer_display_name: "", rating: 9 },
      ],
    }] });
    expect(payload?.branches[0]).toMatchObject({ branchKey: "tp2", mapsUrl: "https://share.google/sv4nkFEznsGsWhRAQ" });
    expect(payload?.branches[0].reviews.map((item) => item.review_id)).toEqual(["valid"]);
  });
});
