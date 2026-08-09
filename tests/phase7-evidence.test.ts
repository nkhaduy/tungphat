import { describe, expect, it } from "vitest";
import {
  buildIndexationStatusMatrix,
  findFirstPartyPosition,
  parseGoogleResultUrls,
  resolveConfirmedIndexation,
  type Phase7AuthSnapshot,
} from "@/lib/phase7-evidence";

describe("Phase 7 indexation evidence", () => {
  it("keeps public absence separate from confirmed not indexed", () => {
    expect(resolveConfirmedIndexation("AUTH_BLOCKED", null)).toBe("AUTH_BLOCKED");

    const auth: Phase7AuthSnapshot = {
      google: { status: "AUTH_BLOCKED", urls: {} },
      bing: { status: "AUTH_BLOCKED", urls: {} },
    };
    const matrix = buildIndexationStatusMatrix({
      urls: ["https://mdftungphat.com/van-mdf/"],
      auth,
      observations: [
        {
          engine: "GOOGLE",
          url: "https://mdftungphat.com/van-mdf/",
          state: "NOT_OBSERVED",
          checkedAt: "2026-08-10T00:00:00.000Z",
        },
        {
          engine: "BING",
          url: "https://mdftungphat.com/van-mdf/",
          state: "NOT_OBSERVED",
          checkedAt: "2026-08-10T00:00:00.000Z",
        },
      ],
      sitemapUrl: "https://mdftungphat.com/sitemap.xml",
    });

    expect(matrix[0]).toMatchObject({
      googleConfirmedIndexation: "AUTH_BLOCKED",
      bingConfirmedIndexation: "AUTH_BLOCKED",
      googleObservedFallback: "NOT_OBSERVED",
      bingObservedFallback: "NOT_OBSERVED",
      confidence: "low",
    });
  });

  it("uses confirmed indexed only for authenticated positive evidence", () => {
    const url = "https://mdftungphat.com/";
    const auth: Phase7AuthSnapshot = {
      google: { status: "AVAILABLE", urls: { [url]: { indexed: true, lastCrawl: "2026-08-09T03:00:00Z" } } },
      bing: { status: "AVAILABLE", urls: { [url]: { indexed: false, lastCrawl: null } } },
    };
    const matrix = buildIndexationStatusMatrix({
      urls: [url],
      auth,
      observations: [],
      sitemapUrl: "https://mdftungphat.com/sitemap.xml",
    });

    expect(matrix[0]).toMatchObject({
      googleConfirmedIndexation: "CONFIRMED_INDEXED",
      bingConfirmedIndexation: "CONFIRMED_NOT_INDEXED",
      lastCrawl: { google: "2026-08-09T03:00:00Z", bing: null },
      confidence: "high",
    });
  });

  it("treats Google retry shells as unavailable and parses normal result links", () => {
    expect(parseGoogleResultUrls("<html>Enable JavaScript to continue</html>")).toBeNull();
    expect(parseGoogleResultUrls('<a href="/url?q=https://mdftungphat.com/tham-chieu-vat-lieu/&sa=U">Result</a>'))
      .toEqual(["https://mdftungphat.com/tham-chieu-vat-lieu/"]);
  });

  it("finds first-party search presence without treating it as index confirmation", () => {
    expect(findFirstPartyPosition([
      "https://example.com/guide",
      "https://mdftungphat.com/bai-viet/chuan-bi-file-cnc/",
    ], "mdftungphat.com")).toBe(2);
    expect(findFirstPartyPosition([], "mdftungphat.com")).toBeNull();
  });
});
