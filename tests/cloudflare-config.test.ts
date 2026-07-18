import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Cloudflare Pages bindings", () => {
  const config = JSON.parse(readFileSync("wrangler.jsonc", "utf8"));

  it("uses static Pages output and separate D1 databases", () => {
    expect(config.pages_build_output_dir).toBe("./out");
    expect(config.r2_buckets).toBeUndefined();
    expect(config.d1_databases[0].database_name).toBe("tung-phat-leads");
    expect(config.d1_databases[0].binding).toBe("DB");
    expect(config.env.preview.d1_databases[0].database_name).toBe("tung-phat-leads-preview");
    expect(config.env.preview.d1_databases[0].binding).toBe("DB");
    expect(config.env.preview.d1_databases[0].database_id).not.toBe(config.d1_databases[0].database_id);
  });

  it("documents the deploy preflight in the Git integration build command", () => {
    const deploymentGuide = readFileSync("docs/CLOUDFLARE_DEPLOYMENT.md", "utf8");
    expect(deploymentGuide).toContain("npm run validate:cloudflare-config && npm run build");
    expect(deploymentGuide).toContain("`TURNSTILE_SECRET_KEY`");
    expect(deploymentGuide).toContain("`IP_HASH_SALT`");
  });

  it("keeps generated DB and required secret types", () => {
    const generated = readFileSync("functions/cloudflare-env.d.ts", "utf8");
    expect(generated).toContain("DB: D1Database;");
    expect(generated).not.toContain("MEDIA: R2Bucket;");
    expect(generated).toContain("TURNSTILE_SECRET_KEY: string;");
    expect(generated).toContain("IP_HASH_SALT: string;");
  });
});
