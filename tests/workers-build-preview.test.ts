import { describe, expect, it } from "vitest";
import { previewArtifactIsCurrent } from "@/scripts/workers-build-preview";

describe("Workers preview artifact freshness", () => {
  it("requires both the content snapshot and CMS publish request to match", () => {
    expect(previewArtifactIsCurrent({ artifactDigest: "same", latestDigest: "same", artifactRequestId: "request-a", latestRequestId: "request-a" })).toBe(true);
    expect(previewArtifactIsCurrent({ artifactDigest: "old", latestDigest: "new", artifactRequestId: "request-a", latestRequestId: "request-a" })).toBe(false);
    expect(previewArtifactIsCurrent({ artifactDigest: "same", latestDigest: "same", artifactRequestId: "request-a", latestRequestId: "request-b" })).toBe(false);
  });
});
