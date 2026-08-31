import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { getLocalSeoCopy } from "@/lib/local-seo";

const waveOneSlugs = [
  "go-ghep",
  "go-ghep-cao-su",
  "go-ghep-tram",
  "van-mdf",
  "mdf-chong-am",
  "van-go-cong-nghiep",
  "gia-cong-cnc",
  "cat-cnc-go",
  "gia-cong-cnc-mdf",
] as const;

const implementationLanguage = /(?:Repository hiện không có dữ liệu|giữ null trong JSON|layout shift|Website hiện chưa có bộ ảnh|CTA trên trang vẫn dùng để|người quản trị cập nhật)/iu;

describe("Wave 1 commercial copy", () => {
  it("uses the reduced shared templates only on the Wave 1 commercial routes", () => {
    const productLanding = fs.readFileSync(path.join(process.cwd(), "components/content/ProductLanding.tsx"), "utf8");
    const serviceLanding = fs.readFileSync(path.join(process.cwd(), "components/content/ServiceLanding.tsx"), "utf8");

    expect(productLanding).toContain("waveOneProductSlugs");
    expect(serviceLanding).toContain("waveOneServiceSlugs");
  });

  it("keeps local H1 and metadata intent without implementation or compliance copy", () => {
    for (const slug of waveOneSlugs) {
      const copy = getLocalSeoCopy(slug);
      expect(copy, slug).toBeDefined();
      const value = Object.values(copy ?? {}).join(" ");
      expect(value).not.toMatch(implementationLanguage);
      expect(copy?.h1).toMatch(/Thủ Đức/iu);
    }
  });

  it("does not expose implementation or repeated disclaimer copy on the homepage", () => {
    const homepage = fs.readFileSync(path.join(process.cwd(), "components/home/HomeContent.tsx"), "utf8");
    expect(homepage).not.toMatch(implementationLanguage);
    expect(homepage).not.toContain("Các trang chi tiết và hình ảnh dưới đây được nối tới nội dung đã có trong website");
    expect(homepage).not.toContain("Thông tin dưới đây chỉ dựa trên những gì Tùng Phát đang công khai");
  });
});
