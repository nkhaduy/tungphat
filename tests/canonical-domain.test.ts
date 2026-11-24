import { describe, expect, it } from "vitest";
import { createContentMetadata } from "@/lib/content-metadata";
import { absolutePageUrl, absoluteUrl, SITE_URL } from "@/lib/seo";

describe("canonical domain migration", () => {
  it("uses gotungphat.com for generated canonical URLs", () => {
    expect(SITE_URL).toBe("https://gotungphat.com");
    expect(absoluteUrl("/catalogue")).toBe("https://gotungphat.com/catalogue/");
  });

  it("maps legacy article canonicals to the same path on the canonical host", () => {
    expect(absolutePageUrl("https://mdftungphat.com/bai-viet/go-ghep-la-gi")).toBe(
      "https://gotungphat.com/bai-viet/go-ghep-la-gi/",
    );

    const article = {
      slug: "domain-test-article",
      seoTitle: "Bài viết kiểm tra canonical trên domain mới",
      seoDescription: "Mô tả kiểm thử đủ độ dài để xác nhận canonical bài viết vẫn giữ nguyên đường dẫn nội dung.",
      canonical: "https://mdftungphat.com/bai-viet/domain-test-article",
      noindex: false,
      draft: false,
      featuredImage: "/images/editorial/wood-panels.webp",
      featuredImageAlt: "Ảnh vật liệu gỗ dùng để kiểm tra canonical domain",
      ogImage: "",
      mediaMetadata: { featuredImage: { width: 1200, height: 630, type: "image/webp" } },
      sourcePath: "tests/fixtures/domain-test-article",
    } as Parameters<typeof createContentMetadata>[0];

    const metadata = createContentMetadata(article, "/bai-viet/domain-test-article");
    expect(metadata.alternates?.canonical).toBe(
      "https://gotungphat.com/bai-viet/domain-test-article/",
    );
  });
});
