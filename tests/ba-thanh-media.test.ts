import { describe, expect, it } from "vitest";
import { buildCatalogMediaPaths } from "@/scripts/ba-thanh/download-media";

describe("Ba Thanh responsive catalogue media", () => {
  it("creates a dedicated local thumbnail path for swatch cards", () => {
    expect(buildCatalogMediaPaths("bt-111", "swatch")).toEqual({
      localPath: "/catalog/ba-thanh/ba-thanh-melamine-bt-111-swatch.webp",
      thumbnailLocalPath: "/catalog/ba-thanh/ba-thanh-melamine-bt-111-swatch-thumb.webp",
    });
  });

  it("does not create unused thumbnails for detail-only images", () => {
    expect(buildCatalogMediaPaths("bt-111", "application")).toEqual({
      localPath: "/catalog/ba-thanh/ba-thanh-melamine-bt-111-application.webp",
    });
  });
});
