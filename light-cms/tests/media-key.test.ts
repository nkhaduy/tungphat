import { describe, expect, it } from "vitest";
import { mediaObjectKey } from "../src/worker/media/object-key";

describe("media object isolation", () => {
  it("uses an environment-specific prefix", () => {
    expect(mediaObjectKey("production", "media-1", "Ảnh hero.png")).toBe("production/media-1/-nh-hero.png");
    expect(mediaObjectKey("staging", "media-1", "hero.png")).toBe("staging/media-1/hero.png");
  });
});
