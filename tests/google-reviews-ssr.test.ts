import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { GoogleReviews } from "../components/reviews/GoogleReviews";
import type { ReviewPayload } from "../components/reviews/google-review-types";

describe("Google reviews SSR", () => {
  it("renders only Google-derived branch data in the initial HTML", () => {
    const initialPayload: ReviewPayload = {
      status: "ready",
      branches: ["tp1", "tp2"].map((branchKey, index) => ({
        branchKey: branchKey as "tp1" | "tp2",
        status: "ready",
        location: `Google branch ${index + 1}`,
        mapsUrl: `https://www.google.com/maps/place/${index + 1}`,
        count: 10 + index,
        averageRating: 5,
        lastSyncedAt: 1,
        reviews: [{ review_id: `places/reviews/${index + 1}`, reviewer_display_name: `Google reviewer ${index + 1}`, reviewer_photo_url: null, reviewer_uri: null, rating: 5, comment: `Google API review ${index + 1}`, create_time: "2026-08-01T00:00:00Z", update_time: "2026-08-01T00:00:00Z", owner_reply: null }],
      })),
    };
    const html = renderToStaticMarkup(createElement(GoogleReviews, { initialPayload }));
    expect(html).toContain("Google API review 1");
    expect(html).toContain("Google API review 2");
    expect(html).not.toContain("CMS editor");
  });
});
