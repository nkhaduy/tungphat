import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { TrustindexReviews, type TrustindexReviewData } from "../components/reviews/TrustindexReviews";

describe("Trustindex reviews SSR", () => {
  it("renders the verified public Google source without any Places configuration", () => {
    const data: TrustindexReviewData = {
      sourceUrl: "https://public.trustindex.io/reviews/mdftungphat.com/lang/vi",
      source: "Google",
      rating: 4.8,
      reviewCount: 26,
      verified: true,
      googleLinks: ["https://www.google.com/maps/search/?api=1&query=Google&query_place_id=ChIJ6dw2A6YndTERr5eaiym-l-M"],
      refreshedAt: "2026-08-30T00:00:00.000Z",
      reviews: [{ id: "r1", reviewerName: "Thuy Pham", avatarUrl: null, rating: 5, text: "Đa dạng sản phẩm, sản xuất nhanh", date: "2025.11.25" }],
    };
    const html = renderToStaticMarkup(createElement(TrustindexReviews, { data }));
    expect(html).toContain("Đa dạng sản phẩm, sản xuất nhanh");
    expect(html).toContain("4.8");
    expect(html).toContain("26 đánh giá");
    expect(html).toContain("Verified by Trustindex");
    expect(html).toContain("google.com/maps");
    expect(html).not.toContain("svgsvg");
  });

  it("omits Trustindex verification when the public source does not assert it", () => {
    const data: TrustindexReviewData = { sourceUrl: "https://public.trustindex.io/reviews/mdftungphat.com/lang/vi", source: "Google", rating: 5, reviewCount: 1, verified: false, googleLinks: ["https://www.google.com/maps/search/?api=1"], refreshedAt: "2026-08-30T00:00:00.000Z", reviews: [{ id: "r1", reviewerName: "Khách hàng", avatarUrl: null, rating: 5, text: "Đánh giá thật", date: "2025.01.01" }] };
    expect(renderToStaticMarkup(createElement(TrustindexReviews, { data }))).not.toContain("Verified by Trustindex");
  });
});
