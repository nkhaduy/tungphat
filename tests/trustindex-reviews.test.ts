import { describe, expect, it } from "vitest";

describe("Trustindex public source parser", () => {
  it("keeps live Google review text verbatim and verifies the public profile state", async () => {
    const { parseTrustindexHtml } = await import("../scripts/sync-trustindex-reviews.mjs");
    const data = parseTrustindexHtml(`
      <h3 class="wp-block-heading ti-score">4.8</h3><span class="ti-count">26</span>
      <span>Công ty xác thực</span><a href="https://www.google.com/maps/search/?api=1&amp;query=Google">Google</a>
      <article class="review source-Google" data-id="1"><div class="author-text"><span class="name">Thuy Pham</span><span>2025.11.25</span></div><img data-src="https://lh3.googleusercontent.com/avatar" /><div class="ti-stars"><span class="ti-star f"></span><span class="ti-star f"></span><span class="ti-star f"></span><span class="ti-star f"></span><span class="ti-star f"></span></div><span class="ti-review-content">Đa dạng sản phẩm, sản xuất nhanh</span></article>
    `);
    expect(data).toMatchObject({ source: "Google", rating: 4.8, reviewCount: 26, verified: true });
    expect(data.reviews[0]).toMatchObject({ reviewerName: "Thuy Pham", rating: 5, text: "Đa dạng sản phẩm, sản xuất nhanh" });
  });

  it("keeps rating-only Google reviews so the public count is not silently reduced", async () => {
    const { parseTrustindexHtml } = await import("../scripts/sync-trustindex-reviews.mjs");
    const data = parseTrustindexHtml(`
      <h3 class="wp-block-heading ti-score">4.8</h3><span class="ti-count">26</span>
      <a href="https://www.google.com/maps/search/?api=1&amp;query=Google&amp;query_place_id=one">Google</a>
      <article class="review source-Google" data-id="1"><div class="author-text"><span class="name">Có nội dung</span><span>2025.01.01</span></div><div class="ti-stars"><span class="ti-star f"></span><span class="ti-star f"></span><span class="ti-star f"></span><span class="ti-star f"></span><span class="ti-star f"></span></div><span class="ti-review-content">Nội dung thật</span></article>
      <article class="review source-Google" data-id="2"><div class="author-text"><span class="name">Chỉ có điểm</span><span>2025.01.02</span></div><div class="ti-stars"><span class="ti-star f"></span><span class="ti-star f"></span><span class="ti-star f"></span><span class="ti-star f"></span><span class="ti-star f"></span></div><span class="ti-review-content"></span></article>
    `);
    expect(data.reviews).toHaveLength(2);
    expect(data.reviews[1]).toMatchObject({ reviewerName: "Chỉ có điểm", rating: 5, text: "" });
  });
});
