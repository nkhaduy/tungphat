import { describe, expect, it } from "vitest";
import { analyticsAllowedForBuild, shouldLoadGa4 } from "../lib/analytics/config";

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
});
