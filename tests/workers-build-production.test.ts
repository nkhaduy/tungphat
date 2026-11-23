import { describe, expect, it } from "vitest";
import {
  PRODUCTION_RELEASE_BRANCH,
  activeProductionVersionFromDeploymentList,
  productionBuildEnvironment,
  productionArtifactIsCurrent,
  productionDeploymentArguments,
  retryUntilProductionRouteRemoved,
  validateProductionBuildEnvironment,
} from "@/scripts/workers-build-production";

const validEnvironment = {
  STATIC_BUILD_TARGET: "production",
  WORKERS_CI: "1",
  WORKERS_CI_BRANCH: PRODUCTION_RELEASE_BRANCH,
  WORKERS_CI_BUILD_UUID: "842447d2-8b5b-44c4-94f2-2a44a2bc50cd",
  WORKERS_CI_COMMIT_SHA: "a".repeat(40),
  PAYLOAD_CMS_URL: "https://cms.mdftungphat.com",
  NEXT_PUBLIC_SITE_ORIGIN: "https://gotungphat.com",
  SEO_SITE_URL: "https://gotungphat.com",
  BLOG_CONTENT_PROVIDER: "payload",
  SITE_BUILD_CALLBACK_SECRET: "x".repeat(48),
};

describe("Workers production build isolation", () => {
  it("accepts only the dedicated release branch and production content origins", () => {
    expect(validateProductionBuildEnvironment(validEnvironment, "a".repeat(40))).toMatchObject({
      branch: PRODUCTION_RELEASE_BRANCH,
      cmsOrigin: "https://cms.mdftungphat.com",
      siteOrigin: "https://gotungphat.com",
    });
  });

  it("rejects preview branch, staging CMS, and mismatched release site inputs", () => {
    expect(() => validateProductionBuildEnvironment({ ...validEnvironment, WORKERS_CI_BRANCH: "codex/editorial-cms" }, "a".repeat(40))).toThrow(/release branch/u);
    expect(() => validateProductionBuildEnvironment({ ...validEnvironment, PAYLOAD_CMS_URL: "https://tungphat-payload-cms-staging.nkhaduy.workers.dev" }, "a".repeat(40))).toThrow(/production CMS/u);
    expect(() => validateProductionBuildEnvironment({ ...validEnvironment, NEXT_PUBLIC_SITE_ORIGIN: "https://mdftungphat.com" }, "a".repeat(40))).toThrow(/production site/u);
    expect(() => validateProductionBuildEnvironment({ ...validEnvironment, SEO_SITE_URL: "https://mdftungphat.com" }, "a".repeat(40))).toThrow(/production SEO site/u);
  });

  it("requires Workers Builds identity and rejects a mismatched checkout SHA", () => {
    expect(() => validateProductionBuildEnvironment({ ...validEnvironment, WORKERS_CI: undefined }, "a".repeat(40))).toThrow(/Workers Builds/u);
    expect(() => validateProductionBuildEnvironment(validEnvironment, "b".repeat(40))).toThrow(/does not match/u);
  });

  it("keeps the authenticated CMS callback secret out of the frontend build process", () => {
    const environment = productionBuildEnvironment({ SITE_BUILD_CALLBACK_SECRET: "x".repeat(48) }, {
      branch: PRODUCTION_RELEASE_BRANCH,
      buildId: "842447d2-8b5b-44c4-94f2-2a44a2bc50cd",
      commitSha: "a".repeat(40),
      cmsOrigin: "https://cms.mdftungphat.com",
      siteOrigin: "https://gotungphat.com",
      callbackSecret: "x".repeat(48),
    }, { branch: PRODUCTION_RELEASE_BRANCH, articleSlug: "qa-article", triggerReason: "publish", requestId: "8e6475d3-1748-42e9-b0ee-28252746c3b8" });
    expect(environment).not.toHaveProperty("SITE_BUILD_CALLBACK_SECRET");
    expect(environment.PAYLOAD_BUILD_CACHE_KEY).toBe("8e6475d3-1748-42e9-b0ee-28252746c3b8");
    expect(environment.STATIC_BUILD_TARGET).toBe("production");
  });

  it("deploys only through the production Worker configuration", () => {
    expect(productionDeploymentArguments("842447d2-8b5b-44c4-94f2-2a44a2bc50cd")).toEqual([
      "deploy",
      "--config",
      "wrangler.static-production.jsonc",
      "--message",
      "CMS publish 842447d2-8b5b-44c4-94f2-2a44a2bc50cd",
    ]);
  });

  it("selects the currently active 100 percent Worker version as rollback target", () => {
    expect(activeProductionVersionFromDeploymentList([
      { id: "older-deployment", versions: [{ version_id: "old-version", percentage: 100 }] },
      { id: "current-deployment", versions: [{ version_id: "current-version", percentage: 100 }] },
    ])).toBe("current-version");
  });

  it("requires the production artifact and publish request to converge", () => {
    expect(productionArtifactIsCurrent({ artifactDigest: "same", latestDigest: "same", artifactRequestId: "request-a", latestRequestId: "request-a" })).toBe(true);
    expect(productionArtifactIsCurrent({ artifactDigest: "old", latestDigest: "new", artifactRequestId: "request-a", latestRequestId: "request-a" })).toBe(false);
    expect(productionArtifactIsCurrent({ artifactDigest: "same", latestDigest: "same", artifactRequestId: "request-a", latestRequestId: "request-b" })).toBe(false);
  });

  it("waits for a production unpublish to reach the public edge", async () => {
    const statuses = [200, 404];
    const waits: number[] = [];
    const removed = await retryUntilProductionRouteRemoved(async (attempt) => statuses[attempt - 1], {
      attempts: 2,
      wait: async (delayMs) => { waits.push(delayMs); },
    });
    expect(removed).toBe(true);
    expect(waits).toEqual([1500]);
  });
});
