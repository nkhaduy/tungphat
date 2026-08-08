import { describe, expect, it } from "vitest";
import {
  collectionSchemas,
  publicSnapshotSchema,
  settingSchemas,
  slugSchema,
} from "../src/contracts/content";

const seo = {
  seoTitle: "Ván MDF chống ẩm chất lượng cho nội thất",
  seoDescription: "Thông tin chi tiết về ván MDF chống ẩm, ứng dụng, kích thước và cách đặt hàng phù hợp cho công trình nội thất.",
  canonical: "https://mdftungphat.com/mdf-chong-am",
  noindex: false,
  ogImage: "/images/wood-panels.webp",
};

describe("content contracts", () => {
  it("rejects reserved or malformed slugs", () => {
    expect(slugSchema.safeParse("san-pham-hop-le").success).toBe(true);
    expect(slugSchema.safeParse("api").success).toBe(false);
    expect(slugSchema.safeParse("Sai Slug").success).toBe(false);
  });

  it("requires meaningful image alt text for products", () => {
    const result = collectionSchemas.products.safeParse({
      title: "Ván MDF chống ẩm",
      slug: "mdf-chong-am",
      category: "Ván MDF",
      excerpt: "Ván MDF chống ẩm phù hợp cho khu vực có độ ẩm cao trong công trình nội thất.",
      materialType: "MDF chống ẩm",
      supplier: "",
      thicknesses: ["17 mm"],
      dimensions: ["1220 x 2440 mm"],
      surfaces: ["Thô"],
      standards: [],
      applications: ["Tủ bếp"],
      advantages: ["Ổn định"],
      limitations: ["Không ngâm nước"],
      orderingSteps: ["Gửi kích thước"],
      status: "available",
      quoteCta: "Nhận báo giá",
      featuredImage: "/images/wood-panels.webp",
      featuredImageAlt: "ngắn",
      gallery: [],
      video: "",
      catalogue: "",
      body: "Nội dung sản phẩm.",
      publishedAt: "2026-08-04",
      updatedAt: "2026-08-04",
      featured: false,
      relatedArticles: [],
      faq: [],
      ...seo,
    });
    expect(result.success).toBe(false);
  });

  it("defines exactly four public collections and five settings", () => {
    expect(Object.keys(collectionSchemas).sort()).toEqual(["articles", "pages", "products", "projects"]);
    expect(Object.keys(settingSchemas).sort()).toEqual(["brands", "business-settings", "material-categories", "seo-defaults", "static-pages"]);
  });

  it("rejects drafts and internal metadata in a public snapshot", () => {
    const result = publicSnapshotSchema.safeParse({
      schemaVersion: 1,
      generatedAt: "2026-08-04T00:00:00.000Z",
      checksum: "a".repeat(64),
      records: [{ collection: "articles", status: "draft", slug: "draft", data: {}, internalId: "secret" }],
      settings: {},
      media: [],
    });
    expect(result.success).toBe(false);
  });
});
