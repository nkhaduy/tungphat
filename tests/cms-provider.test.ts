import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { activeCmsProvider, normalizePayloadRecord, readPayloadSnapshot } from "@/lib/cms-provider";

const previousProvider = process.env.CMS_PROVIDER;
const previousSnapshot = process.env.PAYLOAD_CMS_SNAPSHOT;

afterEach(() => {
  if (previousProvider === undefined) delete process.env.CMS_PROVIDER;
  else process.env.CMS_PROVIDER = previousProvider;
  if (previousSnapshot === undefined) delete process.env.PAYLOAD_CMS_SNAPSHOT;
  else process.env.PAYLOAD_CMS_SNAPSHOT = previousSnapshot;
});

describe("CMS provider facade", () => {
  it("mặc định giữ Decap và chỉ bật Payload bằng feature flag rõ ràng", () => {
    delete process.env.CMS_PROVIDER;
    expect(activeCmsProvider()).toBe("decap");
    process.env.CMS_PROVIDER = "payload";
    expect(activeCmsProvider()).toBe("payload");
    process.env.CMS_PROVIDER = "gia-tri-khong-hop-le";
    expect(activeCmsProvider()).toBe("decap");
  });

  it("đọc snapshot được cấu hình và trả null khi snapshot chưa tồn tại", () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "tungphat-payload-snapshot-"));
    const snapshot = path.join(directory, "snapshot.json");
    fs.writeFileSync(snapshot, JSON.stringify({ records: [{ collection: "articles", _status: "published", data: { slug: "kiem-thu" } }] }));
    process.env.PAYLOAD_CMS_SNAPSHOT = snapshot;
    expect(readPayloadSnapshot()).toHaveLength(1);
    process.env.PAYLOAD_CMS_SNAPSHOT = path.join(directory, "missing.json");
    expect(readPayloadSnapshot()).toBeNull();
    fs.rmSync(directory, { recursive: true, force: true });
  });

  it("map media, SEO, array và trạng thái về contract website hiện tại", () => {
    const result = normalizePayloadRecord({
      collection: "articles",
      _status: "published",
      data: {
        slug: "bai-viet-payload",
        availability: "available",
        featuredImage: { url: "/api/media/file/anh.webp", legacyPath: "/images/anh-cu.webp" },
        gallery: [{ image: { url: "/api/media/file/thu-vien.webp" } }],
        tags: [{ value: "MDF" }, { value: "CNC" }],
        legacyUpdatedAt: "2026-07-18",
        seo: {
          title: "SEO Payload",
          description: "Mô tả SEO Payload",
          canonical: "https://mdftungphat.com/bai-viet-payload",
          noindex: false,
          ogImage: { url: "/api/media/file/og.webp" }
        }
      }
    });

    expect(result).toMatchObject({
      featuredImage: "/images/anh-cu.webp",
      gallery: ["/api/media/file/thu-vien.webp"],
      tags: ["MDF", "CNC"],
      updatedAt: "2026-07-18",
      seoTitle: "SEO Payload",
      ogImage: "/api/media/file/og.webp",
      draft: false,
      status: "available"
    });
  });
});
