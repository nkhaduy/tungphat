import { describe, expect, it } from "vitest";
import { releaseOrigin, mapLegacySiteUrl } from "@/lib/release-origin";
import { vi } from "vitest";

describe("release origin mapping", () => {
  it("uses the approved gotungphat origin for preview builds and remaps legacy URLs", () => {
    expect(releaseOrigin("https://gotungphat.com")).toBe("https://gotungphat.com");
    expect(mapLegacySiteUrl("https://mdftungphat.com/bai-viet/test/?q=1#faq", "https://gotungphat.com"))
      .toBe("https://gotungphat.com/bai-viet/test/?q=1#faq");
    expect(mapLegacySiteUrl("https://cms.mdftungphat.com/api/articles", "https://gotungphat.com"))
      .toBe("https://cms.mdftungphat.com/api/articles");
    expect(() => releaseOrigin("https://unapproved.example")).toThrow(/origin/i);
  });
});

it("uses gotungphat for canonical metadata in an isolated site build", async () => {
  vi.stubEnv("NEXT_PUBLIC_SITE_ORIGIN", "https://gotungphat.com");
  vi.resetModules();
  try {
    const seo = await import("@/lib/seo");
    expect(seo.SITE_URL).toBe("https://gotungphat.com");
    expect(seo.absolutePageUrl("https://mdftungphat.com/bai-viet/qa/"))
      .toBe("https://gotungphat.com/bai-viet/qa/");
  } finally {
    vi.unstubAllEnvs();
    vi.resetModules();
  }
});
