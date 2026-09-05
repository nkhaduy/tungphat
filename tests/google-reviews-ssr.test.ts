import { createElement } from "react";
import { readFileSync } from "node:fs";
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
    expect(html).toContain("/_next/image?url=%2Fbrand%2Fgoogle-g.png");
    expect(html).not.toContain("cdn.trustindex.io/assets/platform/Google/icon.svg");
    expect(html).not.toContain("svgsvg");
    expect(html).toMatch(/<span role="img"[^>]+aria-label="5 trên 5 sao"/);
  });

  it("omits Trustindex verification when the public source does not assert it", () => {
    const data: TrustindexReviewData = { sourceUrl: "https://public.trustindex.io/reviews/mdftungphat.com/lang/vi", source: "Google", rating: 5, reviewCount: 1, verified: false, googleLinks: ["https://www.google.com/maps/search/?api=1"], refreshedAt: "2026-08-30T00:00:00.000Z", reviews: [{ id: "r1", reviewerName: "Khách hàng", avatarUrl: null, rating: 5, text: "Đánh giá thật", date: "2025.01.01" }] };
    expect(renderToStaticMarkup(createElement(TrustindexReviews, { data }))).not.toContain("Verified by Trustindex");
  });

  it("keeps rating-only reviews in the summary but only displays cards with review text", () => {
    const data: TrustindexReviewData = {
      sourceUrl: "https://public.trustindex.io/reviews/mdftungphat.com/lang/vi",
      source: "Google",
      rating: 4.8,
      reviewCount: 26,
      verified: true,
      googleLinks: [
        "https://www.google.com/maps/search/?api=1&query=Google&query_place_id=one",
        "https://www.google.com/maps/search/?api=1&query=Google&query_place_id=two",
      ],
      refreshedAt: "2026-08-30T00:00:00.000Z",
      reviews: [
        { id: "r1", reviewerName: "Có nội dung", avatarUrl: null, rating: 5, text: "Đánh giá thật", date: "2025.01.01" },
        { id: "r2", reviewerName: "Chỉ có điểm", avatarUrl: null, rating: 5, text: "", date: "2025.01.02" },
      ],
    };
    const html = renderToStaticMarkup(createElement(TrustindexReviews, { data }));
    expect(html).toContain('href="https://www.google.com/maps/search/?api=1&amp;query=Google&amp;query_place_id=one"');
    expect(html).toContain('href="https://www.google.com/maps/search/?api=1&amp;query=Google&amp;query_place_id=two"');
    expect(html).toContain("Có nội dung");
    expect(html).toContain("Đánh giá thật");
    expect(html).toContain("Tùng Phát 1");
    expect(html).toContain("Tùng Phát 2");
    expect(html).not.toContain("Chỉ có điểm");
  });

  it("renders every written review while placing higher ratings first", () => {
    const data: TrustindexReviewData = {
      sourceUrl: "https://public.trustindex.io/reviews/mdftungphat.com/lang/vi",
      source: "Google",
      rating: 4.8,
      reviewCount: 26,
      verified: true,
      googleLinks: ["https://www.google.com/maps/search/?api=1"],
      refreshedAt: "2026-08-30T00:00:00.000Z",
      reviews: [
        { id: "bad", reviewerName: "Một sao", avatarUrl: null, rating: 1, text: "Không hài lòng", date: "2026.01.01" },
        { id: "short", reviewerName: "Năm sao ngắn", avatarUrl: null, rating: 5, text: "Tốt", date: "2026.01.02" },
        { id: "useful", reviewerName: "Năm sao hữu ích", avatarUrl: null, rating: 5, text: "Tư vấn rõ ràng, giao hàng đúng hẹn và vật liệu đúng mô tả.", date: "2026.01.03" },
      ],
    };
    const html = renderToStaticMarkup(createElement(TrustindexReviews, { data }));
    expect(html).toContain("Năm sao hữu ích");
    expect(html).toContain("Năm sao ngắn");
    expect(html).toContain("Một sao");
    expect(html.indexOf("Năm sao hữu ích")).toBeLessThan(html.indexOf("Năm sao ngắn"));
    expect(html).toContain("4.8");
    expect(html).toContain("26 đánh giá");
    expect(html).not.toContain("Đánh giá từ Trustindex");
    expect(html).not.toContain("Phản hồi khách hàng được Trustindex");
  });

  it("scrolls the review viewport horizontally instead of scrolling the document", () => {
    const source = readFileSync("components/reviews/TrustindexReviews.tsx", "utf8");
    expect(source).toContain("scrollTo");
    expect(source).not.toContain("scrollIntoView");
  });

  it("uses cached-or-fallback avatars and waits for the review section to enter view", () => {
    const source = readFileSync("components/reviews/TrustindexReviews.tsx", "utf8");
    expect(source).toContain("review.avatarUrl");
    expect(source).toContain("IntersectionObserver");
    expect(source).toContain("isIntersecting");
    expect(source).toContain("section.getBoundingClientRect");
    expect(source).not.toContain("const [autoplay, setAutoplay] = useState(true)");
  });
});
