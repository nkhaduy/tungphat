import { afterEach, describe, expect, it, vi } from "vitest";
import { handleAuth, handleCallback, handleHealth, type OAuthEnv } from "../src/oauth/handlers";
import { onRequest as analyticsMiddleware } from "../functions/analytics/_middleware";

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
  afterEach(() => vi.unstubAllGlobals());

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

  it("re-authenticates an existing CMS user for analytics and returns to the dashboard", async () => {
    const login = await handleAuth(new Request("https://cms.mdftungphat.com/analytics/login"), env);
    const location = new URL(login.headers.get("Location") || "");
    const state = location.searchParams.get("state") || "";
    const stateCookie = login.headers.get("Set-Cookie")?.split(";")[0] || "";
    expect(login.status).toBe(302);
    expect(state).not.toBe("");

    vi.stubGlobal("fetch", vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      if (url.includes("/login/oauth/access_token")) {
        return Response.json({ access_token: "test-access-token" });
      }
      if (url.includes("/user/emails")) {
        return Response.json([{ email: env.OAUTH_ALLOWED_EMAIL, primary: true, verified: true }]);
      }
      return new Response(null, { status: 404 });
    }));

    const callback = await handleCallback(new Request(
      `https://cms.mdftungphat.com/callback?code=test-code&state=${encodeURIComponent(state)}`,
      { headers: { Cookie: stateCookie } },
    ), env);
    expect(callback.status).toBe(302);
    expect(callback.headers.get("Location")).toBe("https://cms.mdftungphat.com/analytics/");
    expect(callback.headers.get("Set-Cookie")).toContain("tp_cms_admin=");
    expect(callback.headers.get("Set-Cookie")).toContain("HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=43200");
  });

  it("lets the dedicated analytics login route bypass the dashboard session guard", async () => {
    const next = vi.fn(async () => new Response("analytics-login-handler"));
    const response = await analyticsMiddleware({
      request: new Request("https://cms.mdftungphat.com/analytics/login"),
      next,
    } as never);
    expect(response.status).toBe(200);
    expect(await response.text()).toBe("analytics-login-handler");
    expect(next).toHaveBeenCalledOnce();
  });

  it("health is safe and no-store", async () => {
    const response = handleHealth(new Request("https://cms.mdftungphat.com/health"));
    expect(await response.json()).toEqual({ ok: true, service: "tungphat-cms" });
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });
});
