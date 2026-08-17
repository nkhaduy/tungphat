import { describe, expect, it } from "vitest";
import { productSchema } from "@/lib/content-schema";

const product = {
  title: "Ván MDF kiểm thử",
  slug: "van-mdf-kiem-thu",
  category: "Ván gỗ công nghiệp",
  materialType: "MDF",
  supplier: "",
  dimensions: [],
  thicknesses: [],
  surfaces: [],
  standards: [],
  applications: ["Chi tiết dạng tấm"],
  advantages: ["Bề mặt đồng đều"],
  limitations: ["Cần xác nhận điều kiện ẩm"],
  orderingSteps: ["Gửi quy cách cần kiểm tra"],
  excerpt: "Mô tả sản phẩm kiểm thử đủ dài để vượt qua quy tắc validation nội dung.",
  featuredImage: "/images/wood-panels.webp",
  featuredImageAlt: "Các tấm vật liệu gỗ dùng để kiểm thử",
  gallery: [],
  status: "available",
  quoteCta: "Yêu cầu báo giá",
  publishedAt: "2026-07-16",
  updatedAt: "2026-07-16",
  draft: false,
  seoTitle: "Ván MDF kiểm thử quy tắc nội dung website",
  seoDescription: "Mô tả SEO kiểm thử có độ dài hợp lệ để bảo đảm sản phẩm không được publish khi thiếu thông tin quan trọng bắt buộc.",
  canonical: "https://mdftungphat.com/van-mdf-kiem-thu",
  noindex: false,
  faq: [],
  relatedArticles: []
};

describe("productSchema", () => {
  it("chấp nhận đầy đủ field sản phẩm", () => expect(productSchema.safeParse(product).success).toBe(true));
  it("chuẩn hóa Date từ dữ liệu migration cũ", () => {
    const result = productSchema.safeParse({
      ...product,
      publishedAt: new Date("2026-07-16T00:00:00.000Z"),
      updatedAt: new Date("2026-07-18T00:00:00.000Z")
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.publishedAt).toBe("2026-07-16");
      expect(result.data.updatedAt).toBe("2026-07-18");
    }
  });
  it("từ chối slug, SEO description và ảnh không hợp lệ", () => {
    expect(productSchema.safeParse({ ...product, slug: "Ván MDF" }).success).toBe(false);
    expect(productSchema.safeParse({ ...product, seoDescription: "quá ngắn" }).success).toBe(false);
    expect(productSchema.safeParse({ ...product, featuredImage: "/files/catalog.pdf" }).success).toBe(false);
    expect(productSchema.safeParse({ ...product, canonical: "https://attacker:secret@mdftungphat.com/van-mdf-kiem-thu" }).success).toBe(false);
  });
});
