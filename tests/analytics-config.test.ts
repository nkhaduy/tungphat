import { describe, expect, it } from "vitest";
import { analyticsAllowedForBuild, shouldLoadGa4 } from "../lib/analytics/config";
import { shouldTrackLocation } from "../lib/analytics/sanitize";

describe("analytics build isolation", () => {
  it("disables GA and first-party events in static preview builds", () => {
    expect(analyticsAllowedForBuild("preview")).toBe(false);
    expect(shouldLoadGa4({ pathname: "/bai-viet/qa/", measurementId: "G-ABCDEF1234", buildTarget: "preview" })).toBe(false);
  });

  it("preserves production analytics behavior for valid production configuration", () => {
    expect(analyticsAllowedForBuild("production")).toBe(true);
    expect(shouldLoadGa4({ pathname: "/bai-viet/", measurementId: "G-ABCDEF1234", buildTarget: "production" })).toBe(true);
    expect(shouldLoadGa4({ pathname: "/cms-preview", measurementId: "G-ABCDEF1234", buildTarget: "production" })).toBe(false);
  });

  it("disables analytics in client bundles and on Workers preview hostnames", () => {
    const previous = process.env.NEXT_PUBLIC_STATIC_BUILD_TARGET;
    process.env.NEXT_PUBLIC_STATIC_BUILD_TARGET = "preview";
    try {
      expect(analyticsAllowedForBuild()).toBe(false);
      expect(shouldLoadGa4({ measurementId: "G-ABCDEF1234" })).toBe(false);
    } finally {
      if (previous === undefined) delete process.env.NEXT_PUBLIC_STATIC_BUILD_TARGET;
      else process.env.NEXT_PUBLIC_STATIC_BUILD_TARGET = previous;
    }
    expect(shouldTrackLocation("tungphat-static-assets-preview.nkhaduy.workers.dev", "/bai-viet/qa/")).toBe(false);
  });
});
