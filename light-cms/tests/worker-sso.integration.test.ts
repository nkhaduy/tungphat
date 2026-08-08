import { describe, expect, it } from "vitest";
import worker from "../src/worker/index";
import { createSqliteD1 } from "./helpers/sqlite-d1";
import {
  BAOGIA_TEST_AUDIENCE,
  BAOGIA_TEST_ISSUER,
  BAOGIA_TEST_KEY_ID,
  BAOGIA_TEST_PUBLIC_JWK,
  signBaogiaTestAssertion,
} from "./fixtures/baogia-sso-keys";

function testEnv() {
  const { db, sqlite } = createSqliteD1();
  return {
    env: {
      DB: db,
      MEDIA: { head: async () => null, get: async () => null, put: async () => ({ httpEtag: "etag" }), delete: async () => undefined } as unknown as R2Bucket,
      ENVIRONMENT: "test",
      APP_SECRET: "a".repeat(32),
      SESSION_SECRET: "s".repeat(32),
      BAOGIA_SSO_ISSUER: BAOGIA_TEST_ISSUER,
      BAOGIA_SSO_AUD: BAOGIA_TEST_AUDIENCE,
      BAOGIA_SSO_PUBLIC_JWK: JSON.stringify(BAOGIA_TEST_PUBLIC_JWK),
      BAOGIA_SSO_KEY_ID: BAOGIA_TEST_KEY_ID,
      ALLOWED_ORIGINS: "https://cms.mdftungphat.com",
      SERVICE_NAME: "tungphat-light-cms-api-production",
    },
    sqlite,
  };
}

async function call(env: ReturnType<typeof testEnv>["env"], path: string, init: RequestInit = {}) {
  return worker.fetch(new Request(`https://cms.mdftungphat.com${path}`, init), env as never);
}

function cookieValue(setCookie: string, name: string): string {
  const match = setCookie.match(new RegExp(`(?:^|, )${name}=([^;]+)`));
  if (!match) throw new Error(`Missing ${name} cookie`);
  return `${name}=${match[1]}`;
}

async function login(env: ReturnType<typeof testEnv>["env"]) {
  const start = await call(env, "/api/auth/sso/start");
  const location = new URL(start.headers.get("Location")!);
  const state = location.searchParams.get("state")!;
  const stateCookie = cookieValue(start.headers.get("Set-Cookie")!, "tp_light_sso_state");
  const now = Math.floor(Date.now() / 1000);
  const assertion = await signBaogiaTestAssertion({
    iat: now,
    nbf: now - 5,
    exp: now + 30,
    jti: `assertion_${crypto.randomUUID().replaceAll("-", "")}`,
  });
  const callback = await call(env, "/api/auth/sso/callback", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Cookie: stateCookie },
    body: new URLSearchParams({ assertion, state }),
  });
  return { start, callback, cookie: cookieValue(callback.headers.get("Set-Cookie")!, "tp_light_session") };
}

describe("Worker Baogia SSO integration", () => {
  it("keeps health and public snapshot unauthenticated", async () => {
    const { env } = testEnv();
    const health = await call(env, "/health");
    const snapshot = await call(env, "/api/public/snapshot");
    expect(health.status).toBe(200);
    expect(snapshot.status).toBe(200);
    expect(snapshot.headers.get("Cache-Control")).toMatch(/^public,/u);
  });

  it("starts Baogia SSO and completes it with a CMS session cookie", async () => {
    const { env } = testEnv();
    const { start, callback } = await login(env);
    expect(start.status).toBe(302);
    expect(start.headers.get("Location")).toMatch(/^https:\/\/baogia\.mdftungphat\.com\/api\/auth\/sso\/cms\?state=/u);
    expect(callback.status).toBe(302);
    expect(callback.headers.get("Location")).toBe("/");
    expect(callback.headers.get("Set-Cookie")).toContain("tp_light_session=");
  });

  it("returns 401 without a CMS cookie even when identity headers are forged", async () => {
    const { env } = testEnv();
    const response = await call(env, "/api/auth/session", { headers: {
      "Cf-Access-Jwt-Assertion": "forged",
      "Cf-Access-Authenticated-User-Email": "admin@example.com",
      "X-Auth-Request-Email": "admin@example.com",
      "X-Baogia-User": "admin",
    } });
    expect(response.status).toBe(401);
  });

  it("returns the D1 user and CSRF only for a valid CMS session", async () => {
    const { env } = testEnv();
    const { cookie } = await login(env);
    const response = await call(env, "/api/auth/session", { headers: { Cookie: cookie } });
    const payload = await response.json() as { data: { user: { role: string }; csrf: string; expiresAt: number } };
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(payload.data.user.role).toBe("super-admin");
    expect(payload.data.csrf).toMatch(/^[A-Za-z0-9_-]{32,128}$/u);
    expect(payload.data.expiresAt).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });

  it("requires exact Origin and CSRF for mutations", async () => {
    const { env } = testEnv();
    const { cookie } = await login(env);
    const session = await call(env, "/api/auth/session", { headers: { Cookie: cookie } });
    const csrf = ((await session.json()) as { data: { csrf: string } }).data.csrf;
    const rejected = await call(env, "/api/products", {
      method: "POST",
      headers: { Cookie: cookie, Origin: "https://evil.example", "X-CSRF-Token": csrf, "Content-Type": "application/json" },
      body: "{}",
    });
    const acceptedByAuth = await call(env, "/api/products", {
      method: "POST",
      headers: { Cookie: cookie, Origin: "https://cms.mdftungphat.com", "X-CSRF-Token": csrf, "Content-Type": "application/json" },
      body: "{}",
    });
    expect(rejected.status).toBe(403);
    expect(acceptedByAuth.status).toBe(422);
  });

  it("revokes only the CMS session on logout and writes an audit row", async () => {
    const { env, sqlite } = testEnv();
    const { cookie } = await login(env);
    const session = await call(env, "/api/auth/session", { headers: { Cookie: cookie } });
    const csrf = ((await session.json()) as { data: { csrf: string } }).data.csrf;
    const logout = await call(env, "/api/auth/logout", { method: "POST", headers: {
      Cookie: cookie,
      Origin: "https://cms.mdftungphat.com",
      "X-CSRF-Token": csrf,
    } });
    expect(logout.status).toBe(200);
    expect(logout.headers.get("Set-Cookie")).toContain("tp_light_session=;");
    expect(await call(env, "/api/auth/session", { headers: { Cookie: cookie } }).then((response) => response.status)).toBe(401);
    expect(sqlite.prepare("SELECT action FROM audit_logs WHERE action='auth.logout'").get()).toEqual({ action: "auth.logout" });
  });

  it("exposes users as a read-only Baogia identity list", async () => {
    const { env } = testEnv();
    const { cookie } = await login(env);
    const list = await call(env, "/api/users", { headers: { Cookie: cookie } });
    const text = await list.text();
    expect(list.status).toBe(200);
    expect(text).toContain("baogia_username");
    expect(text).not.toContain("@baogia.invalid");
    for (const [path, method] of [["/api/users", "POST"], ["/api/users/user-1", "PATCH"], ["/api/users/user-1", "DELETE"]] as const) {
      expect(await call(env, path, { method, headers: { Cookie: cookie } }).then((response) => response.status)).toBe(405);
    }
  });

  it("does not expose the old password login endpoint", async () => {
    const { env } = testEnv();
    expect(await call(env, "/api/auth/login", { method: "POST", body: "{}" }).then((response) => response.status)).toBe(404);
  });
});
