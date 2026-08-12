import { readFileSync } from "node:fs";
import matter from "gray-matter";
import { describe, expect, it } from "vitest";

const vercelConfig = JSON.parse(readFileSync("vercel.json", "utf8")) as {
  redirects?: Array<{ source: string; destination: string; permanent: boolean }>;
};

function product(slug: string) {
  return matter(readFileSync(`content/products/${slug}.md`, "utf8"));
}

describe("Phase 12 Google evidence fixes", () => {
  it.each([
    ["/danh-muc-san-pham/van-cong-nghiep", "/van-go-cong-nghiep/"],
    ["/danh-muc-san-pham/van-cong-nghiep/", "/van-go-cong-nghiep/"],
    ["/danh-muc-san-pham/go-ghep", "/go-ghep/"],
    ["/danh-muc-san-pham/go-ghep/", "/go-ghep/"],
    ["/danh-muc-san-pham/van-mdf", "/van-mdf/"],
    ["/danh-muc-san-pham/van-mdf/", "/van-mdf/"],
    ["/danh-muc-san-pham/van-ep", "/van-go-cong-nghiep/"],
    ["/danh-muc-san-pham/van-ep/", "/van-go-cong-nghiep/"],
    ["/san-pham/van-mdf-tron", "/van-mdf/"],
    ["/san-pham/van-mdf-tron/", "/van-mdf/"],
    ["/danh-muc-san-pham/tung-phat", "/"],
    ["/danh-muc-san-pham/tung-phat/", "/"],
    ["/danh-muc-san-pham/go-ghep-thanh", "/go-ghep/"],
    ["/danh-muc-san-pham/go-ghep-thanh/", "/go-ghep/"],
    ["/san-pham/go-ghep-thanh", "/go-ghep/"],
    ["/san-pham/go-ghep-thanh/", "/go-ghep/"],
    [
      "/go-ghep-go-ghep-thanh-la-gi-dac-diem-ung-dung-quy-trinh-san-xuat",
      "/bai-viet/go-ghep-la-gi/",
    ],
    [
      "/go-ghep-go-ghep-thanh-la-gi-dac-diem-ung-dung-quy-trinh-san-xuat/",
      "/bai-viet/go-ghep-la-gi/",
    ],
  ])("permanently redirects the reported legacy URL %s", (source, destination) => {
    expect(vercelConfig.redirects).toContainEqual({ source, destination, permanent: true });
  });

  it("answers the reported Thu Duc melamine MDF intent on the canonical guide", () => {
    const guide = product("van-go-cong-nghiep");
    expect(guide.content).toContain("MDF phủ melamine tại Thủ Đức");
    expect(guide.content).toContain("cốt MDF, mã màu hoặc mẫu bề mặt");
  });

  it("keeps discovered articles reachable from indexed material pages", () => {
    expect(product("van-go-cong-nghiep").data.relatedArticles).toContain("mdf-thuong-va-chong-am");
    expect(product("go-ghep").data.relatedArticles).toContain("go-ghep-la-gi");
  });

  it("links the homepage's generic wood-panel intent to the canonical go-ghep hub", () => {
    const homepage = readFileSync("components/home/HomeContent.tsx", "utf8");
    expect(homepage).toContain('{ name: "Gỗ ghép", href: "/go-ghep"');
  });
});
