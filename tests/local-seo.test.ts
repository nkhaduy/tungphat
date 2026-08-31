import { describe, expect, it } from "vitest";
import { getLocalSeoCopy, localSeoSlugs } from "@/lib/local-seo";

describe("local commercial SEO copy", () => {
  it("maps every money page to a unique Thu Duc intent", () => {
    expect(localSeoSlugs).toEqual([
      "go-ghep",
      "go-ghep-cao-su",
      "go-ghep-tram",
      "van-mdf",
      "mdf-chong-am",
      "van-go-cong-nghiep",
      "gia-cong-cnc",
      "cat-cnc-go",
      "gia-cong-cnc-mdf",
    ]);

    const copies = localSeoSlugs.map((slug) => getLocalSeoCopy(slug));
    expect(copies.every((copy) => copy.title.includes("Thủ Đức"))).toBe(true);
    expect(new Set(copies.map((copy) => copy.title)).size).toBe(copies.length);
    expect(getLocalSeoCopy("go-ghep")).toMatchObject({
      h1: "Gỗ ghép tại Thủ Đức – cao su, tràm và gia công theo yêu cầu",
      title: "Gỗ Ghép Thủ Đức – Cao Su, Tràm & Gia Công",
    });
  });
});
