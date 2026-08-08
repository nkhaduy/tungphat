import { describe, expect, it } from "vitest";
import { fetchBaThanhResponse, isCacheFresh } from "@/scripts/ba-thanh/http";

describe("Ba Thanh HTTP redirects", () => {
  it("rejects a same-host redirect cycle instead of recursing forever", async () => {
    const fetchImpl = async (input: string | URL) => {
      const url = String(input);
      return new Response(null, {
        status: 302,
        headers: { location: url.endsWith("/a") ? "/b" : "/a" },
      });
    };

    await expect(fetchBaThanhResponse("https://bathanh.com.vn/a", { fetchImpl, maxRedirects: 4 }))
      .rejects.toThrow(/redirect/i);
  });
});

describe("Ba Thanh HTTP cache", () => {
  it("treats an expired cache entry as stale", () => {
    expect(isCacheFresh(1_000, 11_001, 10_000)).toBe(false);
  });
});
