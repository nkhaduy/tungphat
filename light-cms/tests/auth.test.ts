import { describe, expect, it } from "vitest";
import { createSession, parseSessionCookie, requireMutation, revokeSession, verifySession } from "../src/worker/security/legacy/session";
import { hashPassword, verifyPassword } from "../src/worker/security/legacy/password";

function fakeDb() {
  const rows = new Map<string, { user_id: string; csrf_hash: string; expires_at: number; revoked_at: number | null }>();
  const db = {
    prepare(sql: string) {
      let values: unknown[] = [];
      const statement = {
        bind(...next: unknown[]) { values = next; return statement; },
        async run() {
          if (sql.includes("INSERT INTO sessions")) rows.set(String(values[0]), { user_id: String(values[1]), csrf_hash: String(values[2]), expires_at: Number(values[4]), revoked_at: null });
          if (sql.includes("DELETE FROM sessions")) rows.delete(String(values[0]));
          return { success: true, meta: { changes: 1 } };
        },
        async first<T>() {
          if (!sql.includes("FROM sessions")) return null;
          const row = rows.get(String(values[0]));
          return (row && row.expires_at > Number(values[1]) ? row : null) as T | null;
        },
      };
      return statement;
    },
  } as unknown as D1Database;
  return { db, rows };
}

describe("Light CMS authentication", () => {
  it("round-trips a PBKDF2 password and rejects a wrong password", async () => {
    const encoded = await hashPassword("strong-password-123", 25_000, new Uint8Array(16).fill(7));
    expect(await verifyPassword("strong-password-123", encoded)).toBe(true);
    expect(await verifyPassword("wrong-password", encoded)).toBe(false);
  });

  it("creates a revokeable HttpOnly session with CSRF token", async () => {
    const { db, rows } = fakeDb();
    const created = await createSession({ DB: db, SESSION_SECRET: "s".repeat(32), COOKIE_SECURE: true }, { id: "user-1", email: "admin@example.com", role: "admin" }, 1_700_000_000);
    expect(created.cookie).toContain("HttpOnly");
    expect(created.cookie).toContain("Secure");
    const request = new Request("https://staging.example/api/auth/session", { headers: { Cookie: created.cookie.split(";")[0] } });
    const session = await verifySession(request, { DB: db, SESSION_SECRET: "s".repeat(32) }, 1_700_000_001);
    expect(session?.userId).toBe("user-1");
    expect(parseSessionCookie(created.cookie)).toBeTruthy();
    await revokeSession(request, { DB: db, SESSION_SECRET: "s".repeat(32) });
    expect(rows.size).toBe(0);
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
});
