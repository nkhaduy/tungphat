import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ArticleLanding } from "@/components/content/ArticleLanding";
import { ArticleHeader } from "@/components/editorial/ArticleHeader";
import { articleSchema, type ArticleFrontmatter } from "@/lib/content-schema";
import type { ContentEntry } from "@/lib/content";
import { extractMarkdownHeadings } from "@/lib/editorial/headings";
import { previewEntry, sanitizeCmsPreviewDraft } from "@/lib/cms-preview";

const article: ContentEntry<ArticleFrontmatter> = {
  ...articleSchema.parse({
    title: "Cách chọn MDF cho một hạng mục nội thất",
    slug: "mdf-editorial-fixture",
    excerpt: "Thông tin thực tế để nhận biết MDF và chuẩn bị quy cách phù hợp trước khi chọn vật liệu cho hạng mục nội thất.",
    publishedAt: "2026-07-16",
    updatedAt: "2026-11-13",
    author: "Ban biên tập Tùng Phát",
    category: "Kiến thức MDF",
    tags: ["MDF"],
    featuredImage: "/sanpham-media/van-mdf.webp",
    featuredImageAlt: "Các tấm MDF mộc xếp chồng, nhìn thấy mặt và cạnh ván",
    seoTitle: "Cách chọn MDF cho một hạng mục nội thất",
    seoDescription: "Thông tin để nhận biết MDF và chọn quy cách phù hợp trước khi sử dụng cho hạng mục nội thất.",
    canonical: "",
    noindex: false,
    draft: false,
    featured: false,
    relatedProducts: [],
    relatedArticles: [],
    faq: [{ question: "MDF thường phù hợp với môi trường nào?", answer: "Cần căn cứ vào môi trường sử dụng và yêu cầu của từng hạng mục cụ thể." }],
  }),
  body: "## Vật liệu MDF\n\nNội dung bài viết được giữ nguyên.\n\n![Bề mặt ván trong nội dung](https://cdn.mdftungphat.com/uploads/editorial-inline.webp)\n\n## Vật liệu MDF\n\n### Kiểm tra quy cách\n\n| Hạng mục | Thông tin |\n| --- | --- |\n| Độ dày | Theo yêu cầu |\n",
  sourcePath: "payload://articles/mdf-editorial-fixture",
};

describe("editorial article system", () => {
  it("omits unavailable metadata and suppresses duplicate publication/update dates", () => {
    const withoutMetadata = renderToStaticMarkup(createElement(ArticleHeader, {
      article: { title: "Bài viết ngắn", excerpt: "Mô tả hiện có.", category: "", author: "", publishedAt: "", updatedAt: "" },
    }));
    expect(withoutMetadata).not.toContain("editorial-header__metadata");
    expect(withoutMetadata).not.toContain("Cập nhật");

    const withOneDate = renderToStaticMarkup(createElement(ArticleHeader, {
      article: { title: "Bài viết ngắn", excerpt: "Mô tả hiện có.", category: "Kiến thức MDF", author: "Ban biên tập Tùng Phát", publishedAt: "2026-07-16", updatedAt: "2026-07-16" },
    }));
    expect(withOneDate).toContain("Đăng");
    expect(withOneDate).not.toContain("Cập nhật");
  });

  it("renders a shared article header, unique heading anchors, usable TOCs, and intact content without FAQ schema", () => {
    const html = renderToStaticMarkup(createElement(ArticleLanding, { article }));
    expect((html.match(/<h1\b/g) ?? [])).toHaveLength(1);
    expect(html).toContain("Trong bài viết");
    expect(html).toContain('href="#vat-lieu-mdf"');
    expect(html).toContain('href="#vat-lieu-mdf-2"');
    expect(html).toContain('href="#kiem-tra-quy-cach"');
    expect(html).toContain('id="vat-lieu-mdf"');
    expect(html).toContain('id="vat-lieu-mdf-2"');
    expect(html).toContain('id="kiem-tra-quy-cach"');
    expect(html).toContain("Nội dung bài viết được giữ nguyên.");
    expect(html).toContain('src="https://cdn.mdftungphat.com/uploads/editorial-inline.webp"');
    expect(html).toContain('alt="Bề mặt ván trong nội dung"');
    expect(html).toContain('loading="lazy"');
    expect(html).toContain("Hạng mục");
    expect(html).toContain("Các tấm MDF mộc xếp chồng, nhìn thấy mặt và cạnh ván");
    expect(html).toContain("MDF thường phù hợp với môi trường nào?");
    expect(html).not.toContain('"@type":"FAQPage"');
  });
});


it("extracts stable Vietnamese headings outside fenced code and maps a body H1 beneath the article title", () => {
  expect(extractMarkdownHeadings("# Nhan đề thân bài\n\n## Ván **MDF**\n\n~~~md\n## Không tạo mục lục\n~~~\n\n## Ván MDF\n### Độ dày [tham khảo](https://example.test)" )).toEqual([
    { id: "nhan-de-than-bai", text: "Nhan đề thân bài", level: 2 },
    { id: "van-mdf", text: "Ván MDF", level: 2 },
    { id: "van-mdf-2", text: "Ván MDF", level: 2 },
    { id: "do-day-tham-khao", text: "Độ dày tham khảo", level: 3 },
  ]);
});


it("renders an approved CMS preview draft through the same editorial layout", () => {
  const clean = sanitizeCmsPreviewDraft({
    collection: "articles",
    data: {
      title: "Bản xem trước bài viết về MDF",
      slug: "ban-xem-truoc-mdf",
      category: "Kiến thức MDF",
      author: "Ban biên tập Tùng Phát",
      excerpt: "Thông tin xem trước về MDF để lựa chọn vật liệu đúng với từng hạng mục nội thất.",
      body: "## Chọn theo vị trí sử dụng\n\nNội dung đang chờ biên tập.\n\n![Ảnh trong bản nháp](https://cdn.mdftungphat.com/uploads/editorial-preview.webp)\n",
      featuredImage: "/sanpham-media/van-mdf.webp",
      featuredImageAlt: "Các tấm MDF mộc xếp chồng, nhìn thấy mặt và cạnh ván",
      publishedAt: "2026-07-16",
      updatedAt: "2026-08-31",
      draft: true,
      faq: [{ question: "MDF phù hợp với môi trường nào?", answer: "Cần kiểm tra môi trường và yêu cầu của từng hạng mục." }],
    },
  });
  expect(clean).not.toBeNull();
  if (!clean) throw new Error("Valid CMS preview draft was rejected");
  const preview = previewEntry(clean);
  if (preview.collection !== "articles") throw new Error("Preview collection changed");
  const html = renderToStaticMarkup(createElement(ArticleLanding, { article: preview.entry }));
  expect(html).toContain("Bản xem trước bài viết về MDF");
  expect(html).toContain('href="#chon-theo-vi-tri-su-dung"');
  expect(html).toContain('src="https://cdn.mdftungphat.com/uploads/editorial-preview.webp"');
  expect(html).toContain('alt="Ảnh trong bản nháp"');
  expect(html).toContain("MDF phù hợp với môi trường nào?");
  expect(html).not.toContain("FAQPage");
});
