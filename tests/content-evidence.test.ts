import { describe, expect, it } from "vitest";
import { hasMinimumProductEvidence, scoreProductEvidence } from "@/lib/content-evidence";

describe("product publication evidence gate", () => {
  it("indexes a product only when core evidence and useful content are present", () => {
    const product = {
      title: "Ván MDF",
      excerpt: "Thông tin vật liệu đã được kiểm tra.",
      featuredImage: "/wood/mdfmfc.webp",
      category: "Ván gỗ công nghiệp",
      dimensions: ["Theo mã hàng"],
      thicknesses: ["Xác nhận"],
      surfaces: ["Theo catalogue"],
      applications: ["Tủ"],
      limitations: ["Không mặc định chống nước"],
      canonical: "https://mdftungphat.com/van-mdf",
      body: "x".repeat(500),
    };

    expect(scoreProductEvidence(product)).toBeGreaterThanOrEqual(7);
    expect(hasMinimumProductEvidence(product)).toBe(true);
  });

  it("keeps a placeholder out of the index when evidence is missing", () => {
    const placeholder = {
      title: "Mẫu sản phẩm",
      excerpt: "Cập nhật sau.",
      featuredImage: "/images/placeholder.webp",
      category: "",
      dimensions: [],
      thicknesses: [],
      surfaces: [],
      applications: [],
      limitations: [],
      canonical: "",
      body: "ngắn",
    };

    expect(scoreProductEvidence(placeholder)).toBeLessThan(7);
    expect(hasMinimumProductEvidence(placeholder)).toBe(false);
  });
});
