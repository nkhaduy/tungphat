import { describe, expect, it } from "vitest";
import { verifyBaogiaAssertion } from "../src/worker/security/baogia-jwt";
import {
  BAOGIA_TEST_AUDIENCE,
  BAOGIA_TEST_ISSUER,
  BAOGIA_TEST_KEY_ID,
  BAOGIA_TEST_PUBLIC_JWK,
  replaceAssertionSignature,
  signBaogiaTestAssertion,
} from "./fixtures/baogia-sso-keys";

const now = 1_786_213_600;
const config = {
  issuer: BAOGIA_TEST_ISSUER,
  audience: BAOGIA_TEST_AUDIENCE,
  publicJwk: BAOGIA_TEST_PUBLIC_JWK,
  keyId: BAOGIA_TEST_KEY_ID,
};

describe("Baogia ES256 assertion verification", () => {
  it("verifies a real P-256 signature and returns the immutable identity", async () => {
    await expect(verifyBaogiaAssertion(await signBaogiaTestAssertion(), config, now)).resolves.toEqual({
      subject: "baogia-admin-1",
      username: "admin",
      displayName: "Quản trị Tùng Phát",
      role: "ADMIN",
      issuedAt: now,
      notBefore: now - 5,
      expiresAt: now + 30,
      jti: "assertion_abcdefghijklmnopqrstuvwxyz123456",
    });
  });

  it.each([
    ["missing token", ""],
    ["two segments", "header.payload"],
    ["empty segment", "header..signature"],
    ["invalid base64url", "header.pay+load.signature"],
  ])("rejects %s", async (_label, assertion) => {
    await expect(verifyBaogiaAssertion(assertion, config, now)).rejects.toMatchObject({ code: "invalid_assertion" });
  });

  it("rejects unsupported headers and an unknown key id", async () => {
    await expect(verifyBaogiaAssertion(await signBaogiaTestAssertion({}, { alg: "HS256" }), config, now))
      .rejects.toMatchObject({ code: "invalid_assertion" });
    await expect(verifyBaogiaAssertion(await signBaogiaTestAssertion({}, { typ: "JWS" }), config, now))
      .rejects.toMatchObject({ code: "invalid_assertion" });
    await expect(verifyBaogiaAssertion(await signBaogiaTestAssertion({}, { kid: "unknown" }), config, now))
      .rejects.toMatchObject({ code: "unknown_key" });
  });

  it("rejects a signature not produced by the configured key", async () => {
    const assertion = replaceAssertionSignature(await signBaogiaTestAssertion());
    await expect(verifyBaogiaAssertion(assertion, config, now)).rejects.toMatchObject({ code: "invalid_signature" });
  });

  it.each([
    ["issuer", { iss: "https://evil.example" }],
    ["audience", { aud: "another-application" }],
    ["subject", { sub: "" }],
    ["role", { role: "EMPLOYEE" }],
    ["future nbf", { nbf: now + 1 }],
    ["future iat", { iat: now + 1, exp: now + 30 }],
    ["expired exp", { exp: now }],
    ["lifetime over 30 seconds", { exp: now + 31 }],
  ])("rejects an invalid %s claim", async (_label, overrides) => {
    await expect(verifyBaogiaAssertion(await signBaogiaTestAssertion(overrides), config, now))
      .rejects.toMatchObject({ code: "invalid_claims" });
  });

  it("fails closed when the public JWK cannot be imported", async () => {
    await expect(verifyBaogiaAssertion(await signBaogiaTestAssertion(), { ...config, publicJwk: { kty: "oct", k: "abc" } }, now))
      .rejects.toMatchObject({ code: "invalid_key" });
  });
});
