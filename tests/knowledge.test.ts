import { describe, expect, it } from "vitest";
import { buildKnowledgeIndex } from "@/lib/knowledge";

describe("machine-readable knowledge index", () => {
  it("contains only public published content with canonical URLs", async () => {
    const index = await buildKnowledgeIndex();
    const urls = index.pages.map((page) => page.url);

    expect(index.schemaVersion).toBe("1.0");
    expect(index.business.name).toBe("Công ty TNHH TMDV Gỗ Tùng Phát");
    expect(index.business.url).toBe("https://mdftungphat.com/");
    expect(urls).toContain("https://mdftungphat.com/van-mdf/");
    expect(urls).toContain("https://mdftungphat.com/bai-viet/go-ghep-la-gi/");
    expect(urls).toContain("https://mdftungphat.com/bai-viet/mdf-thuong-va-chong-am/");
    expect(urls).toContain("https://mdftungphat.com/bai-viet/chuan-bi-file-cnc/");
    expect(urls.every((url) => url.endsWith("/"))).toBe(true);
    expect(index.pages.find((page) => page.url.endsWith("/go-ghep/"))?.type).toBe("CollectionPage");
    expect(index.locations.map((location) => location.image)).toEqual([
      "https://cdn.mdftungphat.com/uploads/chi-nhanh-1.webp",
      "https://cdn.mdftungphat.com/uploads/chi-nhanh-2.webp",
    ]);
  });
});
