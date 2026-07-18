import { describe, expect, it } from "vitest";
import { handleAuth, handleCallback, handleHealth, type OAuthEnv } from "../src/oauth/handlers";

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

describe("Decap GitHub OAuth", () => {
  it("rejects another CMS origin or site id", async () => {
    await expect(handleAuth(new Request("https://attacker.example/auth?site_id=cms.mdftungphat.com"), env).then((response) => response.status)).resolves.toBe(403);
    await expect(handleAuth(new Request("https://cms.mdftungphat.com/auth?site_id=attacker.example"), env).then((response) => response.status)).resolves.toBe(403);
  });

  it("creates a short-lived signed state cookie and minimum GitHub scopes", async () => {
    const response = await handleAuth(new Request("https://cms.mdftungphat.com/auth?site_id=cms.mdftungphat.com"), env);
    expect(response.status).toBe(302);
    expect(response.headers.get("Set-Cookie")).toMatch(/HttpOnly; Secure; SameSite=Lax; Path=\/; Max-Age=600/);
    const location = response.headers.get("Location") || "";
    expect(location).toContain("github.com/login/oauth/authorize");
    expect(new URL(location).searchParams.get("scope")).toBe("public_repo,user:email");
  });

  it("does not exchange an invalid callback state", async () => {
    const response = await handleCallback(new Request("https://cms.mdftungphat.com/callback?code=test&state=invalid"), env);
    expect(response.status).toBe(200);
    expect(await response.text()).toContain("invalid_oauth_state");
  });

  it("health is safe and no-store", async () => {
    const response = handleHealth(new Request("https://cms.mdftungphat.com/health"));
    expect(await response.json()).toEqual({ ok: true, service: "tungphat-cms" });
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });
});
