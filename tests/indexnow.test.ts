import { describe, expect, it } from "vitest";
import { extractSitemapUrls, shouldNotifyIndexNow } from "@/lib/indexnow";

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
});
