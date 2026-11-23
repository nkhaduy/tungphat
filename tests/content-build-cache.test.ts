import { describe, expect, it } from "vitest";
import { payloadBuildFetchCache } from "@/lib/content";

describe("Payload build fetch caching", () => {
  it("always reads current content for an isolated preview build", () => {
    expect(payloadBuildFetchCache("preview")).toBe("no-store");
  });

  it("keeps production builds on the existing cached fetch policy", () => {
    expect(payloadBuildFetchCache("production")).toBe("force-cache");
  });
});
