import sharp from "sharp";
import { describe, expect, test } from "vitest";
import {
  classifyImageBuffers,
  normalizeMediaReference,
} from "../scripts/media-cleanup/image-compare";
import { selectCanonicalMedia } from "../scripts/media-cleanup/canonical";

describe("media cleanup image comparison", () => {
  test("normalizes equivalent CMS media references", () => {
    expect(normalizeMediaReference("https://cms.mdftungphat.com/media/supplier%2Fan-cuong%2FAC1%2Ffull.jpg?width=800#x"))
      .toBe("supplier/an-cuong/AC1/full.jpg");
    expect(normalizeMediaReference("/media/supplier/an-cuong/AC1/full.jpg"))
      .toBe("supplier/an-cuong/AC1/full.jpg");
  });

  test("classifies resized re-encodes of the same uncropped image as visual duplicates", async () => {
    const pixels = Buffer.from([
      130, 75, 35, 255, 90, 45, 15, 255,
      170, 110, 55, 255, 115, 62, 25, 255,
    ]);
    const original = await sharp(pixels, { raw: { width: 2, height: 2, channels: 4 } })
      .resize(1200, 1200, { kernel: "nearest" })
      .jpeg({ quality: 96 })
      .toBuffer();
    const reencoded = await sharp(pixels, { raw: { width: 2, height: 2, channels: 4 } })
      .resize(600, 600, { kernel: "nearest" })
      .webp({ quality: 82 })
      .toBuffer();

    const result = await classifyImageBuffers(original, reencoded);

    expect(result.classification).toBe("VISUAL_DUPLICATE");
    expect(result.normalizedPixelSimilarity).toBeGreaterThan(0.98);
  });

  test("keeps an intentional crop even when it comes from the same source image", async () => {
    const source = await sharp({
      create: { width: 800, height: 400, channels: 3, background: { r: 100, g: 55, b: 20 } },
    })
      .composite([{ input: Buffer.from('<svg width="400" height="400"><rect width="400" height="400" fill="#d9a066"/></svg>'), left: 400, top: 0 }])
      .png()
      .toBuffer();
    const crop = await sharp(source).extract({ left: 0, top: 0, width: 400, height: 400 }).jpeg().toBuffer();

    const result = await classifyImageBuffers(source, crop);

    expect(result.classification).toBe("NOT_DUPLICATE");
    expect(result.reason).toBe("aspect-ratio-mismatch");
  });
});

describe("canonical media selection", () => {
  test("preserves the full-size image instead of the smaller first gallery image", () => {
    const selected = selectCanonicalMedia([
      { id: "image-1", width: 800, height: 800, bytes: 80_000, role: "swatch", referenceCount: 4 },
      { id: "image-2", width: 2400, height: 2400, bytes: 1_200_000, role: "fullsheet", referenceCount: 1 },
    ]);

    expect(selected.id).toBe("image-2");
  });
});
