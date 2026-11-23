import { describe, expect, it } from "vitest";
import { payloadBuildFetchCache, payloadCollectionRequestUrl } from "@/lib/content";

describe("Payload build fetch caching", () => {
  it("uses static-export-compatible cache for an isolated preview build", () => {
    expect(payloadBuildFetchCache()).toBe("force-cache");
  });

  it("keys preview CMS requests to the authenticated publish request", () => {
    const origin = "https://tungphat-payload-cms-staging.nkhaduy.workers.dev";
    const first = payloadCollectionRequestUrl("articles", origin, "preview", "8e6475d3-1748-42e9-b0ee-28252746c3b8");
    const next = payloadCollectionRequestUrl("articles", origin, "preview", "40b747b7-7bc5-463a-81cc-06c143f75855");

    expect(new URL(first).searchParams.get("previewBuildRequestId")).toBe("8e6475d3-1748-42e9-b0ee-28252746c3b8");
    expect(first).not.toBe(next);
    expect(() => payloadCollectionRequestUrl("articles", origin, "preview", "")).toThrow(/request id/i);
  });
});
