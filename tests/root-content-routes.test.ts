import { describe, expect, it } from "vitest";
import { createContentMetadata } from "@/lib/content-metadata";
import { dynamicRootContentParams, rootContentSlugCollisions } from "@/lib/root-content-routes";

const cmsFixture = [
  { collection: "products" as const, slug: "san-pham-moi", draft: false, noindex: false },
  { collection: "pages" as const, slug: "dich-vu-moi", draft: false, noindex: false },
  { collection: "products" as const, slug: "san-pham-nhap", draft: true, noindex: false },
  { collection: "pages" as const, slug: "dich-vu-an", draft: false, noindex: true }
];

describe("CMS dynamic root route fixtures", () => {
  it("exports new published product and service routes but excludes drafts/noindex", () => {
    expect(dynamicRootContentParams(cmsFixture)).toEqual([{ slug: "san-pham-moi" }, { slug: "dich-vu-moi" }]);
  });

  it("rejects a product/service root slug collision", () => {
    expect(rootContentSlugCollisions([
      { collection: "products", slug: "trung-slug", source: "product.md" },
      { collection: "pages", slug: "trung-slug", source: "service.md" }
    ])).toHaveLength(1);
  });

  it("generates apex canonical metadata for CMS content", () => {
    const metadata = createContentMetadata({
      ...cmsFixture[0],
      title: "Sản phẩm mới", body: "Nội dung", category: "MDF", materialType: "MDF", supplier: "", dimensions: [], thicknesses: [], surfaces: [], standards: [], applications: ["Ứng dụng"], advantages: ["Ưu điểm"], limitations: ["Lưu ý"], orderingSteps: ["Bước"], excerpt: "Nội dung fixture chỉ dùng để kiểm tra metadata của route CMS mới.", featuredImage: "/images/wood-panels.webp", featuredImageAlt: "Ảnh fixture", gallery: [], status: "available", quoteCta: "Báo giá", publishedAt: "2026-07-18", updatedAt: "2026-07-18", featured: false, seoTitle: "Sản phẩm mới fixture metadata canonical", seoDescription: "Mô tả fixture đủ dài để xác nhận metadata của CMS luôn dùng canonical apex đúng theo cấu hình website.", canonical: "", faq: [], relatedArticles: [], sourcePath: "tests/fixtures/product.md"
    }, "/san-pham-moi");
    expect(metadata.alternates?.canonical).toBe("https://mdftungphat.com/san-pham-moi");
  });
});
