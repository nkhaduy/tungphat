import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("hybrid Cloudflare CMS bindings", () => {
  const config = JSON.parse(readFileSync("cloudflare-cms/wrangler.jsonc", "utf8"));

  it("uses a dedicated CMS Pages project and separate D1 databases", () => {
    expect(config.name).toBe("tungphat-cms");
    expect(config.pages_build_output_dir).toBe("./public");
    expect(config.d1_databases[0].database_name).toBe("tung-phat-leads");
    expect(config.d1_databases[0].binding).toBe("DB");
    expect(config.env.preview.d1_databases[0].database_name).toBe("tung-phat-leads-preview");
    expect(config.env.preview.d1_databases[0].database_id).not.toBe(config.d1_databases[0].database_id);
  });

  it("keeps production CORS exact and Decap direct publishing", () => {
    expect(config.vars.CORS_ALLOWED_ORIGINS).toBe("https://mdftungphat.com,https://www.mdftungphat.com");
    expect(config.vars.CORS_ALLOWED_ORIGINS).not.toContain("*");
    const cms = readFileSync("cloudflare-cms/public/config.yml", "utf8");
    expect(cms).toContain("publish_mode: simple");
    expect(cms).toContain("base_url: https://cms.mdftungphat.com");
    expect(cms).toContain("branch: main");
  });

  it("documents every required secret without committing values", () => {
    const readme = readFileSync("cloudflare-cms/README.md", "utf8");
    for (const secret of ["TURNSTILE_SECRET_KEY", "IP_HASH_SALT", "GITHUB_OAUTH_ID", "GITHUB_OAUTH_SECRET", "OAUTH_STATE_SECRET"]) {
      expect(readme).toContain(`\`${secret}\``);
    }
  });
});
