import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ArticleFrontmatter } from "@/lib/content-schema";
import type { ContentEntry } from "@/lib/content";

vi.mock("@/lib/content", () => ({ getArticles: vi.fn() }));

import { getArticles } from "@/lib/content";
import ArticlesPage from "@/app/bai-viet/page";

const articles = [
  { slug: "mdf-first", title: "Hướng dẫn chọn tấm MDF phù hợp", category: "Kiến thức MDF", publishedAt: "2026-07-16", excerpt: "Thông tin về MDF để chọn quy cách phù hợp cho hạng mục nội thất.", featuredImage: "/sanpham-media/van-mdf.webp", featuredImageAlt: "Tấm MDF mộc", draft: false, noindex: false },
  { slug: "cnc-next", title: "Chuẩn bị bản vẽ để gia công CNC", category: "Gia công CNC", publishedAt: "2026-07-15", excerpt: "Thông tin cần chuẩn bị trước khi gửi bản vẽ cho xưởng gia công CNC.", featuredImage: "", featuredImageAlt: "", draft: false, noindex: false },
  { slug: "mdf-other", title: "Thông tin khác về ván MDF", category: "Kiến thức-MDF", publishedAt: "2026-07-14", excerpt: "Thông tin bổ sung về ván MDF để tham khảo khi lựa chọn vật liệu cho nội thất.", featuredImage: "", featuredImageAlt: "", draft: false, noindex: false },
] as unknown as ContentEntry<ArticleFrontmatter>[];

beforeEach(() => vi.mocked(getArticles).mockResolvedValue(articles));

describe("editorial article listing", () => {
  it("links only to categories present in crawlable article sections", async () => {
    const html = renderToStaticMarkup(await ArticlesPage());
    expect(html).toContain('href="#chu-de-kien-thuc-mdf"');
    expect(html).toContain('href="#chu-de-gia-cong-cnc"');
    expect(html).toContain('id="chu-de-kien-thuc-mdf"');
    expect(html).toContain('id="chu-de-gia-cong-cnc"');
    expect(html).toContain('href="#chu-de-kien-thuc-mdf-2"');
    expect(html).toContain('id="chu-de-kien-thuc-mdf-2"');
    expect(html).toContain('href="/bai-viet/mdf-first"');
    expect(html).toContain('href="/bai-viet/cnc-next"');
    expect(html).toContain("Hướng dẫn chọn tấm MDF phù hợp");
  });
});
