import { describe, expect, it } from "vitest";
import type { SessionUser } from "../src/shared/types";
import { base64UrlDecode } from "../src/worker/crypto";
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

describe("Baogia Light CMS SSO assertion", () => {
  it("signs a 30-second ES256 assertion for an active admin", async () => {
    const { privateJwk, publicKey } = await keyPair();

    const assertion = await signCmsAssertion(admin, { CMS_SSO_PRIVATE_JWK: JSON.stringify(privateJwk) } as QuoteAppEnv, now);
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
    await expect(signCmsAssertion({ ...admin, role: "EMPLOYEE" }, { CMS_SSO_PRIVATE_JWK: JSON.stringify(privateJwk) } as QuoteAppEnv, now))
      .rejects.toMatchObject({ status: 403 });
  });

  it("fails closed when the signing key is missing or malformed", async () => {
    await expect(signCmsAssertion(admin, { CMS_SSO_PRIVATE_JWK: "" } as QuoteAppEnv, now)).rejects.toMatchObject({ status: 503 });
    await expect(signCmsAssertion(admin, { CMS_SSO_PRIVATE_JWK: "not-json" } as QuoteAppEnv, now)).rejects.toMatchObject({ status: 503 });
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
});
