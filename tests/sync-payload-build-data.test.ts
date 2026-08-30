import { describe, expect, it } from "vitest";
import { fetchPayloadGlobal, normalizePayloadGlobal } from "../scripts/sync-payload-build-data";

describe("Payload build data normalization", () => {
  it("converts Payload relationship and array shapes to frontend settings", () => {
    expect(normalizePayloadGlobal("business-settings", {
      id: 1,
      globalType: "business-settings",
      updatedAt: "2026-08-17T00:00:00.000Z",
      serviceAreas: [{ id: "row-1", value: "TP. Hồ Chí Minh" }],
      socialLinks: [{ id: "row-2", value: "https://example.com" }],
      locations: [{
        id: "payload-row",
        locationId: "chi-nhanh-1",
        name: "Chi nhánh 1",
        image: { url: "/media/uploads/location.webp" },
      }],
    })).toEqual({
      serviceAreas: ["TP. Hồ Chí Minh"],
      socialLinks: ["https://example.com"],
      locations: [{
        id: "chi-nhanh-1",
        name: "Chi nhánh 1",
        image: "https://cdn.mdftungphat.com/uploads/location.webp",
      }],
    });
  });

  it("normalizes media and strips Payload row metadata recursively", () => {
    expect(normalizePayloadGlobal("brands", {
      id: 1,
      globalType: "brands",
      items: [{
        id: "row-1",
        slug: "an-cuong",
        logo: { id: 7, url: "/media/uploads/logo.webp", filename: "logo.webp" },
        catalogues: [{ id: "row-2", value: "/catalogue.pdf" }],
      }],
    })).toEqual({
      items: [{
        slug: "an-cuong",
        logo: "https://cdn.mdftungphat.com/uploads/logo.webp",
        catalogues: ["/catalogue.pdf"],
        products: [],
      }],
    });
  });

  it("preserves static page content dates and normalizes missing brand media", () => {
    expect(normalizePayloadGlobal("static-pages", {
      id: 1,
      updatedAt: "2026-08-17T00:00:00.000Z",
      globalType: "static-pages",
      contactIntro: "Liên hệ",
    })).toEqual({ updatedAt: "2026-08-17", contactIntro: "Liên hệ" });

    expect(normalizePayloadGlobal("brands", {
      items: [{ id: "row-1", slug: "kes", logo: null, catalogues: [] }],
    })).toEqual({ items: [{ slug: "kes", logo: "", catalogues: [], products: [] }] });
  });

  it("retains default social image dimensions and MIME metadata", () => {
    expect(normalizePayloadGlobal("seo-defaults", {
      defaultOgImage: {
        url: "/media/uploads/og.jpg",
        width: 1200,
        height: 630,
        mimeType: "image/jpeg",
      },
    })).toEqual({
      defaultOgImage: "https://cdn.mdftungphat.com/uploads/og.jpg",
      defaultOgImageWidth: 1200,
      defaultOgImageHeight: 630,
      defaultOgImageType: "image/jpeg",
    });
  });

  it("retries transient Payload failures before failing a build", async () => {
    let attempts = 0;
    const fetchImpl = async () => {
      attempts += 1;
      return attempts === 1
        ? new Response("temporary", { status: 500 })
        : Response.json({ globalType: "brands", items: [] });
    };

    await expect(fetchPayloadGlobal("brands", "https://cms.example", fetchImpl, 2, 0))
      .resolves.toEqual({ globalType: "brands", items: [] });
    expect(attempts).toBe(2);
  });
});
