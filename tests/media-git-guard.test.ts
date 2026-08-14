import { describe, expect, it } from "vitest";
import { forbiddenTrackedMedia } from "../scripts/media/check-git";

describe("media Git guard", () => {
  it("rejects generated catalogue and crawl media but keeps intentional small design assets", () => {
    expect(forbiddenTrackedMedia([
      "public/catalog/a.webp",
      "data/imports/ancuong/media/a.webp",
      "public/logo-horizontal.webp",
      "public/images/hero.webp",
    ])).toEqual(["data/imports/ancuong/media/a.webp", "public/catalog/a.webp"]);
  });
});
