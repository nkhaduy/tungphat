import { describe, expect, it } from "vitest";
import { resolveEditorialMedia } from "@/lib/editorial/media";

describe("editorial image variants", () => {
  it("uses verified responsive WebP derivatives and preserves unregistered CMS media URLs", () => {
    expect(resolveEditorialMedia("https://cdn.mdftungphat.com/uploads/cnc-service.webp", "featured")).toBe("/images/editorial/cnc-service.webp");
    expect(resolveEditorialMedia("/uploads/wood-panels.webp", "thumbnail")).toBe("/images/editorial/wood-panels-480.webp");
    expect(resolveEditorialMedia("/uploads/vanchongam.webp", "featured")).toBe("/images/editorial/vanchongam.webp");
    expect(resolveEditorialMedia("https://cdn.mdftungphat.com/uploads/future-article.webp", "featured")).toBe("https://cdn.mdftungphat.com/uploads/future-article.webp");
  });
});
