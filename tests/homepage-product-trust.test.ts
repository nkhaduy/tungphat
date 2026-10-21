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
    expect(content).toContain(">Mã màu</h2>");
    expect(content).toContain("FeaturedColorCodes");
    expect(content).toContain("supplier.logo");
    expect(content).not.toContain("scrollIntoView");
  });

  it("uses the company, CNC, article-image, and Google Maps trust surfaces", () => {
    expect(content).toContain('id="chi-nhanh"');
    expect(content).toContain("branch.embedSrc");
    expect(content).toContain("Gửi kích thước / file để nhận báo giá");
    expect(content).toContain("article.featuredImage");
    expect(content).toContain("branch.directionsUrl");
    expect(footer).toContain("Google Maps");
  });

  it("deduplicates featured written reviews and excludes one-star cards without altering the aggregate", () => {
    expect(reviews).toContain("getFeaturedReviews");
    expect(reviews).toContain("review.rating > 1");
    expect(reviews).toContain("data.rating.toFixed(1)");
    expect(reviews).toContain("data.reviewCount");
  });
});
