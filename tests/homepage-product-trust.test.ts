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
    expect(content).not.toContain("scrollIntoView");
  });

  it("uses the company, CNC, article-image, and Google Maps trust surfaces", () => {
    expect(content).toContain('id="chi-nhanh"');
    expect(content).toContain("branch.embedSrc");
    expect(content).toContain("Gửi yêu cầu báo giá");
    expect(content).toContain("article.featuredImage");
    expect(content).toContain("branch.directionsUrl");
    expect(footer).toContain("Google Maps");
  });

  it("keeps homepage product cards concise and adds the CNC service action", () => {
    const cards = readFileSync("components/products/MaterialCard.tsx", "utf8");
    expect(content).toContain("showDescription={false}");
    expect(content).toContain(">CNC Tùng Phát</p>");
    expect(content).toContain('href="/gia-cong-cnc/"');
    expect(content).toContain("Xem dịch vụ Cắt CNC");
    expect(cards).toContain("showDescription = true");
  });

  it("shows a lazy map preview and a dedicated map link for each footer branch", () => {
    expect(footer).toContain("{business.locations.map((location) => (");
    expect(footer).toContain("location.embedSrc");
    expect(footer).toContain('loading="lazy"');
    expect(footer).toContain('aria-label={`Bản đồ ${location.name}`}');
  });

  it("deduplicates featured written reviews and excludes one-star cards without altering the aggregate", () => {
    expect(reviews).toContain("getFeaturedReviews");
    expect(reviews).toContain("review.rating > 1");
    expect(reviews).not.toContain("data.rating.toFixed(1)");
    expect(reviews).not.toContain("Dựa trên {data.reviewCount} đánh giá");
    expect(reviews).not.toContain("Nguồn đánh giá Google</a>");
  });

  it("uses the existing material hero asset on contact and the shared hero on legal pages", () => {
    const contact = readFileSync("app/lien-he/page.tsx", "utf8");
    const legal = readFileSync("components/LegalPage.tsx", "utf8");
    expect(contact).toContain('src="/images/cnc-service.webp"');
    expect(legal).toContain("<PageHero compact");
    expect(legal).toContain("title={title} description={subtitle}");
  });
});
