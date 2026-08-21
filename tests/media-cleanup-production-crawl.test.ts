import { describe, expect, test } from "vitest";
import { buildAnCuongCrawlTargets } from "../scripts/media-cleanup/production-crawl";

describe("An Cuong production crawl", () => {
  test("uses the thumbnail for the rendered hero and preserves full-size originals", () => {
    const targets = buildAnCuongCrawlTargets([{
      id: "an-cuong:TEST",
      codeRaw: "TEST",
      canonicalRoute: "/catalogue/an-cuong/melamine/test/",
      supplier: "an-cuong",
      images: [{
        role: "fullsheet",
        sourceUrl: "source",
        localPath: "/catalog/test-full.webp",
        thumbnailSrc: "/catalog/test-thumb.webp",
        originalUrl: "https://cms.mdftungphat.com/media/supplier/test.jpg",
      }],
    }]);

    expect(targets.pages).toEqual([{ id: "an-cuong:TEST", code: "TEST", route: "/catalogue/an-cuong/melamine/test/", hero: "/catalog/test-thumb.webp" }]);
    expect(targets.media).toEqual(new Set([
      "/catalog/test-thumb.webp",
      "/catalog/test-full.webp",
      "https://cms.mdftungphat.com/media/supplier/test.jpg",
    ]));
  });
});
