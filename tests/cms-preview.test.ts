import { describe, expect, it } from "vitest";
import { sanitizePayloadLivePreviewMessage } from "../lib/cms-preview";

describe("Payload live preview messages", () => {
  it("accepts Payload's collectionSlug/data message and preserves safe Lexical blocks", () => {
    const preview = sanitizePayloadLivePreviewMessage({
      type: "payload-live-preview",
      collectionSlug: "articles",
      data: {
        title: "Hướng dẫn chọn ván MDF",
        slug: "chon-van-mdf",
        editorContent: {
          root: { type: "root", children: [{ type: "heading", tag: "h2", children: [{ type: "text", text: "Kiểm tra chất lượng" }] }] },
        },
        legacyBodyHidden: true,
        internalAdminNote: "Không chuyển sang website.",
      },
    });

    expect(preview?.collection).toBe("articles");
    expect(preview?.data.editorContent).toEqual({
      root: { type: "root", children: [{ type: "heading", tag: "h2", children: [{ type: "text", text: "Kiểm tra chất lượng" }] }] },
    });
    expect(preview?.data.internalAdminNote).toBeUndefined();
    expect(preview?.data.legacyBodyHidden).toBe(true);
  });

  it("rejects unrelated messages and does not preserve executable object keys", () => {
    expect(sanitizePayloadLivePreviewMessage({ type: "other-event", collectionSlug: "articles", data: {} })).toBeNull();
    const preview = sanitizePayloadLivePreviewMessage({
      type: "payload-live-preview",
      collectionSlug: "articles",
      data: { editorContent: { root: { type: "root", children: [{ type: "text", text: "safe" }], __proto__: { polluted: true } } } },
    });
    expect(preview?.data.editorContent).not.toHaveProperty("root.__proto__");
  });

  it("allows the migrated public domain for preview media", () => {
    const preview = sanitizePayloadLivePreviewMessage({
      type: "payload-live-preview",
      collectionSlug: "articles",
      data: { featuredImage: "https://gotungphat.com/uploads/article-cover.webp" },
    });
    expect(preview?.data.featuredImage).toBe("https://gotungphat.com/uploads/article-cover.webp");
  });
});
