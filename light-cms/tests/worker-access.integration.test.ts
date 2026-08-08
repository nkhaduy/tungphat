import { afterEach, describe, expect, it, vi } from "vitest";
import worker from "../src/worker/index";
import { accessPublicJwk, signAccessToken } from "./fixtures/access-keys";
import { createSqliteD1 } from "./helpers/sqlite-d1";

const issuer = "https://tungphat-test.cloudflareaccess.com";
const audience = "light-cms-access-audience";
const currentTime = Math.floor(Date.now() / 1000);
let environmentNumber = 0;

afterEach(() => vi.unstubAllGlobals());

function accessToken(values: { subject?: string; email?: string } = {}) {
  return signAccessToken({
    iss: issuer,
    aud: [audience],
    sub: values.subject || "subject-admin",
    email: values.email || "admin@example.com",
    iat: currentTime - 10,
    nbf: currentTime - 10,
    exp: currentTime + 3600,
  });
}

function testEnv() {
  const { db, sqlite } = createSqliteD1();
  environmentNumber += 1;
  const env = {
    DB: db,
    MEDIA: { head: async () => null, get: async () => null, put: async () => ({ httpEtag: "etag" }), delete: async () => undefined } as unknown as R2Bucket,
    ENVIRONMENT: "test",
    APP_SECRET: "a".repeat(32),
    ACCESS_ISSUER: issuer,
    ACCESS_AUD: audience,
    ACCESS_JWKS_URL: `${issuer}/cdn-cgi/access/certs?test=${environmentNumber}`,
    ALLOWED_ORIGINS: "https://staging.example",
    SERVICE_NAME: "tungphat-light-cms-api-staging",
  };
  vi.stubGlobal("fetch", async () => new Response(JSON.stringify({ keys: [accessPublicJwk] }), { headers: { "Cache-Control": "max-age=600" } }));
  return { env, sqlite };
}

function seedUser(sqlite: ReturnType<typeof createSqliteD1>["sqlite"], values: { id?: string; subject?: string | null; email?: string; role?: string; status?: string } = {}) {
  const status = values.status || "active";
  sqlite.prepare(`INSERT INTO users(id,email,name,display_name,role,password_hash,active,status,access_subject,failed_attempts,created_at,updated_at)
    VALUES(?,?,?,?,?,'!access-only!',?,?,?,0,?,?)`).run(
    values.id || "user-admin",
    values.email || "admin@example.com",
    "Quản trị Tùng Phát",
    "Quản trị Tùng Phát",
    values.role || "admin",
    status === "active" ? 1 : 0,
    status,
    values.subject === undefined ? "subject-admin" : values.subject,
    new Date().toISOString(),
    new Date().toISOString(),
  );
}

async function call(env: ReturnType<typeof testEnv>["env"], path: string, init: RequestInit = {}, token?: string) {
  const headers = new Headers(init.headers);
  if (token) headers.set("Cf-Access-Jwt-Assertion", token);
  return worker.fetch(new Request(`https://staging.example${path}`, { ...init, headers }), env);
}

