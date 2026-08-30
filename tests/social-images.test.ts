import { describe, expect, it } from "vitest";
import {
  createSocialImage,
  createSocialImages,
  twitterSocialImage,
} from "@/lib/social-images";

describe("createSocialImage", () => {
  it("uses registered dimensions and MIME for a local WebP", () => {
    expect(createSocialImage({
      url: "/images/cnc-service.webp",
      alt: "Máy CNC đang gia công ván",
    })).toEqual({
      url: "/images/cnc-service.webp",
      width: 1222,
      height: 821,
      alt: "Máy CNC đang gia công ván",
      type: "image/webp",
    });
  });

  it("uses registered dimensions for the default PNG", () => {
    expect(createSocialImage({ url: "/og-logo.png", alt: "Logo Tùng Phát" })).toMatchObject({
      url: "/og-logo.png",
      width: 1200,
      height: 630,
      type: "image/png",
    });
  });

  it("canonicalizes an explicit first-party JPEG page override", () => {
    expect(createSocialImage({
      url: "/uploads/mẫu-dự-án.jpg",
      width: 1600,
      height: 900,
      type: "image/jpeg",
      alt: "Mẫu dự án nội thất bằng gỗ",
    })).toEqual({
      url: "https://cdn.mdftungphat.com/uploads/m%E1%BA%ABu-d%E1%BB%B1-%C3%A1n.jpg",
      width: 1600,
      height: 900,
      type: "image/jpeg",
      alt: "Mẫu dự án nội thất bằng gỗ",
    });
  });

  it("requires dimensions for an unregistered image", () => {
    expect(() => createSocialImage({ url: "/uploads/new.webp", alt: "Ảnh mới" })).toThrow(/width/u);
  });

  it("rejects stale dimensions for a registered image", () => {
    expect(() => createSocialImage({
      url: "/og-logo.png",
      width: 899,
      height: 250,
      type: "image/png",
      alt: "Logo Tùng Phát",
    })).toThrow(/registered asset/u);
  });

  it("rejects missing alt text and a wrong MIME type", () => {
    expect(() => createSocialImage({ url: "/og-logo.png", alt: "  " })).toThrow(/alt/u);
    expect(() => createSocialImage({
      url: "/uploads/social.png",
      width: 1200,
      height: 630,
      type: "image/jpeg",
      alt: "Ảnh chia sẻ",
    })).toThrow(/file extension/u);
  });

  it("keeps an external URL unchanged when its metadata is explicit", () => {
    expect(createSocialImage({
      url: "https://cdn.example.com/social.webp",
      width: 1200,
      height: 630,
      type: "image/webp",
      alt: "Ảnh chia sẻ từ CDN",
    }).url).toBe("https://cdn.example.com/social.webp");
  });

  it("does not append a slash after a file extension", () => {
    expect(createSocialImage({ url: "/og-logo.png", alt: "Logo Tùng Phát" }).url).toBe("/og-logo.png");
  });
});

describe("social image collections", () => {
  it("normalizes multiple images independently", () => {
    const images = createSocialImages([
      { url: "/og-logo.png", alt: "Logo Tùng Phát" },
      { url: "/images/wood-panels.webp", alt: "Các tấm vật liệu gỗ" },
    ]);
    expect(images.map(({ width, height, type }) => ({ width, height, type }))).toEqual([
      { width: 1200, height: 630, type: "image/png" },
      { width: 1448, height: 1086, type: "image/webp" },
    ]);
  });

  it("uses the same URL and Unicode alt for Twitter", () => {
    const image = createSocialImage({ url: "/og-logo.png", alt: "Tùng Phát – giải pháp vật liệu gỗ" });
    expect(twitterSocialImage(image)).toEqual({
      url: "/og-logo.png",
      alt: "Tùng Phát – giải pháp vật liệu gỗ",
    });
  });
});
