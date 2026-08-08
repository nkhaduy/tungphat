import { base64UrlToBytes, bytesToBase64Url } from "../../src/worker/security/crypto";

export const BAOGIA_TEST_PRIVATE_JWK: JsonWebKey = {
  key_ops: ["sign"],
  ext: true,
  kty: "EC",
  x: "yuFoIDak0MmYXjSkeitb19bR2a9YJ6uSjTOq8r3zhAU",
  y: "y5AHSFGlX6ulKMsRzWAu9HuoKXjY0to1rdWMmddOddE",
  crv: "P-256",
  d: "Aoi_ViMEiTRrLLC7EVk-Sjwe-mloRyQdwvLgvuydGQM",
};

export const BAOGIA_TEST_PUBLIC_JWK: JsonWebKey = {
  key_ops: ["verify"],
  ext: true,
  kty: "EC",
  x: BAOGIA_TEST_PRIVATE_JWK.x,
  y: BAOGIA_TEST_PRIVATE_JWK.y,
  crv: "P-256",
};

export const BAOGIA_TEST_ISSUER = "https://baogia.mdftungphat.com";
export const BAOGIA_TEST_AUDIENCE = "tungphat-light-cms";
export const BAOGIA_TEST_KEY_ID = "baogia-cms-2026-08";

const encoder = new TextEncoder();

function encodeJson(value: unknown): string {
  return bytesToBase64Url(encoder.encode(JSON.stringify(value)));
}

export async function signBaogiaTestAssertion(
  overrides: Record<string, unknown> = {},
  headerOverrides: Record<string, unknown> = {},
): Promise<string> {
  const header = encodeJson({ alg: "ES256", kid: BAOGIA_TEST_KEY_ID, typ: "JWT", ...headerOverrides });
  const payload = encodeJson({
    v: 1,
    iss: BAOGIA_TEST_ISSUER,
    aud: BAOGIA_TEST_AUDIENCE,
    sub: "baogia-admin-1",
    username: "admin",
    name: "Quản trị Tùng Phát",
    role: "ADMIN",
    iat: 1_786_213_600,
    nbf: 1_786_213_595,
    exp: 1_786_213_630,
    jti: "assertion_abcdefghijklmnopqrstuvwxyz123456",
    ...overrides,
  });
  const signingInput = `${header}.${payload}`;
  const key = await crypto.subtle.importKey(
    "jwk",
    BAOGIA_TEST_PRIVATE_JWK,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    encoder.encode(signingInput),
  );
  return `${signingInput}.${bytesToBase64Url(new Uint8Array(signature))}`;
}

export function replaceAssertionSignature(assertion: string): string {
  const [header, payload, signature] = assertion.split(".");
  const bytes = base64UrlToBytes(signature);
  bytes[0] ^= 0xff;
  return `${header}.${payload}.${bytesToBase64Url(bytes)}`;
}
