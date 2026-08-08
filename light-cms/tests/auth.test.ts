import { describe, expect, it } from "vitest";
import { createSession, parseSessionCookie, requireMutation, revokeSession, verifySession } from "../src/worker/security/session";
import { createSqliteD1 } from "./helpers/sqlite-d1";

function fakeDb() {
  const rows = new Map<string, { user_id: string; csrf_hash: string; expires_at: number; revoked_at: number | null }>();
  const db = {
    prepare(sql: string) {
      let values: unknown[] = [];
      const statement = {
        bind(...next: unknown[]) { values = next; return statement; },
        async run() {
          if (sql.includes("INSERT INTO sessions")) rows.set(String(values[0]), { user_id: String(values[1]), csrf_hash: String(values[2]), expires_at: Number(values[4]), revoked_at: null });
          if (sql.includes("UPDATE sessions SET revoked_at")) {
            const row = rows.get(String(values[1]));
            if (row) row.revoked_at = Number(values[0]);
          }
          return { success: true, meta: { changes: 1 } };
        },
        async first<T>() {
          if (!sql.includes("FROM sessions")) return null;
          const row = rows.get(String(values[0]));
          return (row && row.revoked_at === null && row.expires_at > Number(values[1]) ? row : null) as T | null;
        },
      };
      return statement;
    },
  } as unknown as D1Database;
  return { db, rows };
}

describe("Light CMS authentication", () => {
  it("creates a revokeable HttpOnly session with CSRF token", async () => {
    const { db, rows } = fakeDb();
    const created = await createSession({ DB: db, SESSION_SECRET: "s".repeat(32), COOKIE_SECURE: true }, { id: "user-1", email: "admin@example.com", role: "admin" }, 1_700_000_000);
    expect(created.cookie).toContain("HttpOnly");
    expect(created.cookie).toContain("Secure");
    const request = new Request("https://staging.example/api/auth/session", { headers: { Cookie: created.cookie.split(";")[0] } });
    const session = await verifySession(request, { DB: db, SESSION_SECRET: "s".repeat(32) }, 1_700_000_001);
    expect(session?.userId).toBe("user-1");
    expect(parseSessionCookie(created.cookie)).toBeTruthy();
    await revokeSession(request, { DB: db, SESSION_SECRET: "s".repeat(32) }, 1_700_000_002);
    expect([...rows.values()][0]?.revoked_at).toBe(1_700_000_002);
    expect(await verifySession(request, { DB: db, SESSION_SECRET: "s".repeat(32) }, 1_700_000_003)).toBeNull();
  });

  it("requires exact Origin and CSRF for mutation", async () => {
    const { db } = fakeDb();
    const created = await createSession({ DB: db, SESSION_SECRET: "s".repeat(32), COOKIE_SECURE: true }, { id: "user-1", email: "admin@example.com", role: "admin" }, 1_700_000_000);
    const request = new Request("https://staging.example/api/content/1", { method: "PATCH", headers: { Origin: "https://evil.example", Cookie: created.cookie.split(";")[0], "X-CSRF-Token": created.csrf } });
    const session = await verifySession(new Request("https://staging.example/api/auth/session", { headers: { Cookie: created.cookie.split(";")[0] } }), { DB: db, SESSION_SECRET: "s".repeat(32) }, 1_700_000_001);
    expect(session).toBeTruthy();
    expect(await requireMutation(request, { allowedOrigins: ["https://staging.example"] }, session!)).toBe(false);
    const valid = new Request(request.url, { method: "PATCH", headers: { Origin: "https://staging.example", Cookie: created.cookie.split(";")[0], "X-CSRF-Token": created.csrf } });
    expect(await requireMutation(valid, { allowedOrigins: ["https://staging.example"] }, session!)).toBe(true);
  });

  it("rejects tampered, expired, revoked, and disabled-user sessions", async () => {
    const { db, sqlite } = createSqliteD1();
    sqlite.prepare(`INSERT INTO users(id,email,name,display_name,role,password_hash,active,status,created_at,updated_at)
      VALUES('user-1','admin@example.com','Admin','Admin','super-admin','!sso!',1,'active','2026-08-09T00:00:00.000Z','2026-08-09T00:00:00.000Z')`).run();
    const created = await createSession({ DB: db, SESSION_SECRET: "s".repeat(32), COOKIE_SECURE: true }, { id: "user-1", email: "admin@example.com", role: "super-admin" }, 1_700_000_000);
    const cookie = created.cookie.split(";")[0];
    const request = new Request("https://cms.mdftungphat.com/api/auth/session", { headers: { Cookie: cookie } });

    expect(await verifySession(new Request(request.url, { headers: { Cookie: cookie + "x" } }), { DB: db, SESSION_SECRET: "s".repeat(32) }, 1_700_000_001)).toBeNull();
    expect(await verifySession(request, { DB: db, SESSION_SECRET: "s".repeat(32) }, created.expiresAt)).toBeNull();
    sqlite.prepare("UPDATE sessions SET revoked_at=1700000001").run();
    expect(await verifySession(request, { DB: db, SESSION_SECRET: "s".repeat(32) }, 1_700_000_001)).toBeNull();
    sqlite.prepare("UPDATE sessions SET revoked_at=NULL").run();
    sqlite.prepare("UPDATE users SET active=0,status='disabled' WHERE id='user-1'").run();
    expect(await verifySession(request, { DB: db, SESSION_SECRET: "s".repeat(32) }, 1_700_000_001)).toBeNull();
  });

  it("rejects a valid Origin when the CSRF token does not match", async () => {
    const { db } = fakeDb();
    const created = await createSession({ DB: db, SESSION_SECRET: "s".repeat(32), COOKIE_SECURE: true }, { id: "user-1", email: "admin@example.com", role: "admin" }, 1_700_000_000);
    const session = await verifySession(new Request("https://staging.example/api/auth/session", { headers: { Cookie: created.cookie.split(";")[0] } }), { DB: db, SESSION_SECRET: "s".repeat(32) }, 1_700_000_001);
    const request = new Request("https://staging.example/api/content/1", { method: "PATCH", headers: { Origin: "https://staging.example", "X-CSRF-Token": "wrong" } });
    expect(await requireMutation(request, { allowedOrigins: ["https://staging.example"] }, session!)).toBe(false);
  });
});
