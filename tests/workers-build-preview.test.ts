import { describe, expect, it } from "vitest";
import { previewArtifactIsCurrent, previewArticleMediaPaths, previewBuildEnvironment, previewDeploymentArguments, resolvePreviewCommitSha, retryUntilPreviewRouteRemoved } from "@/scripts/workers-build-preview";

describe("Workers preview artifact freshness", () => {
  it("requires both the content snapshot and CMS publish request to match", () => {
    expect(previewArtifactIsCurrent({ artifactDigest: "same", latestDigest: "same", artifactRequestId: "request-a", latestRequestId: "request-a" })).toBe(true);
    expect(previewArtifactIsCurrent({ artifactDigest: "old", latestDigest: "new", artifactRequestId: "request-a", latestRequestId: "request-a" })).toBe(false);
    expect(previewArtifactIsCurrent({ artifactDigest: "same", latestDigest: "same", artifactRequestId: "request-a", latestRequestId: "request-b" })).toBe(false);
  });

  it("probes only staged uploads referenced by the article being published", () => {
    const articles = [
      {
        slug: "qa-editorial-cms-staging",
        title: "Staging QA",
        _status: "published" as const,
        featuredImage: { url: "/media/uploads/cover.webp" },
        editorContent: { root: { children: [{ type: "upload", value: { url: "/media/uploads/body-image.webp" } }] } },
      },
      { slug: "another-article", title: "Other", _status: "published" as const, featuredImage: { url: "/media/uploads/unrelated.webp" } },
    ];

    expect(previewArticleMediaPaths(articles, "qa-editorial-cms-staging")).toEqual([
      "/uploads/body-image.webp",
      "/uploads/cover.webp",
    ]);
    expect(previewArticleMediaPaths(articles, null)).toEqual([]);
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

describe("Workers preview unpublish propagation", () => {
  it("retries stale edge responses until the unpublished route is gone", async () => {
    const observedStatuses = [200, 200, 404];
    const probeAttempts: number[] = [];
    const waits: number[] = [];

    const removed = await retryUntilPreviewRouteRemoved(async (attempt) => {
      probeAttempts.push(attempt);
      return observedStatuses[attempt - 1];
    }, { attempts: 3, wait: async (delayMs) => { waits.push(delayMs); } });

    expect(removed).toBe(true);
    expect(probeAttempts).toEqual([1, 2, 3]);
    expect(waits).toEqual([1500, 3000]);
  });

  it("retries transient probe failures but stops after the configured bound", async () => {
    let probeCount = 0;
    let waitCount = 0;

    const removed = await retryUntilPreviewRouteRemoved(async () => {
      probeCount += 1;
      throw new Error("edge temporarily unavailable");
    }, { attempts: 2, wait: async () => { waitCount += 1; } });

    expect(removed).toBe(false);
    expect(probeCount).toBe(2);
    expect(waitCount).toBe(1);
  });
});

describe("Workers preview commit identity", () => {
  it("falls back to the checked-out commit when Workers Builds omits its commit SHA", () => {
    const checkedOutSha = "b".repeat(40);
    expect(resolvePreviewCommitSha(undefined, checkedOutSha)).toBe(checkedOutSha);
  });

  it("rejects a Workers Builds SHA that disagrees with the checked-out revision", () => {
    expect(() => resolvePreviewCommitSha("a".repeat(40), "b".repeat(40))).toThrow(/does not match/u);
  });
});
