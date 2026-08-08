import { describe, expect, it } from "vitest";
import type { SessionUser } from "../src/shared/types";
import { app } from "../src/worker/index";
import { base64UrlDecode, base64UrlEncode, hmac } from "../src/worker/crypto";
import {
  CMS_SSO_AUDIENCE,
  CMS_SSO_CALLBACK,
  CMS_SSO_ISSUER,
  CMS_SSO_KEY_ID,
  cmsSsoForm,
  signCmsAssertion,
  type CmsSsoClaims,
} from "../src/worker/sso";

const now = 1_786_213_600;
const admin: SessionUser = {
  id: "user-admin",
  username: "admin",
  fullName: "Quản trị Tùng Phát",
  phone: "0909259160",
  role: "ADMIN",
  branchId: "branch-tp81",
  branchCode: "TP81",
  branchName: "Chi nhánh Tam Bình",
  mustChangePassword: false,
};

function decodeJson<T>(value: string): T {
  return JSON.parse(new TextDecoder().decode(base64UrlDecode(value))) as T;
}

function arrayBuffer(value: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(value.byteLength);
  copy.set(value);
  return copy.buffer;
}

async function keyPair() {
  const pair = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
  return {
    privateJwk: await crypto.subtle.exportKey("jwk", pair.privateKey),
    publicKey: pair.publicKey,
  };
}

async function quoteSessionCookie(values: { role?: SessionUser["role"]; mustChangePassword?: boolean } = {}) {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const payload = { v: 1, sid: "session-id", csrf: "csrf-token", iat: nowSeconds - 10, exp: nowSeconds + 3600 };
  const encoded = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  return {
    cookie: `tp_quote_session=${encoded}.${await hmac(encoded, "s".repeat(32))}`,
    row: {
      id: "user-admin",
      username: "admin",
      full_name: "Quản trị Tùng Phát",
      phone: "0909259160",
      role: values.role ?? "ADMIN",
      branch_id: "branch-tp81",
      is_active: 1,
      must_change_password: values.mustChangePassword ? 1 : 0,
      branch_code: "TP81",
      branch_name: "Chi nhánh Tam Bình",
      csrf_hash: await crypto.subtle.digest("SHA-256", new TextEncoder().encode("csrf-token")).then((bytes) => Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, "0")).join("")),
      expires_at: new Date((nowSeconds + 3600) * 1000).toISOString(),
    },
  };
}

async function routeEnv(row: Record<string, unknown> | null = null) {
  const { privateJwk } = await keyPair();
  return {
    DB: {
      prepare() {
        return {
          bind() {
            return { first: () => Promise.resolve(row) };
          },
        };
      },
    },
    ASSETS: { fetch: () => Promise.resolve(new Response("asset")) },
    PDF_BUCKET: {},
    ENVIRONMENT: "test",
    APP_ORIGIN: "https://baogia.mdftungphat.com",
    TIMEZONE: "Asia/Ho_Chi_Minh",
    SESSION_SECRET: "s".repeat(32),
    CMS_SSO_PRIVATE_JWK: JSON.stringify(privateJwk),
  };
}