describe("Worker Access identity integration", () => {
  it("keeps health public and minimal", async () => {
    const { env } = testEnv();
    const response = await call(env, "/health");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(expect.objectContaining({ ok: true, service: "tungphat-light-cms-api-staging" }));
  });

  it("marks the public snapshot as cacheable and exposes a quoted integrity ETag", async () => {
    const { env, sqlite } = testEnv();
    seedUser(sqlite);
    sqlite.prepare(`INSERT INTO content_records(id,collection,slug,title,status,content_json,created_by,updated_by,created_at,updated_at)
      VALUES('public-product','products','public-product','Public product','published','{"slug":"public-product","title":"Public product"}','user-admin','user-admin','2026-08-04T00:00:00Z','2026-08-04T00:00:00Z')`).run();
    const response = await call(env, "/api/public/snapshot");
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toMatch(/^public,/u);
    expect(response.headers.get("ETag")).toMatch(/^"[a-f0-9]{64}"$/u);
  });

  it("rejects a missing JWT even when a browser forges identity headers", async () => {
    const { env } = testEnv();
    const response = await call(env, "/api/dashboard", { headers: { "Cf-Access-Authenticated-User-Email": "admin@example.com", "X-Auth-Request-Email": "admin@example.com" } });
    expect(response.status).toBe(401);
  });

  it("rejects a valid Access identity absent from D1 without revealing account existence", async () => {
    const { env } = testEnv();
    const response = await call(env, "/api/auth/session", {}, await accessToken());
    expect(response.status).toBe(403);
    expect(await response.text()).not.toContain("admin@example.com");
  });

  it("rejects a disabled user immediately", async () => {
    const { env, sqlite } = testEnv();
    seedUser(sqlite, { status: "disabled" });
    const response = await call(env, "/api/dashboard", {}, await accessToken());
    expect(response.status).toBe(403);
  });

  it("returns the D1 role, stateless CSRF, and JWKS cache metrics for a valid session", async () => {
    const { env, sqlite } = testEnv();
    seedUser(sqlite);
    const token = await accessToken();
    const response = await call(env, "/api/auth/session", {}, token);
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(response.headers.get("X-Access-JWKS-Cache")).toBe("miss");
    expect(response.headers.get("X-Access-JWKS-Fetches")).toBe("1");
    const payload = await response.json() as { data: { user: { role: string }; csrf: string; expiresAt: number } };
    expect(payload.data.user.role).toBe("admin");
    expect(payload.data.csrf.length).toBeGreaterThan(20);
    expect(payload.data.expiresAt).toBe(currentTime + 3600);
  });

  it("denies editor publishing and admin role escalation server-side", async () => {
    const editorState = testEnv();
    seedUser(editorState.sqlite, { role: "editor", subject: "subject-editor", email: "editor@example.com" });
    const editorToken = await accessToken({ subject: "subject-editor", email: "editor@example.com" });
    const publish = await call(editorState.env, "/api/products/content-1", { method: "PATCH", body: "{}" }, editorToken);
    expect(publish.status).toBe(403);

    const adminState = testEnv();
    seedUser(adminState.sqlite);
    seedUser(adminState.sqlite, { id: "user-editor", role: "editor", subject: null, email: "editor@example.com" });
    const escalate = await call(adminState.env, "/api/users/user-editor", { method: "PATCH", body: JSON.stringify({ role: "super-admin" }) }, await accessToken());
    expect(escalate.status).toBe(403);
  });

  it("does not expose password login in the Access router", async () => {
    const { env } = testEnv();
    const response = await call(env, "/api/auth/login", { method: "POST", body: JSON.stringify({ email: "admin@example.com", password: "secret" }) });
    expect(response.status).toBe(404);
  });

  it("does not allow a super-admin to edit identity email or subject", async () => {
    const { env, sqlite } = testEnv();
    seedUser(sqlite, { role: "super-admin" });
    seedUser(sqlite, { id: "user-editor", role: "editor", subject: null, email: "editor@example.com" });
    const token = await accessToken();
    const session = await call(env, "/api/auth/session", {}, token);
    const csrf = ((await session.json()) as { data: { csrf: string } }).data.csrf;
    const response = await call(env, "/api/users/user-editor", {
      method: "PATCH",
      headers: { Origin: "https://staging.example", "X-CSRF-Token": csrf, "Content-Type": "application/json" },
      body: JSON.stringify({ email: "attacker@example.com", accessSubject: "attacker-subject" }),
    }, token);
    expect(response.status).toBe(422);
    expect(sqlite.prepare("SELECT email,access_subject FROM users WHERE id='user-editor'").get()).toEqual({ email: "editor@example.com", access_subject: null });
  });

  it("does not delete content through a different collection route", async () => {
    const { env, sqlite } = testEnv();
    seedUser(sqlite, { role: "admin" });
    sqlite.prepare(`INSERT INTO content_records(id,collection,slug,title,status,content_json,created_by,updated_by,created_at,updated_at)
      VALUES(?,?,?,?,?,?,?,?,?,?)`).run("record-article", "articles", "huong-dan", "Hướng dẫn", "draft", '{}', "user-admin", "user-admin", "2026-08-04T00:00:00Z", "2026-08-04T00:00:00Z");
    const token = await accessToken();
    const session = await call(env, "/api/auth/session", {}, token);
    const csrf = ((await session.json()) as { data: { csrf: string } }).data.csrf;
    const response = await call(env, "/api/products/record-article", {
      method: "DELETE",
      headers: { Origin: "https://staging.example", "X-CSRF-Token": csrf, "Content-Type": "application/json" },
      body: JSON.stringify({ expectedVersion: 1 }),
    }, token);
    expect(response.status).toBe(409);
    expect(sqlite.prepare("SELECT deleted_at,version FROM content_records WHERE id='record-article'").get()).toEqual({ deleted_at: null, version: 1 });
  });

  it("returns the Cloudflare Access logout URL and audits logout", async () => {
    const { env, sqlite } = testEnv();
    seedUser(sqlite);
    const token = await accessToken();
    const session = await call(env, "/api/auth/session", {}, token);
    const csrf = ((await session.json()) as { data: { csrf: string } }).data.csrf;
    const response = await call(env, "/api/auth/logout", { method: "POST", headers: { Origin: "https://staging.example", "X-CSRF-Token": csrf } }, token);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(expect.objectContaining({ data: { loggedOut: true, logoutUrl: "/cdn-cgi/access/logout" } }));
    expect(sqlite.prepare("SELECT action FROM audit_logs WHERE action='auth.logout'").get()).toEqual({ action: "auth.logout" });
  });
});
