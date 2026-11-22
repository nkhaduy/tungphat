import { expect, it } from "vitest";
import { resolveAuthenticatedUser } from "../src/worker/auth";
import { base64UrlEncode, hmac } from "../src/worker/crypto";

it("rejects a signed session once its natural expiry is reached", async () => {
  const secret = "s".repeat(32);
  const payload = { v: 1, sid: "test-session", csrf: "test-csrf", iat: 100, exp: 200 };
  const encoded = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const signature = await hmac(encoded, secret);
  let databaseCalled = false;
  const db = { prepare: () => { databaseCalled = true; throw new Error("Expired tokens must not query the database"); } } as unknown as D1Database;
  const request = new Request("https://example.invalid/api/quotes", { headers: { Cookie: `tp_quote_session=${encoded}.${signature}` } });
  expect(await resolveAuthenticatedUser(request, { DB: db, SESSION_SECRET: secret }, 200)).toBeNull();
  expect(databaseCalled).toBe(false);
});