describe("Baogia Light CMS SSO assertion", () => {
  it("signs a 30-second ES256 assertion for an active admin", async () => {
    const { privateJwk, publicKey } = await keyPair();

    const assertion = await signCmsAssertion(admin, { CMS_SSO_PRIVATE_JWK: JSON.stringify(privateJwk) }, now);
    const parts = assertion.split(".");

    expect(parts).toHaveLength(3);
    expect(decodeJson(parts[0])).toEqual({ alg: "ES256", kid: CMS_SSO_KEY_ID, typ: "JWT" });
    expect(decodeJson<CmsSsoClaims>(parts[1])).toEqual(expect.objectContaining({
      v: 1,
      iss: CMS_SSO_ISSUER,
      aud: CMS_SSO_AUDIENCE,
      sub: admin.id,
      username: admin.username,
      name: admin.fullName,
      role: "ADMIN",
      iat: now,
      nbf: now - 5,
      exp: now + 30,
    }));
    expect(decodeJson<CmsSsoClaims>(parts[1]).jti).toMatch(/^[A-Za-z0-9_-]{32,128}$/u);
    expect(base64UrlDecode(parts[2])).toHaveLength(64);
    await expect(crypto.subtle.verify(
      { name: "ECDSA", hash: "SHA-256" },
      publicKey,
      arrayBuffer(base64UrlDecode(parts[2])),
      new TextEncoder().encode(`${parts[0]}.${parts[1]}`),
    )).resolves.toBe(true);
  });

  it("refuses to mint a CMS assertion for an employee", async () => {
    const { privateJwk } = await keyPair();
    await expect(signCmsAssertion({ ...admin, role: "EMPLOYEE" }, { CMS_SSO_PRIVATE_JWK: JSON.stringify(privateJwk) }, now))
      .rejects.toMatchObject({ status: 403 });
  });

  it("fails closed when the signing key is missing or malformed", async () => {
    await expect(signCmsAssertion(admin, { CMS_SSO_PRIVATE_JWK: "" }, now)).rejects.toMatchObject({ status: 503 });
    await expect(signCmsAssertion(admin, { CMS_SSO_PRIVATE_JWK: "not-json" }, now)).rejects.toMatchObject({ status: 503 });
  });

  it("returns a no-store form post to the fixed CMS callback", async () => {
    const response = cmsSsoForm("header.payload.signature", "state_abcdefghijklmnopqrstuvwxyz123456", CMS_SSO_CALLBACK);
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store, private");
    expect(response.headers.get("Referrer-Policy")).toBe("no-referrer");
    expect(response.headers.get("Content-Security-Policy")).toContain(`form-action ${CMS_SSO_CALLBACK}`);
    expect(html).toContain(`action="${CMS_SSO_CALLBACK}"`);
    expect(html).toContain('name="assertion" value="header.payload.signature"');
    expect(html).toContain('name="state" value="state_abcdefghijklmnopqrstuvwxyz123456"');
  });

  it("redirects an unauthenticated SSO request to the Baogia login page", async () => {
    const state = "abcdefghijklmnopqrstuvwxyzABCDEF123456";
    const response = await app.request(
      new Request(`https://baogia.mdftungphat.com/api/auth/sso/cms?state=${state}`),
      undefined,
      await routeEnv(),
    );

    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe(`/login?returnTo=${encodeURIComponent(`/api/auth/sso/cms?state=${state}`)}`);
    expect(response.headers.get("Cache-Control")).toBe("no-store, private");
  });

  it("denies employees and forced-password accounts before assertion issuance", async () => {
    const state = "abcdefghijklmnopqrstuvwxyzABCDEF123456";
    const employee = await quoteSessionCookie({ role: "EMPLOYEE" });
    const denied = await app.request(
      new Request(`https://baogia.mdftungphat.com/api/auth/sso/cms?state=${state}`, { headers: { Cookie: employee.cookie } }),
      undefined,
      await routeEnv(employee.row),
    );
    expect(denied.status).toBe(403);

    const forced = await quoteSessionCookie({ mustChangePassword: true });
    const redirect = await app.request(
      new Request(`https://baogia.mdftungphat.com/api/auth/sso/cms?state=${state}`, { headers: { Cookie: forced.cookie } }),
      undefined,
      await routeEnv(forced.row),
    );
    expect(redirect.status).toBe(302);
    expect(redirect.headers.get("Location")).toBe(`/doi-mat-khau?returnTo=${encodeURIComponent(`/api/auth/sso/cms?state=${state}`)}`);
  });

  it("returns the signed form only for an authenticated admin and rejects invalid state", async () => {
    const invalid = await app.request(
      new Request("https://baogia.mdftungphat.com/api/auth/sso/cms?state=short"),
      undefined,
      await routeEnv(),
    );
    expect(invalid.status).toBe(422);

    const state = "abcdefghijklmnopqrstuvwxyzABCDEF123456";
    const adminSession = await quoteSessionCookie();
    const accepted = await app.request(
      new Request(`https://baogia.mdftungphat.com/api/auth/sso/cms?state=${state}`, { headers: { Cookie: adminSession.cookie } }),
      undefined,
      await routeEnv(adminSession.row),
    );
    const html = await accepted.text();
    expect(accepted.status).toBe(200);
    expect(html).toContain(`action="${CMS_SSO_CALLBACK}"`);
    expect(html).toContain('name="assertion"');
  });
});
