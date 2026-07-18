import { describe, expect, it } from "vitest";
import worker from "../workers/cms-oauth/src/index";

const env = {
  CMS_ORIGIN: "https://mdftungphat.com",
  CMS_SITE_ID: "mdftungphat.com",
  OAUTH_CALLBACK_URL: "https://cms-auth.mdftungphat.com/callback",
  GITHUB_REPO_PRIVATE: "0",
  GITHUB_OAUTH_ID: "test-client-id",
  GITHUB_OAUTH_SECRET: "test-client-secret",
  OAUTH_STATE_SECRET: "test-state-secret-with-at-least-32-characters"
} as Env;

describe("Decap GitHub OAuth Worker", () => {
  it("rejects an auth request for another CMS site", async () => {
    const response = await worker.fetch(
      new Request("https://cms-auth.mdftungphat.com/auth?site_id=attacker.example"),
      env
    );
    expect(response.status).toBe(403);
  });

  it("creates a signed state cookie only for the configured site", async () => {
    const response = await worker.fetch(
      new Request("https://cms-auth.mdftungphat.com/auth?site_id=mdftungphat.com"),
      env
    );
    expect(response.status).toBe(302);
    expect(response.headers.get("Set-Cookie")).toMatch(/HttpOnly; Secure; SameSite=Lax/);
    expect(response.headers.get("Location")).toContain("github.com/login/oauth/authorize");
    expect(response.headers.get("Location")).toContain("scope=public_repo");
  });

  it("does not exchange a callback with invalid state", async () => {
    const response = await worker.fetch(
      new Request("https://cms-auth.mdftungphat.com/callback?code=test&state=invalid"),
      env
    );
    expect(response.status).toBe(200);
    expect(await response.text()).toContain("invalid_oauth_state");
  });
});
