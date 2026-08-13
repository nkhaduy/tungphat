import { describe, expect, it } from "vitest";
import { adminGbp, publicReviews } from "../functions/_shared/gbp-handler";
import { createSqliteD1 } from "./helpers/sqlite-d1";

function testEnv() {
  const { db } = createSqliteD1();
  return {
    DB: db,
    MEDIA: { head: async () => null, get: async () => null, put: async () => ({ httpEtag: "etag" }), delete: async () => undefined } as unknown as R2Bucket,
    ENVIRONMENT: "test",
    APP_SECRET: "a".repeat(32),
    SESSION_SECRET: "s".repeat(32),
    BAOGIA_SSO_ISSUER: "https://baogia.mdftungphat.com",
    BAOGIA_SSO_AUD: "tungphat-light-cms",
    BAOGIA_SSO_PUBLIC_JWK: "{}",
    BAOGIA_SSO_KEY_ID: "test-key",
    ALLOWED_ORIGINS: "https://cms.mdftungphat.com",
    SERVICE_NAME: "tungphat-light-cms-api-production",
    GBP_GOOGLE_PROJECT_ID: "stable-inn-503413-e2",
    CORS_ALLOWED_ORIGINS: "https://mdftungphat.com",
  };
}

describe("GBP routes", () => {
  it("serves an empty cached review response without requiring admin login", async () => {
    const response = await publicReviews(new Request("https://cms.mdftungphat.com/api/gbp/reviews"), testEnv() as never);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(expect.objectContaining({ status: "empty", reviews: [] }));
    expect(response.headers.get("Cache-Control")).toMatch(/^public,/u);
  });

  it("keeps admin GBP endpoints behind the CMS session", async () => {
    const response = await adminGbp(new Request("https://cms.mdftungphat.com/api/admin/gbp"), { ...testEnv(), LIGHT_CMS_API: { fetch: async () => Response.json({ ok: false }, { status: 401 }) } } as never);
    expect(response.status).toBe(401);
  });
});
