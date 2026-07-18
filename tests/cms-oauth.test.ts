import { describe, expect, it } from "vitest";
import { handleAuth, handleCallback, type OAuthEnv } from "../cloudflare-cms/src/oauth/handlers";

const env: OAuthEnv = {
  CMS_ALLOWED_ORIGINS: "https://cms.mdftungphat.com",
  CMS_SITE_IDS: "cms.mdftungphat.com",
  OAUTH_CALLBACK_URL: "https://cms.mdftungphat.com/callback",
  OAUTH_ALLOWED_EMAIL: "nkhaduy@gmail.com",
  GITHUB_REPO_PRIVATE: "0",
  GITHUB_OAUTH_ID: "test-client-id",
  GITHUB_OAUTH_SECRET: "test-client-secret",
  OAUTH_STATE_SECRET: "test-state-secret-with-at-least-32-characters"
};

describe("Decap GitHub OAuth Pages Functions", () => {
  it("rejects an auth request for another CMS site", async () => {
    const response = await handleAuth(new Request("https://cms.mdftungphat.com/auth?site_id=attacker.example"), env);
    expect(response.status).toBe(403);
  });

  it("creates a signed state cookie only for the configured site", async () => {
    const response = await handleAuth(new Request("https://cms.mdftungphat.com/auth?site_id=cms.mdftungphat.com"), env);
    expect(response.status).toBe(302);
    expect(response.headers.get("Set-Cookie")).toMatch(/HttpOnly; Secure; SameSite=Lax/);
    expect(response.headers.get("Location")).toContain("github.com/login/oauth/authorize");
    expect(response.headers.get("Location")).toContain("scope=public_repo%2Cuser%3Aemail");
  });

  it("does not exchange a callback with invalid state", async () => {
    const response = await handleCallback(new Request("https://cms.mdftungphat.com/callback?code=test&state=invalid"), env);
    expect(response.status).toBe(200);
    expect(await response.text()).toContain("invalid_oauth_state");
  });
});
