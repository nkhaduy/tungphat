import { afterEach, describe, expect, it, vi } from "vitest";
import { constantTimeEqual } from "../src/auth/crypto";
import { handleGatewayStatus, handleLogin, handleLoginCsrf, handleLogout, handleSession } from "../src/auth/handlers";
import { ARGON2_MEMORY_KIB, ARGON2_PARALLELISM, ARGON2_TIME_COST, hashPassword, verifyPassword } from "../src/auth/password";
import { loginBlocked, MAX_LOGIN_FAILURES, recordLoginFailure } from "../src/auth/rate-limit";
import { createSession, SESSION_SECONDS, validMutation, verifySession } from "../src/auth/session";
import { handleAdminAnalytics } from "../src/analytics/admin-handler";
import { handleGitGateway, isAllowedRepositoryRoute, safeRepositoryPath } from "../src/github/gateway";
import { asD1, FakeD1 } from "./helpers/fake-d1";

const origin = "https://cms.mdftungphat.com";
const secret = "test-session-secret-that-is-definitely-at-least-32-characters";
const password = "unit-test-password-never-used-in-production";

async function environment(database = new FakeD1()) {
  return {
    DB: asD1(database),
    CMS_ALLOWED_ORIGINS: origin,
    CMS_ADMIN_USERNAME: "nkhaduy",
    CMS_ADMIN_PASSWORD_HASH: await hashPassword(password, new Uint8Array(16).fill(7)),
    CMS_SESSION_SECRET: secret,
    GITHUB_APP_ID: "",
    GITHUB_INSTALLATION_ID: "",
    GITHUB_APP_PRIVATE_KEY: "",
    GITHUB_FINE_GRAINED_TOKEN: "test-server-token",
  } as CloudflareCmsEnv;
}

function cookie(response: Response, name: string) {
  return response.headers.get("Set-Cookie")?.match(new RegExp(`${name}=[^;]+`))?.[0] || "";
}

async function login(env: CloudflareCmsEnv, username = "nkhaduy", suppliedPassword = password) {
  const csrfResponse = await handleLoginCsrf(new Request(`${origin}/api/auth/csrf`), env);
  const csrfBody = await csrfResponse.json() as { csrf: string };
  return handleLogin(new Request(`${origin}/api/auth/login`, {
    method: "POST",
    headers: {
      Origin: origin,
      Cookie: cookie(csrfResponse, "tp_cms_login_csrf"),
      "Content-Type": "application/json",
      "CF-Connecting-IP": "203.0.113.9",
    },
    body: JSON.stringify({ username, password: suppliedPassword, csrf: csrfBody.csrf }),
  }), env);
}

describe("password hashing", () => {
  it("uses versioned Argon2id with fixed memory, time, and parallelism costs", async () => {
    const encoded = await hashPassword(password, new Uint8Array(16).fill(3));
    expect(encoded).toMatch(new RegExp(
      `^v2\\$argon2id\\$v=19\\$m=${ARGON2_MEMORY_KIB},t=${ARGON2_TIME_COST},p=${ARGON2_PARALLELISM}\\$`,
    ));
    await expect(verifyPassword(password, encoded)).resolves.toBe(true);
    await expect(verifyPassword("wrong", encoded)).resolves.toBe(false);
    await expect(verifyPassword(password, encoded.replace("m=19456", "m=8192"))).resolves.toBe(false);
  });

  it("compares values without an early return on length", () => {
    expect(constantTimeEqual("same", "same")).toBe(true);
    expect(constantTimeEqual("same", "different")).toBe(false);
  });
});

