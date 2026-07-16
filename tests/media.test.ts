import { describe, expect, it } from "vitest";
import { absoluteMediaUrl, isSafeMediaKey, mediaUrl } from "@/lib/media";
import {
  filenameMatchesType,
  generateMediaKey,
  isAllowedMediaType,
  isExactObjectKey,
  isSafeListPrefix,
  sanitizeFilename,
  sniffMediaType
} from "@/functions/_lib/media";

describe("media object keys and filenames", () => {
  it("sanitizes Unicode filenames", () => {
    expect(sanitizeFilename("Ảnh xưởng Tùng Phát 01.WEBP")).toBe("anh-xuong-tung-phat-01");
  });

  it("generates unique keys for duplicate filenames", () => {
    const now = new Date("2026-07-17T00:00:00Z");
    const first = generateMediaKey("xưởng.png", "image/png", now, "11111111-1111-4111-8111-111111111111");
    const second = generateMediaKey("xưởng.png", "image/png", now, "22222222-2222-4222-8222-222222222222");
    expect(first).not.toBe(second);
    expect(first).toMatch(/^images\/2026\/07\/17\/xuong-/);
  });

  it("blocks traversal and wildcard keys", () => {
    expect(isExactObjectKey("images/2026/07/photo.webp")).toBe(true);
    expect(isExactObjectKey("images/../secret.webp")).toBe(false);
    expect(isExactObjectKey("images/*.webp")).toBe(false);
    expect(isSafeListPrefix("images/2026/07/")).toBe(true);
    expect(isSafeListPrefix("../trash/")).toBe(false);
  });
});

describe("MIME validation", () => {
  it("accepts supported MIME and matching extensions", () => {
    expect(isAllowedMediaType("image/webp")).toBe(true);
    expect(filenameMatchesType("ảnh.webp", "image/webp")).toBe(true);
    expect(filenameMatchesType("video.mp4", "video/mp4")).toBe(true);
  });

  it("rejects executable and mismatched extensions", () => {
    expect(isAllowedMediaType("text/html")).toBe(false);
    expect(isAllowedMediaType("image/svg+xml")).toBe(false);
    expect(filenameMatchesType("payload.html", "image/png")).toBe(false);
  });

  it("checks magic bytes", () => {
    expect(sniffMediaType(Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).buffer)).toBe("image/png");
    expect(sniffMediaType(new TextEncoder().encode("<script>alert(1)</script>").buffer)).toBeNull();
  });
});

describe("mediaUrl", () => {
  it("keeps legacy public paths", () => {
    expect(mediaUrl("/images/cnc-service.webp")).toBe("/images/cnc-service.webp");
  });

  it("renders R2 keys from a configured base URL", () => {
    expect(mediaUrl({ key: "images/2026/07/photo.webp" }, "https://pub-example.r2.dev/" )).toBe("https://pub-example.r2.dev/images/2026/07/photo.webp");
    expect(absoluteMediaUrl("/images/legacy.webp", "https://mdftungphat.com")).toBe("https://mdftungphat.com/images/legacy.webp");
  });

  it("rejects unsafe keys and missing configuration", () => {
    expect(isSafeMediaKey("images/../secret.webp")).toBe(false);
    expect(() => mediaUrl({ key: "images/2026/07/photo.webp" }, "")).toThrow(/NEXT_PUBLIC_MEDIA_BASE_URL/);
  });
});
