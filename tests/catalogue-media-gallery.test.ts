import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { SupplierMediaGallery } from "@/components/catalog/SupplierMediaGallery";

describe("supplier media gallery", () => {
  it("renders only the primary thumbnail before the lightbox opens", () => {
    const html = renderToStaticMarkup(createElement(SupplierMediaGallery, { images: [
      { src: "/catalog/thumb.webp", originalUrl: "https://cms.mdftungphat.com/media/supplier/a/original.jpg", alt: "Texture", type: "swatch" },
      { src: "/catalog/room-thumb.webp", originalUrl: "https://cms.mdftungphat.com/media/supplier/a/room.jpg", alt: "Room", type: "application" },
    ] }));

    expect(html).toContain("%2Fcatalog%2Fthumb.webp");
    expect(html).not.toContain("original.jpg");
    expect(html).not.toContain("room.jpg");
    expect(html).toContain("Mở thư viện 2 ảnh");
  });

  it("provides lightweight thumbnail navigation inside the lightbox", () => {
    const source = readFileSync("components/catalog/SupplierMediaGallery.tsx", "utf8");

    expect(source).toContain("Chuyển đến ảnh");
    expect(source).toContain("image.thumbnailSrc || image.src");
    expect(source).toContain('aria-current={imageIndex === index ? "true" : undefined}');
    expect(source).toContain("z-[1000]");
    expect(source).toContain("createPortal(");
  });
});
