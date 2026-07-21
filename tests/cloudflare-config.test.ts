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

  it("binds private production and preview R2 buckets with the MEDIA name", () => {
    expect(config.r2_buckets).toEqual([{ binding: "MEDIA", bucket_name: "tung-phat-media" }]);
    expect(config.env.preview.r2_buckets).toEqual([{ binding: "MEDIA", bucket_name: "tung-phat-media-preview" }]);
  });

  it("keeps production CORS exact and Decap direct publishing through the server gateway", () => {
    expect(config.vars.CORS_ALLOWED_ORIGINS).toBe("https://mdftungphat.com,https://www.mdftungphat.com");
    expect(config.vars.CORS_ALLOWED_ORIGINS).not.toContain("*");
    const cms = readFileSync("cloudflare-cms/public/config.yml", "utf8");
    expect(cms).toContain("publish_mode: simple");
    expect(cms).toContain("name: git-gateway");
    expect(cms).toContain("gateway_url: /git-gateway/github");
    expect(cms).toContain("branch: main");
    expect(cms).not.toContain("auth_endpoint:");
  });

  it("keeps content and Analytics in one shell without an iframe or OAuth link", () => {
    const index = readFileSync("cloudflare-cms/public/index.html", "utf8");
    expect(index).toContain('data-view="content">Quản lý nội dung</button>');
    expect(index).toContain('data-view="analytics">Thống kê</button>');
    expect(index).toContain('id="nc-root"');
    expect(index).toContain('id="analytics-view"');
    expect(index).not.toContain("<iframe");
    expect(index).not.toContain("Login with GitHub");
  });

  it("documents every required secret without committing values", () => {
    const readme = readFileSync("cloudflare-cms/README.md", "utf8");
    for (const secret of ["TURNSTILE_SECRET_KEY", "IP_HASH_SALT", "CMS_ADMIN_USERNAME", "CMS_ADMIN_PASSWORD_HASH", "CMS_SESSION_SECRET", "GITHUB_APP_ID", "GITHUB_INSTALLATION_ID", "GITHUB_APP_PRIVATE_KEY"]) {
      expect(readme).toContain(`\`${secret}\``);
    }
  });
});
