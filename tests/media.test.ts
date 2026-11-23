import { afterEach, describe, expect, it, vi } from "vitest";
import { absoluteMediaUrl, resolveMediaUrl, resolvePreviewUploadMediaUrl } from "../lib/media";

describe("central media URL resolution", () => {
  afterEach(() => vi.unstubAllEnvs());
  it("routes first-party catalogue and CMS media through the canonical CDN", () => {
    expect(resolveMediaUrl("/catalog/a.webp")).toBe("https://cdn.mdftungphat.com/catalog/a.webp");
    expect(resolveMediaUrl("catalog/a.webp")).toBe("https://cdn.mdftungphat.com/catalog/a.webp");
    expect(resolveMediaUrl("/media/uploads/a.webp?width=800#preview")).toBe(
      "https://cdn.mdftungphat.com/uploads/a.webp?width=800#preview",
    );
    expect(resolveMediaUrl("https://mdftungphat.com/catalog/a.webp")).toBe(
      "https://cdn.mdftungphat.com/catalog/a.webp",
    );
    expect(resolveMediaUrl("https://cms.mdftungphat.com/media/supplier/a.webp")).toBe(
      "https://cdn.mdftungphat.com/supplier/a.webp",
    );
    expect(resolveMediaUrl("https://old-r2-domain.r2.dev/catalog/a.webp")).toBe(
      "https://cdn.mdftungphat.com/catalog/a.webp",
    );
    expect(resolveMediaUrl("https://account.r2.cloudflarestorage.com/tung-phat-media/catalog/a.webp")).toBe(
      "https://cdn.mdftungphat.com/catalog/a.webp",
    );
    expect(absoluteMediaUrl("/catalog/a.webp", "https://mdftungphat.com")).toBe(
      "https://cdn.mdftungphat.com/catalog/a.webp",
    );
    expect(resolveMediaUrl("/gallery/project/a.webp")).toBe("https://cdn.mdftungphat.com/gallery/project/a.webp");
    expect(resolveMediaUrl("thumbnails/a.webp")).toBe("https://cdn.mdftungphat.com/thumbnails/a.webp");
    expect(resolveMediaUrl("/uploads-thumbnails/a.webp")).toBe("https://cdn.mdftungphat.com/uploads-thumbnails/a.webp");
    expect(resolveMediaUrl("/vendor/a.webp")).toBe("https://cdn.mdftungphat.com/vendor/a.webp");
  });

  it("is idempotent and preserves legitimate non-media references", () => {
    expect(resolveMediaUrl("https://cdn.mdftungphat.com/catalog/a.webp")).toBe(
      "https://cdn.mdftungphat.com/catalog/a.webp",
    );
    expect(resolveMediaUrl("https://third-party.com/a.webp")).toBe("https://third-party.com/a.webp");
    expect(resolveMediaUrl("data:image/webp;base64,AAAA")).toBe("data:image/webp;base64,AAAA");
    expect(resolveMediaUrl("blob:https://mdftungphat.com/asset-id")).toBe("blob:https://mdftungphat.com/asset-id");
    expect(resolveMediaUrl("/images/wood-panels.webp")).toBe("/images/wood-panels.webp");
    expect(resolveMediaUrl("/catalog/v%E1%BA%ADt-li%E1%BB%87u/%E1%BA%A3nh.webp?x=1")).toBe(
      "https://cdn.mdftungphat.com/catalog/v%E1%BA%ADt-li%E1%BB%87u/%E1%BA%A3nh.webp?x=1",
    );
  });

  it("uses one validated configurable public media base", () => {
    expect(resolveMediaUrl("/catalog/a.webp", "https://media.example.com/")).toBe(
      "https://media.example.com/catalog/a.webp",
    );
    expect(() => resolveMediaUrl("/catalog/a.webp", "http://media.example.com")).toThrow(/HTTPS/);
  });

  it("routes only staged upload objects through the isolated preview Worker", () => {
    vi.stubEnv("STATIC_BUILD_TARGET", "preview");
    const preview = "https://tungphat-static-assets-preview.nkhaduy.workers.dev";
    expect(resolvePreviewUploadMediaUrl("/media/uploads/qa.webp", preview)).toBe(`${preview}/uploads/qa.webp`);
    expect(resolvePreviewUploadMediaUrl("https://tungphat-payload-cms-staging.nkhaduy.workers.dev/media/uploads/qa.webp", preview)).toBe(`${preview}/uploads/qa.webp`);
    expect(resolvePreviewUploadMediaUrl("/uploads-thumbnails/qa.webp", preview)).toBe(`${preview}/uploads-thumbnails/qa.webp`);
    expect(resolvePreviewUploadMediaUrl("/catalog/product.webp", preview)).toBe("https://cdn.mdftungphat.com/catalog/product.webp");
    expect(() => resolvePreviewUploadMediaUrl("/uploads/qa.webp")).toThrow(/preview/i);
  });
});
