import { describe, expect, it } from "vitest";
import { classifyPublicObservation } from "@/lib/indexation-observation";

describe("public indexation observations", () => {
  it("records an exact public search result as observed, never confirmed indexed", () => {
    expect(classifyPublicObservation({
      engine: "BING",
      targetUrl: "https://mdftungphat.com/van-mdf/",
      responseStatus: 200,
      resultUrls: ["https://mdftungphat.com/van-mdf/"],
      checkedAt: "2026-08-09T00:00:00.000Z",
    })).toMatchObject({ state: "OBSERVED", confirmedIndexed: null, confidence: "medium" });
  });

  it("keeps a valid public search miss distinct from not indexed", () => {
    expect(classifyPublicObservation({
      engine: "BING",
      targetUrl: "https://mdftungphat.com/van-mdf/",
      responseStatus: 200,
      resultUrls: ["https://example.com/other"],
      checkedAt: "2026-08-09T00:00:00.000Z",
    })).toMatchObject({ state: "NOT_OBSERVED", confirmedIndexed: null, confidence: "low" });
  });

  it("uses unknown for blocked or ambiguous public results", () => {
    expect(classifyPublicObservation({
      engine: "GOOGLE",
      targetUrl: "https://mdftungphat.com/",
      responseStatus: 200,
      resultUrls: null,
      checkedAt: "2026-08-09T00:00:00.000Z",
      caveat: "Google returned a JavaScript retry shell.",
    })).toMatchObject({ state: "UNKNOWN", confirmedIndexed: null, confidence: "none" });
  });
});
