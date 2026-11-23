import { describe, expect, it } from "vitest";
import { collectPreviewUploadPaths, currentActiveDeploymentVersion, routeToArtifactPath, validatePreviewBuildEnvironment } from "../scripts/workers-build-preview";

const validEnvironment = {
  STATIC_BUILD_TARGET: "preview",
  WORKERS_CI: "1",
  WORKERS_CI_BRANCH: "codex/editorial-cms",
  WORKERS_CI_BUILD_UUID: "8aa4ab24-74bd-4bb6-a082-443b1d4fb3d2",
  WORKERS_CI_COMMIT_SHA: "a".repeat(40),
  PAYLOAD_ARTICLES_URL: "https://tungphat-payload-cms-staging.nkhaduy.workers.dev",
  NEXT_PUBLIC_PREVIEW_MEDIA_BASE_URL: "https://tungphat-static-assets-preview.nkhaduy.workers.dev",
  NEXT_PUBLIC_GA_MEASUREMENT_ID: "",
};

describe("isolated Workers preview build", () => {
  it("requires the authorized branch, staging CMS and no production analytics ID", () => {
    expect(validatePreviewBuildEnvironment(validEnvironment)).toMatchObject({ branch: "codex/editorial-cms" });
    expect(() => validatePreviewBuildEnvironment({ ...validEnvironment, WORKERS_CI_BRANCH: "main" })).toThrow(/branch/i);
    expect(() => validatePreviewBuildEnvironment({ ...validEnvironment, PAYLOAD_ARTICLES_URL: "https://cms.mdftungphat.com" })).toThrow(/staging/i);
    expect(() => validatePreviewBuildEnvironment({ ...validEnvironment, NEXT_PUBLIC_GA_MEASUREMENT_ID: "G-ABCDEF1234" })).toThrow(/analytics/i);
  });

  it("allows only uploaded article media paths and rejects unsafe slugs", () => {
    expect(collectPreviewUploadPaths({
      featuredImage: { url: "https://tungphat-payload-cms-staging.nkhaduy.workers.dev/media/uploads/qa.webp" },
      editorContent: { root: { children: [{ type: "upload", value: { url: "/uploads/qa.webp" } }] } },
      draftLike: { url: "/catalog/public.webp" },
    })).toEqual(["/uploads/qa.webp"]);
    expect(routeToArtifactPath("/tmp/site", "qa-article")).toBe("/tmp/site/out/bai-viet/qa-article/index.html");
    expect(() => routeToArtifactPath("/tmp/site", "../private")).toThrow(/slug/i);
  });

  it("selects the newest active deployment for rollback", () => {
    expect(currentActiveDeploymentVersion(JSON.stringify([
      { id: "old-deployment", created_on: "2026-11-21T07:38:47Z", versions: [{ version_id: "old-version", percentage: 100 }] },
      { id: "current-deployment", created_on: "2026-11-21T08:33:27Z", versions: [{ version_id: "current-version", percentage: 100 }] },
    ]))).toBe("current-version");
  });
});
