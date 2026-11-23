import { describe, expect, it } from "vitest";
import { articleSchema, previewArticleSchema, productSchema } from "@/lib/content-schema";

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
  it("chấp nhận canonical CDN cho media Payload", () => {
    expect(productSchema.safeParse({
      ...product,
      featuredImage: "https://cdn.mdftungphat.com/uploads/v%E1%BA%ADt-li%E1%BB%87u.webp",
    }).success).toBe(true);
  });
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

const previewArticle = {
  title: "Bài kiểm thử xuất bản trên môi trường preview",
  slug: "qa-editorial-cms-staging",
  excerpt: "Bài kiểm thử xác nhận ảnh R2 của staging chỉ được dùng trong static preview riêng biệt.",
  publishedAt: "2026-11-23",
  updatedAt: "2026-11-23",
  author: "Tùng Phát",
  category: "Kiểm thử",
  tags: [],
  featuredImage: "https://tungphat-static-assets-preview.nkhaduy.workers.dev/uploads/mdfmfc.webp",
  featuredImageAlt: "Ảnh R2 dùng để kiểm thử editor staging",
  gallery: ["https://tungphat-static-assets-preview.nkhaduy.workers.dev/uploads/mdfmfc.webp"],
  video: "",
  catalogue: "",
  ogImage: "https://tungphat-static-assets-preview.nkhaduy.workers.dev/uploads/mdfmfc.webp",
  draft: false,
  featured: false,
  seoTitle: "Bài kiểm thử editor Payload trên staging",
  seoDescription: "Bài kiểm thử staging xác nhận metadata và media R2 chỉ được phục vụ trong preview riêng, không đổi nội dung production.",
  canonical: "https://gotungphat.com/bai-viet/qa-editorial-cms-staging",
  noindex: false,
  relatedProducts: [],
  relatedArticles: [],
  faq: [],
};

describe("previewArticleSchema", () => {
  it("chấp nhận ảnh upload R2 qua đúng host preview Workers", () => {
    expect(previewArticleSchema.safeParse(previewArticle).success).toBe(true);
  });

  it("không cho phép host giả hoặc đưa ảnh preview vào schema production", () => {
    expect(articleSchema.safeParse(previewArticle).success).toBe(false);
    expect(previewArticleSchema.safeParse({
      ...previewArticle,
      featuredImage: "https://attacker.example/uploads/mdfmfc.webp",
    }).success).toBe(false);
  });
});
