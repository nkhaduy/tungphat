import { describe, expect, it } from "vitest";
import { completeBaogiaSso, startBaogiaSso } from "../src/worker/security/baogia-sso";
import { verifySession } from "../src/worker/security/session";
import { createSqliteD1 } from "./helpers/sqlite-d1";
import {
  BAOGIA_TEST_AUDIENCE,
  BAOGIA_TEST_ISSUER,
  BAOGIA_TEST_KEY_ID,
  BAOGIA_TEST_PUBLIC_JWK,
  signBaogiaTestAssertion,
} from "./fixtures/baogia-sso-keys";

const now = 1_786_213_600;
const secret = "s".repeat(32);

function env(db: D1Database) {
  return {
    DB: db,
    SESSION_SECRET: secret,
    BAOGIA_SSO_ISSUER: BAOGIA_TEST_ISSUER,
    BAOGIA_SSO_AUD: BAOGIA_TEST_AUDIENCE,
    BAOGIA_SSO_PUBLIC_JWK: JSON.stringify(BAOGIA_TEST_PUBLIC_JWK),
    BAOGIA_SSO_KEY_ID: BAOGIA_TEST_KEY_ID,
    COOKIE_SECURE: true,
  };
}

function cookieValue(setCookie: string, name: string): string {
  const match = setCookie.match(new RegExp(`(?:^|, )${name}=([^;]+)`));
  if (!match) throw new Error(`Missing ${name} cookie`);
  return `${name}=${match[1]}`;
}

function callbackRequest(assertion: string, state: string, stateCookie: string) {
  return new Request("https://cms.mdftungphat.com/api/auth/sso/callback", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Cookie: stateCookie },
    body: new URLSearchParams({ assertion, state }),
  });
}

describe("Baogia SSO completion", () => {
  it("starts SSO with a host-only ten-minute state cookie", () => {
    const response = startBaogiaSso(new Request("https://cms.mdftungphat.com/api/auth/sso/start"), { COOKIE_SECURE: true });
    const location = new URL(response.headers.get("Location")!);
    const state = location.searchParams.get("state")!;
    const cookie = response.headers.get("Set-Cookie")!;

    expect(response.status).toBe(302);
    expect(location.origin + location.pathname).toBe("https://baogia.mdftungphat.com/api/auth/sso/cms");
    expect(state).toMatch(/^[A-Za-z0-9_-]{32,128}$/u);
    expect(cookie).toContain(`tp_light_sso_state=${state}`);
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("Secure");
    expect(cookie).toContain("SameSite=Lax");
    expect(cookie).toContain("Max-Age=600");
    expect(cookie).not.toContain("Domain=");
  });

  it("consumes one assertion, creates a shadow user, and issues a 30-minute CMS session", async () => {
    const { db, sqlite } = createSqliteD1();
    const start = startBaogiaSso(new Request("https://cms.mdftungphat.com/api/auth/sso/start"), { COOKIE_SECURE: true });
    const state = new URL(start.headers.get("Location")!).searchParams.get("state")!;
    const stateCookie = cookieValue(start.headers.get("Set-Cookie")!, "tp_light_sso_state");
    const response = await completeBaogiaSso(callbackRequest(await signBaogiaTestAssertion(), state, stateCookie), env(db), now);
    const setCookie = response.headers.get("Set-Cookie")!;

    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("/");
    expect(setCookie).toContain("tp_light_session=");
    expect(setCookie).toContain("Max-Age=1800");
    expect(setCookie).toContain("tp_light_sso_state=; ");
    expect(sqlite.prepare("SELECT baogia_subject,baogia_username,display_name,role,status FROM users WHERE baogia_subject=?").get("baogia-admin-1")).toEqual({
      baogia_subject: "baogia-admin-1",
      baogia_username: "admin",
      display_name: "Quản trị Tùng Phát",
      role: "super-admin",
      status: "active",
    });
    expect(sqlite.prepare("SELECT COUNT(*) AS count FROM sso_assertion_uses").get()).toEqual({ count: 1 });
    expect(sqlite.prepare("SELECT action FROM audit_logs WHERE action='auth.login'").get()).toEqual({ action: "auth.login" });

    const sessionCookie = cookieValue(setCookie, "tp_light_session");
    const session = await verifySession(
      new Request("https://cms.mdftungphat.com/api/auth/session", { headers: { Cookie: sessionCookie } }),
      { DB: db, SESSION_SECRET: secret },
      now + 1,
    );
    expect(session).toMatchObject({ role: "super-admin", name: "Quản trị Tùng Phát" });
  });

  it("rejects assertion replay without creating another session", async () => {
    const { db, sqlite } = createSqliteD1();
    const assertion = await signBaogiaTestAssertion();

    for (let attempt = 0; attempt < 2; attempt += 1) {
      const start = startBaogiaSso(new Request("https://cms.mdftungphat.com/api/auth/sso/start"), { COOKIE_SECURE: true });
      const state = new URL(start.headers.get("Location")!).searchParams.get("state")!;
      const request = callbackRequest(assertion, state, cookieValue(start.headers.get("Set-Cookie")!, "tp_light_sso_state"));
      if (attempt === 0) await completeBaogiaSso(request, env(db), now);
      else await expect(completeBaogiaSso(request, env(db), now)).rejects.toMatchObject({ code: "assertion_replayed" });
    }

    expect(sqlite.prepare("SELECT COUNT(*) AS count FROM sessions").get()).toEqual({ count: 1 });
  });

  it("rejects state mismatch and non-form callback bodies", async () => {
    const { db } = createSqliteD1();
    const assertion = await signBaogiaTestAssertion();
    await expect(completeBaogiaSso(callbackRequest(assertion, "a".repeat(32), "tp_light_sso_state=" + "b".repeat(32)), env(db), now))
      .rejects.toMatchObject({ code: "invalid_state" });
    await expect(completeBaogiaSso(new Request("https://cms.mdftungphat.com/api/auth/sso/callback", { method: "POST", body: "x" }), env(db), now))
      .rejects.toMatchObject({ status: 415 });
  });
});
