import { describe, expect, it } from "vitest";
import { assertStagingResources } from "../scripts/guard-environment";

describe("production guard", () => {
  it("accepts only isolated staging resource names", () => {
    expect(() => assertStagingResources({
      environment: "staging",
      worker: "tungphat-light-cms-api-staging",
      pages: "tungphat-light-cms-staging",
      d1: "tungphat-light-cms-staging",
      r2: "tungphat-light-media-staging",
    })).not.toThrow();
  });

  it("rejects production and shared resource names", () => {
    for (const d1 of ["tung-phat-leads", "tung-phat-quotes", "tungphat-payload-cms", "light-cms"]) {
      expect(() => assertStagingResources({
        environment: "staging", worker: "tungphat-light-cms-api-staging", pages: "tungphat-light-cms-staging",
        d1, r2: "tungphat-light-media-staging",
      })).toThrow(/staging|forbidden/i);
    }
  });
});
