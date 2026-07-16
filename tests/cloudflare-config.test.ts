import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Cloudflare Pages media bindings", () => {
  const config = JSON.parse(readFileSync("wrangler.jsonc", "utf8"));

  it("uses one MEDIA binding per Pages environment", () => {
    expect(config.r2_buckets).toEqual([{ binding: "MEDIA", bucket_name: "tung-phat-media" }]);
    expect(config.env.preview.r2_buckets).toEqual([{ binding: "MEDIA", bucket_name: "tung-phat-media-preview" }]);
    expect(config.pages_build_output_dir).toBe("./out");
  });

  it("keeps DB and generated MEDIA types", () => {
    const types = readFileSync("functions/cloudflare-env.d.ts", "utf8");
    expect(types).toContain("MEDIA: R2Bucket;");
    expect(types).toContain("DB: D1Database;");
  });
});
