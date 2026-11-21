import { describe, expect, it } from "vitest";
import { releaseOrigin, mapLegacySiteUrl } from "../lib/release-origin";

describe("release origin", () => {
  it("accepts only the approved origins", () => {
    expect(releaseOrigin(undefined)).toBe("https://mdftungphat.com");
    expect(releaseOrigin("https://gotungphat.com")).toBe("https://gotungphat.com");
    expect(() => releaseOrigin("https://evil.example")).toThrow();
  });
  it("moves only legacy website URLs and preserves path, query and fragment", () => {
    expect(mapLegacySiteUrl("https://www.mdftungphat.com/van-mdf/?q=1#x", "https://gotungphat.com")).toBe("https://gotungphat.com/van-mdf/?q=1#x");
    expect(mapLegacySiteUrl("https://cms.mdftungphat.com/media/a.webp", "https://gotungphat.com")).toBe("https://cms.mdftungphat.com/media/a.webp");
    expect(mapLegacySiteUrl("https://cdn.mdftungphat.com/a.webp", "https://gotungphat.com")).toBe("https://cdn.mdftungphat.com/a.webp");
  });
});

it("uses the new origin for metadata and converts old internal page URLs", async () => {
  const { vi } = await import("vitest");
  vi.stubEnv("NEXT_PUBLIC_SITE_ORIGIN", "https://gotungphat.com");
  vi.resetModules();
  try {
    const seo = await import("../lib/seo");
    expect(seo.SITE_URL).toBe("https://gotungphat.com");
    expect(seo.absolutePageUrl("https://mdftungphat.com/van-mdf/")).toBe("https://gotungphat.com/van-mdf/");
    expect(() => seo.absolutePageUrl("https://user:pass@mdftungphat.com/van-mdf/")).toThrow(/credentials/);
    expect(seo.createPageMetadata({ title: "MDF", description: "Ván", path: "/van-mdf/" }).alternates?.canonical).toBe("https://gotungphat.com/van-mdf/");
  } finally { vi.unstubAllEnvs(); vi.resetModules(); }
});

it("treats the new website as first-party and blocks preview analytics", async () => {
  const { attributionFromUrl } = await import("../lib/analytics/attribution");
  const { shouldTrackLocation } = await import("../lib/analytics/sanitize");
  expect(attributionFromUrl(new URL("https://gotungphat.com/"), "gotungphat.com").medium).toBe("none");
  expect(shouldTrackLocation("example.workers.dev", "/")).toBe(false);
});
