import { describe, expect, it } from "vitest";
import { absoluteMediaUrl, resolveMediaUrl } from "../lib/media";

describe("central media URL resolution", () => {
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
});
