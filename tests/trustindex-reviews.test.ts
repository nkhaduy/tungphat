import { describe, expect, it } from "vitest";

describe("Trustindex public source parser", () => {
  it("keeps live Google review text verbatim and verifies the public profile state", async () => {
    const { parseTrustindexHtml } = await import("../scripts/sync-trustindex-reviews.mjs");
    const data = parseTrustindexHtml(`
      <h3 class="wp-block-heading ti-score">4.8</h3><span class="ti-count">26</span>
      <span>Công ty xác thực</span><a href="https://www.google.com/maps/search/?api=1&amp;query=Google">Google</a>
      <article class="review box-with-border" data-id="1"><div class="author-text"><span class="name">Thuy Pham</span><span>2025.11.25</span></div><img data-src="https://lh3.googleusercontent.com/avatar" /><div class="ti-stars"><span class="ti-star f"></span><span class="ti-star f"></span><span class="ti-star f"></span><span class="ti-star f"></span><span class="ti-star f"></span></div><span class="ti-review-content">Đa dạng sản phẩm, sản xuất nhanh</span></article>
    `);
    expect(data).toMatchObject({ source: "Google", rating: 4.8, reviewCount: 26, verified: true });
    expect(data.reviews[0]).toMatchObject({ reviewerName: "Thuy Pham", rating: 5, text: "Đa dạng sản phẩm, sản xuất nhanh" });
  });
});
