import { describe, expect, it } from "vitest";
import { extractSitemapUrls, normalizeIndexNowHtml, selectIndexNowDelta, shouldNotifyIndexNow, submitIndexNow } from "@/lib/indexnow";

describe("IndexNow safety helpers", () => {
  it("extracts canonical sitemap URLs and suppresses unchanged notifications", () => {
    const xml = "<urlset><url><loc>https://mdftungphat.com/</loc></url><url><loc>https://mdftungphat.com/van-mdf/</loc></url></urlset>";
    expect(extractSitemapUrls(xml)).toEqual([
      "https://mdftungphat.com/",
      "https://mdftungphat.com/van-mdf/",
    ]);
    expect(shouldNotifyIndexNow("same-hash", "same-hash")).toBe(false);
    expect(shouldNotifyIndexNow("old-hash", "new-hash")).toBe(true);
    expect(shouldNotifyIndexNow("same-hash", "same-hash", true)).toBe(true);
  });

  it("rejects foreign, non-canonical, and query-string sitemap URLs", () => {
    expect(() => extractSitemapUrls("<urlset><url><loc>https://evil.example/</loc></url></urlset>")).toThrow(/canonical/u);
    expect(() => extractSitemapUrls("<urlset><url><loc>https://mdftungphat.com/van-mdf</loc></url></urlset>")).toThrow(/trailing slash/u);
    expect(() => extractSitemapUrls("<urlset><url><loc>https://mdftungphat.com/van-mdf/?ref=test</loc></url></urlset>")).toThrow(/canonical/u);
  });

  it("deduplicates canonical URLs before submission", () => {
    const xml = "<urlset><url><loc>https://mdftungphat.com/</loc></url><url><loc>https://mdftungphat.com/</loc></url></urlset>";
    expect(extractSitemapUrls(xml)).toEqual(["https://mdftungphat.com/"]);
  });

  it("submits only changed, new, and deleted canonical URLs", () => {
    expect(selectIndexNowDelta({
      previous: { "https://mdftungphat.com/": "same", "https://mdftungphat.com/old/": "old" },
      current: { "https://mdftungphat.com/": "same", "https://mdftungphat.com/van-mdf/": "new" },
    })).toEqual({
      changed: ["https://mdftungphat.com/van-mdf/"],
      deleted: ["https://mdftungphat.com/old/"],
      urlList: ["https://mdftungphat.com/old/", "https://mdftungphat.com/van-mdf/"],
    });
  });

  it("ignores build-specific Next.js chunks while retaining indexable content changes", () => {
    const first = '<html><head><link rel="stylesheet" href="/_next/static/a.css"></head><body><h1>MDF</h1><script src="/_next/static/a.js"></script></body></html>';
    const rebuilt = '<html><head><link rel="stylesheet" href="/_next/static/b.css"></head><body><h1>MDF</h1><script src="/_next/static/b.js"></script></body></html>';
    const changed = '<html><head><link rel="stylesheet" href="/_next/static/b.css"></head><body><h1>MDF chống ẩm</h1><script src="/_next/static/b.js"></script></body></html>';
    expect(normalizeIndexNowHtml(first)).toBe(normalizeIndexNowHtml(rebuilt));
    expect(normalizeIndexNowHtml(first)).not.toBe(normalizeIndexNowHtml(changed));
  });

  it("retries transient IndexNow failures and accepts a later successful response", async () => {
    const statuses = [429, 503, 202];
    const fetcher = async () => new Response("", { status: statuses.shift() });

    const result = await submitIndexNow({
      endpoint: "https://api.indexnow.org/indexnow",
      payload: {
        host: "mdftungphat.com",
        key: "test-key-12345678",
        keyLocation: "https://mdftungphat.com/indexnow-key.txt",
        urlList: ["https://mdftungphat.com/"],
      },
      fetcher,
      sleep: async () => undefined,
    });

    expect(result).toEqual({ attempts: 3, status: 202 });
  });

  it("does not retry permanent IndexNow request errors", async () => {
    let attempts = 0;
    const fetcher = async () => {
      attempts += 1;
      return new Response("bad request", { status: 400 });
    };

    await expect(submitIndexNow({
      endpoint: "https://api.indexnow.org/indexnow",
      payload: {
        host: "mdftungphat.com",
        key: "test-key-12345678",
        keyLocation: "https://mdftungphat.com/indexnow-key.txt",
        urlList: ["https://mdftungphat.com/"],
      },
      fetcher,
      sleep: async () => undefined,
    })).rejects.toThrow(/400.*bad request/iu);
    expect(attempts).toBe(1);
  });
});
