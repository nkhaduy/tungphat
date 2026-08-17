import { describe, expect, test } from "vitest";
import { buildSupplierGalleryInventory } from "../payload-cms/scripts/current-production-lib";

describe("Payload supplier gallery inventory", () => {
  test("maps a deduplicated public gallery to the matching Payload stable key", () => {
    const result = buildSupplierGalleryInventory(
      [{ id: "an-cuong:sku:303", supplierId: "an-cuong", normalizedCode: "MFCMS01012T", code: "MFC - MS 01012 T" }],
      [{
        id: "an-cuong:MFCMS01012T",
        supplier: "an-cuong",
        codeNormalized: "MFCMS01012T",
        images: [
          { role: "fullsheet", localPath: "/catalog/a-full.webp", thumbnailSrc: "/catalog/a-swatch.webp", originalPath: "/media/supplier/a/board/full.jpg", originalWidth: 5000, originalHeight: 2500, originalBytes: 3_000_000, originalChecksum: "full-sha" },
          { role: "application", localPath: "/catalog/a-room.webp", originalPath: "/media/supplier/a/application/room.jpg", originalWidth: 1408, originalHeight: 768, originalBytes: 90_000, originalChecksum: "room-sha" },
        ],
      }],
    );

    expect(result.galleries.get("an-cuong:sku:303")?.map((image) => image.r2Key)).toEqual([
      "supplier/a/board/full.jpg",
      "supplier/a/application/room.jpg",
    ]);
    expect(result.media.map((image) => image.r2Key)).toContain("catalog/a-swatch.webp");
    expect(result.media.map((image) => image.r2Key)).not.toContain("catalog/a-room.webp");
    expect(result.featuredByStableKey.get("an-cuong:sku:303")).toBe("catalog/a-swatch.webp");
  });

  test("compacts repeated R2 keys while preserving the first gallery order", () => {
    const repeated = "/media/supplier/ba-thanh/bt100/detail/same.jpg";
    const result = buildSupplierGalleryInventory(
      [{ id: "ba-thanh:sku:100", supplierId: "ba-thanh", normalizedCode: "BT100" }],
      [{
        supplier: "ba-thanh",
        codeNormalized: "BT100",
        images: [
          { role: "swatch", originalPath: "/media/supplier/ba-thanh/bt100/swatch/main.jpg" },
          { role: "detail", originalPath: repeated },
          { role: "detail", originalPath: repeated },
        ],
      }],
    );

    expect(result.galleries.get("ba-thanh:sku:100")?.map((image) => image.r2Key)).toEqual([
      "supplier/ba-thanh/bt100/swatch/main.jpg",
      "supplier/ba-thanh/bt100/detail/same.jpg",
    ]);
  });
});
