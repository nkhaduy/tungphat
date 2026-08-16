import { describe, expect, it } from "vitest";
import { classifySupplierMedia } from "@/lib/catalog/supplier-media/classify";
import {
  dedupeSupplierMedia,
  resolveOriginalMedia,
  selectPrimaryMedia,
} from "@/lib/catalog/supplier-media/resolve";

describe("supplier media resolution", () => {
  it("prefers a lightbox original over generated thumbnails and query crops", () => {
    expect(resolveOriginalMedia({
      src: "https://supplier.test/a-300x300.jpg?w=300&crop=1",
      srcset: "https://supplier.test/a-768x512.jpg 768w, https://supplier.test/a.jpg 2400w",
      lightboxHref: "https://supplier.test/original/a.jpg",
    })).toMatchObject({
      selectedUrl: "https://supplier.test/original/a.jpg",
      suspectedCrop: false,
      selectionReason: "lightbox",
    });
  });

  it("chooses the largest srcset candidate and flags a generated-size fallback", () => {
    expect(resolveOriginalMedia({
      src: "https://supplier.test/a-300x300.jpg",
      srcset: "https://supplier.test/a-300x300.jpg 300w, https://supplier.test/a-1024x683.jpg 1024w, https://supplier.test/a.jpg 2400w",
    })).toMatchObject({ selectedUrl: "https://supplier.test/a.jpg", suspectedCrop: false });

    expect(resolveOriginalMedia({ src: "https://supplier.test/a-600x600.jpg" }))
      .toMatchObject({ selectedUrl: "https://supplier.test/a-600x600.jpg", suspectedCrop: true });
  });

  it("retains a room image attached to a product and rejects covers and placeholders", () => {
    expect(classifySupplierMedia({
      url: "https://supplier.test/kitchen-room.jpg",
      alt: "Không gian bếp ứng dụng BT182",
      section: "product-gallery",
      associatedWithProduct: true,
    })).toEqual({ accepted: true, type: "room" });

    expect(classifySupplierMedia({
      url: "https://supplier.test/catalogue-cover-2026.jpg",
      alt: "Catalogue 2026",
      section: "product-gallery",
      associatedWithProduct: true,
    })).toEqual({ accepted: false, reason: "catalogue-cover" });

    expect(classifySupplierMedia({
      url: "https://supplier.test/no-image.png",
      alt: "No image",
      section: "product-gallery",
      associatedWithProduct: true,
    })).toEqual({ accepted: false, reason: "placeholder" });
  });

  it("deduplicates identical bytes while retaining the highest-resolution original", () => {
    const retained = dedupeSupplierMedia([
      { sourceUrl: "https://supplier.test/thumb.jpg", selectedUrl: "https://supplier.test/thumb.jpg", type: "detail", checksum: "same", width: 300, height: 200, suspectedCrop: true },
      { sourceUrl: "https://supplier.test/original.jpg", selectedUrl: "https://supplier.test/original.jpg", type: "detail", checksum: "same", width: 2400, height: 1600, suspectedCrop: false },
      { sourceUrl: "https://supplier.test/room-2.jpg", selectedUrl: "https://supplier.test/room-2.jpg", type: "room", checksum: "different", width: 2400, height: 1600, suspectedCrop: false },
    ]);

    expect(retained.map((item) => item.selectedUrl)).toEqual([
      "https://supplier.test/original.jpg",
      "https://supplier.test/room-2.jpg",
    ]);
  });

  it("selects texture before detail and room while preserving gallery order", () => {
    const selected = selectPrimaryMedia([
      { sourceUrl: "room", selectedUrl: "room", type: "room", checksum: "1", width: 2400, height: 1600, suspectedCrop: false },
      { sourceUrl: "detail", selectedUrl: "detail", type: "detail", checksum: "2", width: 1800, height: 1800, suspectedCrop: false },
      { sourceUrl: "texture", selectedUrl: "texture", type: "texture", checksum: "3", width: 1200, height: 1200, suspectedCrop: false },
    ]);

    expect(selected.primary?.selectedUrl).toBe("texture");
    expect(selected.gallery.map((item) => item.selectedUrl)).toEqual(["texture", "detail", "room"]);
  });
});
