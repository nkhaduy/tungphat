import { describe, expect, test } from "vitest";
import { compactConfirmedGalleryDuplicates } from "../scripts/media-cleanup/gallery-dedup";
import { applyAnCuongGalleryDecisions } from "../scripts/media-cleanup/gallery-decisions";

describe("An Cuong gallery compaction", () => {
  test("keeps the full-size second image and attaches the first preview as its thumbnail", () => {
    const images = [
      { role: "swatch", sourceUrl: "thumb-A", localPath: "/catalog/a-swatch.webp", originalPath: "/media/supplier/a/swatch/hash-a.jpg", originalWidth: 1000, originalHeight: 500 },
      { role: "fullsheet", sourceUrl: "full-A", localPath: "/catalog/a-full.webp", originalPath: "/media/supplier/a/board/hash-b.jpg", originalWidth: 5000, originalHeight: 2500 },
      { role: "application", sourceUrl: "room-B", localPath: "/catalog/a-room.webp", originalPath: "/media/supplier/a/application/hash-c.jpg", originalWidth: 1408, originalHeight: 768 },
    ];

    const result = compactConfirmedGalleryDuplicates(images, [{ duplicateIndex: 0, canonicalIndex: 1 }]);

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ role: "fullsheet", thumbnailSrc: "/catalog/a-swatch.webp" });
    expect(result[1]).toMatchObject({ role: "application", sourceUrl: "room-B" });
  });

  test("does not remove an application image unless it is explicitly confirmed duplicate", () => {
    const images = [
      { role: "fullsheet", sourceUrl: "board", localPath: "/board.webp" },
      { role: "application", sourceUrl: "room", localPath: "/room.webp" },
    ];

    expect(compactConfirmedGalleryDuplicates(images, [])).toEqual(images);
  });

  test("keeps the canonical swatch preview when a lower-resolution fullsheet is removed", () => {
    const images = [
      { role: "swatch", sourceUrl: "swatch", localPath: "/catalog/a-swatch.webp", originalWidth: 1000, originalHeight: 500 },
      { role: "fullsheet", sourceUrl: "fullsheet", localPath: "/catalog/a-full.webp", originalWidth: 540, originalHeight: 270 },
      { role: "application", sourceUrl: "room", localPath: "/catalog/a-room.webp" },
    ];

    const result = compactConfirmedGalleryDuplicates(images, [{ duplicateIndex: 1, canonicalIndex: 0 }]);

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ role: "swatch", localPath: "/catalog/a-swatch.webp" });
    expect(result[0].thumbnailSrc).toBeUndefined();
    expect(result[1]).toMatchObject({ role: "application", sourceUrl: "room" });
  });
});

describe("An Cuong gallery decisions", () => {
  test("applies only a checksum-matched confirmed decision", () => {
    const record = {
      id: "an-cuong:TEST",
      images: [
        { role: "swatch", sourceUrl: "swatch", localPath: "/swatch.webp", originalChecksum: "swatch-sha" },
        { role: "fullsheet", sourceUrl: "fullsheet", localPath: "/full.webp", originalChecksum: "full-sha" },
        { role: "application", sourceUrl: "room", localPath: "/room.webp", originalChecksum: "room-sha" },
      ],
    };
    const decisions = [{
      recordId: record.id,
      duplicateIndex: 0,
      canonicalIndex: 1,
      duplicateChecksum: "swatch-sha",
      canonicalChecksum: "full-sha",
      classification: "VISUAL_DUPLICATE" as const,
    }];

    const [updated] = applyAnCuongGalleryDecisions([record], decisions);

    expect(updated.images).toHaveLength(2);
    expect(updated.images[0]).toMatchObject({ role: "fullsheet", thumbnailSrc: "/swatch.webp" });
    expect(updated.images[1]).toMatchObject({ role: "application" });
  });

  test("rejects a stale decision when media checksums changed", () => {
    const record = {
      id: "an-cuong:TEST",
      images: [
        { role: "swatch", sourceUrl: "swatch", originalChecksum: "new-swatch-sha" },
        { role: "fullsheet", sourceUrl: "fullsheet", originalChecksum: "full-sha" },
      ],
    };

    expect(() => applyAnCuongGalleryDecisions([record], [{
      recordId: record.id,
      duplicateIndex: 0,
      canonicalIndex: 1,
      duplicateChecksum: "old-swatch-sha",
      canonicalChecksum: "full-sha",
      classification: "VISUAL_DUPLICATE",
    }])).toThrow(/stale gallery decision/i);
  });

  test("reapplies an audited decision after the removed checksum metadata is no longer in the rebuilt artifact", () => {
    const record = {
      id: "an-cuong:TEST",
      images: [
        { role: "swatch", sourceUrl: "https://supplier/swatch.jpg" },
        { role: "fullsheet", sourceUrl: "https://supplier/full.jpg", originalChecksum: "full-sha" },
      ],
    };
    const [updated] = applyAnCuongGalleryDecisions([record], [{
      recordId: record.id,
      duplicateIndex: 0,
      canonicalIndex: 1,
      duplicateChecksum: "audited-swatch-sha",
      canonicalChecksum: "full-sha",
      duplicateSourceUrl: "https://supplier/swatch.jpg",
      canonicalSourceUrl: "https://supplier/full.jpg",
      classification: "VISUAL_DUPLICATE",
    }]);

    expect(updated.images).toHaveLength(1);
    expect(updated.images[0].role).toBe("fullsheet");
  });
});
