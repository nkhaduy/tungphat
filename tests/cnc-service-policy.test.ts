import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { ContentEntry } from "@/lib/content";
import type { ServicePageFrontmatter } from "@/lib/content-schema";
import { CncServiceContent, cncServiceCopy } from "@/components/content/CncServiceContent";

describe("CNC service pages", () => {
  it.each(["gia-cong-cnc", "cat-cnc-go", "gia-cong-cnc-mdf"] as const)("renders %s with service content and a Zalo quote link", (slug) => {
    const html = renderToStaticMarkup(createElement(CncServiceContent, { slug }));
    expect(html).toContain(cncServiceCopy[slug].title);
    expect(html).toContain("zalo.me");
    expect(html).toContain("Liên hệ báo giá");
    expect(html).not.toMatch(/gửi file|upload|<form/iu);
    expect(html).toContain("application/ld+json");
    expect(html).toContain("data-answer-block");
  });
  it("preserves the existing CNC quote tracking and workshop link", () => {
    const html = renderToStaticMarkup(createElement(CncServiceContent, { slug: "gia-cong-cnc" }));
    expect(html).toContain('data-track-location="cnc_hero"');
    expect(html).toContain("Xem ảnh xưởng và chi nhánh");
  });
  it("uses compliant CMS copy and falls back when legacy instructions remain", () => {
    const page = { title: "Cắt CNC gỗ theo yêu cầu", excerpt: "Dịch vụ cắt chi tiết gỗ phục vụ các hạng mục nội thất theo nhu cầu.", body: "## Cắt chi tiết gỗ\n\nĐây là nội dung do biên tập viên cập nhật cho từng yêu cầu gia công.", seoTitle: "Dịch vụ cắt CNC gỗ", seoDescription: "Tìm hiểu dịch vụ cắt CNC gỗ và liên hệ Tùng Phát để trao đổi báo giá.", faq: [], featuredImage: "/images/cnc-service.webp", featuredImageAlt: "Ảnh tham khảo máy CNC gia công gỗ" } as unknown as ContentEntry<ServicePageFrontmatter>;
    const render = (entry: typeof page) => renderToStaticMarkup(createElement(CncServiceContent, { slug: "cat-cnc-go", page: entry }));
    expect(render(page)).toContain("nội dung do biên tập viên cập nhật");
    const fallback = render({ ...page, body: "Hãy gửi file qua Zalo và trao đổi các yêu cầu gia công cần thực hiện." });
    expect(fallback).not.toContain("gửi file");
    expect(fallback).toContain(cncServiceCopy["cat-cnc-go"].title);
  });
  it("uses distinct service descriptions", () => {
    expect(new Set(Object.values(cncServiceCopy).map((copy) => copy.description)).size).toBe(3);
  });
});
