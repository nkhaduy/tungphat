import { describe, expect, test } from "vitest";
import { collectMediaKeys, normalizeR2Key } from "../scripts/media-cleanup/reference-graph";

describe("R2 reference graph", () => {
  test("normalizes encoded media URLs and strips query transformations", () => {
    expect(normalizeR2Key("https://cms.mdftungphat.com/media/supplier/an-cu%6Fng/a.jpg?w=800#x"))
      .toBe("supplier/an-cuong/a.jpg");
    expect(normalizeR2Key("/catalog/a.webp?width=320")).toBe("catalog/a.webp");
  });

  test("collects direct and nested JSON media references", () => {
    const keys = collectMediaKeys({
      image: "/media/supplier/an-cuong/a.jpg",
      seo: { images: ["https://cms.mdftungphat.com/media/catalog/og.webp?v=2"] },
    });

    expect(keys).toEqual(new Set(["supplier/an-cuong/a.jpg", "catalog/og.webp"]));
  });

  test("ignores unrelated URLs", () => {
    expect(collectMediaKeys({ source: "https://ancuong.com/products/a.jpg" })).toEqual(new Set());
  });
});
