import { describe, expect, it } from "vitest";
import { previewArtifactIsCurrent, previewBuildEnvironment, previewDeploymentArguments } from "@/scripts/workers-build-preview";

describe("Workers preview artifact freshness", () => {
  it("requires both the content snapshot and CMS publish request to match", () => {
    expect(previewArtifactIsCurrent({ artifactDigest: "same", latestDigest: "same", artifactRequestId: "request-a", latestRequestId: "request-a" })).toBe(true);
    expect(previewArtifactIsCurrent({ artifactDigest: "old", latestDigest: "new", artifactRequestId: "request-a", latestRequestId: "request-a" })).toBe(false);
    expect(previewArtifactIsCurrent({ artifactDigest: "same", latestDigest: "same", artifactRequestId: "request-a", latestRequestId: "request-b" })).toBe(false);
  });
});

describe("Workers preview build content cache key", () => {
  it("uses the current CMS publish request as the static build cache key", () => {
    const requestId = "8e6475d3-1748-42e9-b0ee-28252746c3b8";
    const environment = previewBuildEnvironment({ SITE_BUILD_CALLBACK_SECRET: "x".repeat(48) }, {
      branch: "codex/editorial-cms",
      buildId: "842447d2-8b5b-44c4-94f2-2a44a2bc50cd",
      commitSha: "a".repeat(40),
      cmsOrigin: "https://tungphat-payload-cms-staging.nkhaduy.workers.dev",
      previewOrigin: "https://tungphat-static-assets-preview.nkhaduy.workers.dev",
      callbackSecret: "x".repeat(48),
    }, { requestId } as { requestId: string; branch: string; articleSlug: string | null; triggerReason: string | null });

    expect(environment.PAYLOAD_PREVIEW_CACHE_KEY).toBe(requestId);
    expect(environment.NEXT_PUBLIC_SITE_ORIGIN).toBe("https://gotungphat.com");
  });
});

describe("Workers preview deployment command", () => {
  it("uses Wrangler-supported deploy arguments without interactive flags", () => {
    const args = previewDeploymentArguments("842447d2-8b5b-44c4-94f2-2a44a2bc50cd");
    expect(args).toEqual(["deploy", "--config", "wrangler.static-preview.jsonc", "--message", "CMS publish 842447d2-8b5b-44c4-94f2-2a44a2bc50cd"]);
    expect(args).not.toContain("--yes");
  });
});
