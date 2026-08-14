import { afterEach, describe, expect, it, vi } from "vitest";
import { adminGbp, oauthCallback, publicReviews } from "../functions/_shared/gbp-handler";
import { encryptToken } from "../src/gbp/oauth";
import { exchangeAuthorizationCode, syncGbp } from "../src/gbp/sync";
import { createSqliteD1 } from "./helpers/sqlite-d1";

vi.mock("../src/gbp/sync", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../src/gbp/sync")>();
  return {
    ...actual,
    exchangeAuthorizationCode: vi.fn(),
    syncGbp: vi.fn(),
  };
});

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
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

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

  it("runs the initial sync after a successful OAuth connection", async () => {
    const env = {
      ...testEnv(),
      GBP_GOOGLE_CLIENT_ID: "client-id",
      GBP_GOOGLE_CLIENT_SECRET: "client-secret",
      GBP_GOOGLE_REDIRECT_URI: "https://cms.mdftungphat.com/api/gbp/oauth/callback",
      GBP_TOKEN_ENCRYPTION_KEY: "k".repeat(32),
    };
    const state = "oauth-state";
    const cookie = encodeURIComponent(await encryptToken(`${state}:bootstrap:${Date.now()}`, env.GBP_TOKEN_ENCRYPTION_KEY));
    vi.mocked(exchangeAuthorizationCode).mockResolvedValue({ access_token: "access-token", refresh_token: "refresh-token", expires_in: 3600 });
    vi.mocked(syncGbp).mockResolvedValue({ reviews: 2, metrics: 3, keywords: 4, syncedAt: 1 });
    vi.stubGlobal("fetch", vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      if (url.endsWith("/v1/accounts")) return Response.json({ accounts: [{ name: "accounts/123" }] });
      return Response.json({ locations: [{ name: "locations/456", title: "Tùng Phát", websiteUri: "https://mdftungphat.com" }] });
    }));

    const response = await oauthCallback(new Request(`https://cms.mdftungphat.com/api/gbp/oauth/callback?state=${state}&code=code`, {
      headers: { Cookie: `tp_gbp_oauth_state=${cookie}` },
    }), env as never);

    expect(response.status).toBe(302);
    expect(syncGbp).toHaveBeenCalledOnce();
    expect(syncGbp).toHaveBeenCalledWith(env);
  });

  it("keeps the OAuth connection when the initial sync temporarily fails", async () => {
    const env = {
      ...testEnv(),
      GBP_GOOGLE_CLIENT_ID: "client-id",
      GBP_GOOGLE_CLIENT_SECRET: "client-secret",
      GBP_GOOGLE_REDIRECT_URI: "https://cms.mdftungphat.com/api/gbp/oauth/callback",
      GBP_TOKEN_ENCRYPTION_KEY: "k".repeat(32),
    };
    const state = "oauth-state";
    const cookie = encodeURIComponent(await encryptToken(`${state}:bootstrap:${Date.now()}`, env.GBP_TOKEN_ENCRYPTION_KEY));
    vi.mocked(exchangeAuthorizationCode).mockResolvedValue({ access_token: "access-token", refresh_token: "refresh-token", expires_in: 3600 });
    vi.mocked(syncGbp).mockRejectedValue(new Error("temporary_google_failure"));
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.stubGlobal("fetch", vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      if (url.endsWith("/v1/accounts")) return Response.json({ accounts: [{ name: "accounts/123" }] });
      return Response.json({ locations: [{ name: "locations/456", title: "Tùng Phát", websiteUri: "https://mdftungphat.com" }] });
    }));

    const response = await oauthCallback(new Request(`https://cms.mdftungphat.com/api/gbp/oauth/callback?state=${state}&code=code`, {
      headers: { Cookie: `tp_gbp_oauth_state=${cookie}` },
    }), env as never);

    expect(response.status).toBe(302);
    expect(syncGbp).toHaveBeenCalledOnce();
  });
});