describe("CMS session and login", () => {
  it("accepts the configured username/password and returns only a secure session cookie", async () => {
    const env = await environment();
    const response = await login(env);
    expect(response.status).toBe(200);
    expect(response.headers.get("Set-Cookie")).toContain("tp_cms_session=");
    expect(response.headers.get("Set-Cookie")).toContain("HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=43200");
    const body = await response.json() as Record<string, unknown>;
    expect(body).not.toHaveProperty("password");
    expect(JSON.stringify(body)).not.toContain("test-server-token");
  });

  it("uses the same generic error for a wrong username and a wrong password", async () => {
    const env = await environment();
    const wrongUser = await login(env, "someone-else", password);
    const wrongPassword = await login(env, "nkhaduy", "wrong-password");
    expect(await wrongUser.json()).toEqual(await wrongPassword.json());
    expect(wrongUser.status).toBe(401);
  });

  it("signs, verifies, expires, and rotates server-backed sessions", async () => {
    const database = new FakeD1();
    const env = await environment(database);
    const first = await createSession(env, "nkhaduy", 1_800_000_000);
    const firstRequest = new Request(`${origin}/api/auth/session`, { headers: { Cookie: cookie(new Response(null, { headers: { "Set-Cookie": first.cookie } }), "tp_cms_session") } });
    await expect(verifySession(firstRequest, env, 1_800_000_001)).resolves.toMatchObject({ username: "nkhaduy" });
    await expect(verifySession(firstRequest, env, 1_800_000_000 + SESSION_SECONDS)).resolves.toBeNull();
    const second = await createSession(env, "nkhaduy", 1_800_000_002);
    expect(second.cookie).not.toBe(first.cookie);
  });

  it("logs out by revoking D1 state and clearing current plus legacy cookies", async () => {
    const env = await environment();
    const loggedIn = await login(env);
    const sessionCookie = cookie(loggedIn, "tp_cms_session");
    const loginBody = await loggedIn.clone().json() as { csrf: string };
    const response = await handleLogout(new Request(`${origin}/api/auth/logout`, {
      method: "POST",
      headers: { Origin: origin, Cookie: sessionCookie, "X-CSRF-Token": loginBody.csrf },
    }), env);
    expect(response.status).toBe(200);
    expect(response.headers.get("Set-Cookie")).toContain("tp_cms_session=;");
    expect(response.headers.get("Set-Cookie")).toContain("tp_cms_admin=;");
    const sessionResponse = await handleSession(new Request(`${origin}/api/auth/session`, { headers: { Cookie: sessionCookie } }), env);
    expect(sessionResponse.status).toBe(401);
  });

  it("rejects a foreign origin and missing/incorrect CSRF", async () => {
    const env = await environment();
    const rejected = await handleLogin(new Request(`${origin}/api/auth/login`, {
      method: "POST", headers: { Origin: "https://attacker.example", "Content-Type": "application/json" }, body: "{}",
    }), env);
    expect(rejected.status).toBe(403);
    const session = await createSession(env, "nkhaduy");
    const request = new Request(`${origin}/api/admin/analytics/refresh`, { method: "POST", headers: { Origin: origin } });
    const verified = await verifySession(new Request(`${origin}/`, { headers: { Cookie: cookie(new Response(null, { headers: { "Set-Cookie": session.cookie } }), "tp_cms_session") } }), env);
    expect(verified).not.toBeNull();
    await expect(validMutation(request, env, verified!)).resolves.toBe(false);
  });
});

describe("rate limiting and lockout", () => {
  it("locks a hashed client key after repeated failures and stores no raw IP", async () => {
    const database = new FakeD1();
    const env = await environment(database);
    const key = "opaque-hmac-key";
    for (let count = 0; count < MAX_LOGIN_FAILURES; count += 1) await recordLoginFailure(env, key, 1_800_000_000 + count);
    await expect(loginBlocked(env, key, 1_800_000_010)).resolves.toBe(true);
    expect(JSON.stringify([...database.attempts.values()])).not.toContain("203.0.113");
  });
});

