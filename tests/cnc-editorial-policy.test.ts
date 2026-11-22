import { describe, expect, it } from "vitest";
import { resolveCncEditorial } from "@/lib/cnc-service-editorial";

const safe = { title: "Cắt CNC gỗ theo yêu cầu", excerpt: "Dịch vụ cắt chi tiết gỗ phục vụ các hạng mục nội thất theo nhu cầu.", body: "## Cắt chi tiết gỗ\n\nTùng Phát trao đổi và kiểm tra khả năng gia công theo từng yêu cầu cụ thể.", seoTitle: "Dịch vụ cắt CNC gỗ", seoDescription: "Tìm hiểu dịch vụ cắt CNC gỗ và liên hệ Tùng Phát để trao đổi báo giá.", faq: [{ question: "Có nhận cắt chi tiết gỗ không?", answer: "Phạm vi gia công được kiểm tra theo từng yêu cầu." }] };

describe("CMS content for CNC services", () => {
  it("allows editors to update compliant content and SEO", () => {
    expect(resolveCncEditorial(safe)).toEqual(safe);
  });
  it.each(["Hãy gửi file qua Zalo", "Tải tệp bản vẽ", "Upload tài liệu", "Gửi bản thiết kế", "# Một H1 khác", "   # Một H1 khác", "Một H1 khác\n========"])("does not use unsafe legacy body: %s", (body) => {
    expect(resolveCncEditorial({ ...safe, body: `${safe.body}\n\n${body}` })).toBeNull();
  });
  it("does not use unsafe FAQ or metadata", () => {
    expect(resolveCncEditorial({ ...safe, seoTitle: "Gửi file để báo giá" })).toBeNull();
    expect(resolveCncEditorial({ ...safe, faq: [{ question: "Gửi file thế nào?", answer: "Trao đổi qua Zalo." }] })).toBeNull();
  });
});
