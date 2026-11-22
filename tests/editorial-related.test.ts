import { describe, expect, it } from "vitest";
import { resolveArticleRelatedItems } from "@/lib/editorial/related-content";
import type { ContentEntry } from "@/lib/content";
import type { ArticleFrontmatter, ProductFrontmatter, ServicePageFrontmatter } from "@/lib/content-schema";

const entry = <T extends { slug: string; title: string }>(value: Partial<T> & Pick<T, "slug" | "title">) => value as ContentEntry<T>;

describe("editorial related content", () => {
  it("uses only existing published targets, preserves relationship order, and avoids self links", () => {
    const result = resolveArticleRelatedItems({ slug: "current", relatedProducts: ["mdf", "service", "missing"], relatedArticles: ["other", "current", "missing"] }, {
      articles: [entry<ArticleFrontmatter>({ slug: "other", title: "Bài viết có thật" })],
      products: [entry<ProductFrontmatter>({ slug: "mdf", title: "Ván MDF" })],
      servicePages: [entry<ServicePageFrontmatter>({ slug: "service", title: "Gia công CNC" })],
    });
    expect(result).toEqual([
      { href: "/bai-viet/other", label: "Bài viết có thật", kind: "Bài viết" },
      { href: "/mdf", label: "Ván MDF", kind: "Vật liệu" },
      { href: "/service", label: "Gia công CNC", kind: "Dịch vụ" },
    ]);
  });
});