describe("fixed Git gateway", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("allowlists only the production branch and expected Git Database routes", () => {
    expect(isAllowedRepositoryRoute("GET", "branches/main")).toBe(true);
    expect(isAllowedRepositoryRoute("GET", "branches/develop")).toBe(false);
    expect(isAllowedRepositoryRoute("GET", "issues")).toBe(false);
    expect(isAllowedRepositoryRoute("GET", "git/trees/main:content/articles")).toBe(true);
    expect(isAllowedRepositoryRoute("GET", "git/trees/main:content/../../.github/workflows")).toBe(false);
    expect(isAllowedRepositoryRoute("GET", "git/trees/main:public/uploads/%2e%2e/content")).toBe(false);
    expect(safeRepositoryPath("content/articles/test.md")).toBe(true);
    expect(safeRepositoryPath("public/uploads/test.webp")).toBe(true);
    expect(safeRepositoryPath("content/../../.github/workflows/pwn.yml")).toBe(false);
    expect(safeRepositoryPath(".github/workflows/pwn.yml")).toBe(false);
  });

  it("requires the CMS session and never forwards browser authorization", async () => {
    const env = await environment();
    const unauthorized = await handleGitGateway(new Request(`${origin}/git-gateway/github/branches/main`), env);
    expect(unauthorized.status).toBe(401);

    const loggedIn = await login(env);
    const sessionCookie = cookie(loggedIn, "tp_cms_session");
    const requestHeaders: Headers[] = [];
    vi.stubGlobal("fetch", vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      requestHeaders.push(new Headers(init?.headers));
      return Response.json({ name: "main", commit: { sha: "a".repeat(40) } });
    }));
    const response = await handleGitGateway(new Request(`${origin}/git-gateway/github/branches/main`, {
      headers: { Cookie: sessionCookie, Authorization: "Bearer browser-csrf-not-github" },
    }), env);
    expect(response.status).toBe(200);
    expect(requestHeaders[0].get("Authorization")).toBe("Bearer test-server-token");
    expect(JSON.stringify(await response.json())).not.toContain("test-server-token");
  });

  it("blocks path traversal before any GitHub request", async () => {
    const env = await environment();
    const loggedIn = await login(env);
    const response = await handleGitGateway(new Request(`${origin}/git-gateway/github/git/trees/main:content/%2e%2e/.github` , {
      headers: { Cookie: cookie(loggedIn, "tp_cms_session") },
    }), env);
    expect(response.status).toBe(404);
  });

  it("binds every write object to the authenticated session and current Git head", async () => {
    const database = new FakeD1();
    const env = await environment(database);
    const loggedIn = await login(env);
    const sessionCookie = cookie(loggedIn, "tp_cms_session");
    const { csrf } = await loggedIn.clone().json() as { csrf: string };
    const headers = { Cookie: sessionCookie, Origin: origin, "X-CSRF-Token": csrf, "Content-Type": "application/json" };
    const currentCommit = "a".repeat(40);
    const currentTree = "b".repeat(40);
    const blobSha = "c".repeat(40);
    const treeSha = "d".repeat(40);
    const commitSha = "e".repeat(40);

    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/branches/main")) return Response.json({ commit: { sha: currentCommit, commit: { tree: { sha: currentTree } } } });
      if (url.endsWith("/git/blobs")) return Response.json({ sha: blobSha }, { status: 201 });
      if (url.endsWith("/git/trees")) return Response.json({ sha: treeSha }, { status: 201 });
      if (url.endsWith("/git/commits")) return Response.json({ sha: commitSha }, { status: 201 });
      if (url.endsWith("/git/refs/heads/main")) return Response.json({ object: { sha: commitSha } });
      return Response.json({}, { status: 404 });
    }));

    const send = (path: string, method: string, body: unknown) => handleGitGateway(new Request(`${origin}/git-gateway/github/${path}`, {
      method, headers, body: JSON.stringify(body),
    }), env);

    expect((await send("git/blobs", "POST", { content: "dGVzdA==", encoding: "base64" })).status).toBe(201);
    expect((await send("git/trees", "POST", {
      base_tree: "f".repeat(40),
      tree: [{ path: "content/articles/safe.md", mode: "100644", type: "blob", sha: blobSha }],
    })).status).toBe(409);
    expect((await send("git/trees", "POST", {
      base_tree: currentCommit,
      tree: [{ path: "content/articles/safe.md", mode: "100644", type: "blob", sha: blobSha }],
    })).status).toBe(201);
    expect((await send("git/commits", "POST", { message: "CMS safe test", tree: treeSha, parents: [currentCommit] })).status).toBe(201);
    expect((await send("git/refs/heads/main", "PATCH", { sha: commitSha, force: false })).status).toBe(200);
    expect(database.gitObjects.size).toBe(0);
  });

  it("rejects an arbitrary historical tree SHA before creating a commit", async () => {
    const env = await environment();
    const loggedIn = await login(env);
    const sessionCookie = cookie(loggedIn, "tp_cms_session");
    const { csrf } = await loggedIn.clone().json() as { csrf: string };
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({
      commit: { sha: "a".repeat(40), commit: { tree: { sha: "b".repeat(40) } } },
    })));
    const response = await handleGitGateway(new Request(`${origin}/git-gateway/github/git/commits`, {
      method: "POST",
      headers: { Cookie: sessionCookie, Origin: origin, "X-CSRF-Token": csrf, "Content-Type": "application/json" },
      body: JSON.stringify({ message: "bypass", tree: "f".repeat(40), parents: ["a".repeat(40)] }),
    }), env);
    expect(response.status).toBe(409);
  });
});

describe("shared analytics and gateway session", () => {
  it("authorizes Analytics and gateway status with the same tp_cms_session", async () => {
    const env = await environment();
    const loggedIn = await login(env);
    const sessionCookie = cookie(loggedIn, "tp_cms_session");
    const status = await handleGatewayStatus(new Request(`${origin}/api/gateway/status`, { headers: { Cookie: sessionCookie } }), env);
    expect(status.status).toBe(200);
    const analytics = await handleAdminAnalytics({
      request: new Request(`${origin}/api/admin/analytics/overview?from=bad`, { headers: { Cookie: sessionCookie } }), env,
    } as never);
    expect(analytics.status).toBe(400);
  });
});
