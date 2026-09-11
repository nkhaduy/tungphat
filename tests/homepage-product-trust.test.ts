import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("homepage product and trust refinement", () => {
  const page = readFileSync("app/page.tsx", "utf8");
  const content = readFileSync("components/home/HomeContent.tsx", "utf8");
  const reviews = readFileSync("components/reviews/TrustindexReviews.tsx", "utf8");
  const footer = readFileSync("components/site/SiteFooter.tsx", "utf8");

  it("uses a brand-first title without changing catalogue title policy", () => {
    expect(page).toContain("Tùng Phát | Ván gỗ công nghiệp & Gia công CNC tại Thủ Đức");
  });

  it("keeps colour discovery compact and motion-safe", () => {
    expect(content).not.toContain("Mã màu theo vật liệu");
    expect(content).toContain("Các màu nổi bật");
    expect(content).toContain("data-color-code-marquee");
    expect(content).toContain("supplier.logo");
    expect(content).not.toContain("scrollIntoView");
  });

  it("uses the company, CNC, article-image, and Google Maps trust surfaces", () => {
    expect(content).toContain("Giới thiệu về");
    expect(content).toContain(">Tùng Phát<");
    expect(content).toContain("Xem dịch vụ CNC");
    expect(content).toContain("article.featuredImage");
    expect(content).toContain('loading="lazy"');
    expect(footer).toContain("Google Maps");
  });

  it("deduplicates featured written reviews and excludes one-star cards without altering the aggregate", () => {
    expect(reviews).toContain("getFeaturedReviews");
    expect(reviews).toContain("review.rating > 1");
    expect(reviews).toContain("data.rating.toFixed(1)");
    expect(reviews).toContain("data.reviewCount");
  });
});
