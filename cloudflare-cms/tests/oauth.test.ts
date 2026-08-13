import { afterEach, describe, expect, it, vi } from "vitest";
import { handleAuth, handleCallback, type OAuthEnv } from "../src/oauth/handlers";
import { FakeD1, asD1 } from "./helpers/fake-d1";

function env(database: FakeD1): OAuthEnv {
  return {
    DB: asD1(database),
    CMS_ADMIN_USERNAME: "admin",
    CMS_SESSION_SECRET: "session-secret-that-is-at-least-32-characters",
    CMS_ALLOWED_ORIGINS: "https://cms.mdftungphat.com",
    CMS_SITE_IDS: "cms.mdftungphat.com",
    OAUTH_CALLBACK_URL: "https://cms.mdftungphat.com/callback",
    OAUTH_ALLOWED_EMAIL: "nkhaduy@gmail.com",
    GITHUB_REPO_PRIVATE: "0",
    GITHUB_OAUTH_ID: "client-id",
    GITHUB_OAUTH_SECRET: "client-secret",
    OAUTH_STATE_SECRET: "oauth-state-secret-that-is-at-least-32-characters",
  };
}

afterEach(() => vi.restoreAllMocks());

describe("GitHub OAuth CMS session", () => {
  it("creates the current D1-backed CMS session after an allowed GitHub login", async () => {
    const database = new FakeD1();
    const oauthEnv = env(database);
    const start = await handleAuth(new Request("https://cms.mdftungphat.com/auth?site_id=cms.mdftungphat.com"), oauthEnv);
    const authorization = new URL(start.headers.get("Location") || "");
    const state = authorization.searchParams.get("state") || "";
    const stateCookie = (start.headers.get("Set-Cookie") || "").split(";", 1)[0];

    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(Response.json({ access_token: "github-token" }))
      .mockResolvedValueOnce(Response.json([{ email: "nkhaduy@gmail.com", verified: true, primary: true }]));

    const callback = await handleCallback(new Request(
      `https://cms.mdftungphat.com/callback?code=github-code&state=${encodeURIComponent(state)}`,
      { headers: { Cookie: stateCookie } },
    ), oauthEnv);

    expect(callback.status).toBe(200);
    expect(callback.headers.get("Set-Cookie")).toContain("tp_cms_session=");
    expect(callback.headers.get("Set-Cookie")).not.toContain("tp_cms_admin=");
    expect(database.sessions.size).toBe(1);
  });
});
