import { base64UrlToBytes } from "./crypto";

export type BaogiaIdentity = {
  subject: string;
  username: string;
  displayName: string;
  role: "ADMIN";
  issuedAt: number;
  notBefore: number;
  expiresAt: number;
  jti: string;
};

export type BaogiaAssertionConfig = {
  issuer: string;
  audience: string;
  publicJwk: JsonWebKey;
  keyId: string;
};

export class BaogiaJwtError extends Error {
  constructor(public readonly code: "invalid_assertion" | "unknown_key" | "invalid_key" | "invalid_signature" | "invalid_claims", public readonly status = 401) {
    super(code);
    this.name = "BaogiaJwtError";
  }
}

const encoder = new TextEncoder();
const decoder = new TextDecoder("utf-8", { fatal: true });
const segmentPattern = /^[A-Za-z0-9_-]+$/u;

function invalid(code: BaogiaJwtError["code"] = "invalid_assertion", status = 401): never {
  throw new BaogiaJwtError(code, status);
}

function parseSegment(value: string): unknown {
  if (!value || !segmentPattern.test(value)) invalid();
  try {
    return JSON.parse(decoder.decode(base64UrlToBytes(value))) as unknown;
  } catch {
    return invalid();
  }
}

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function boundedString(value: unknown, max: number): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= max;
}

function integer(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value);
}

function arrayBuffer(value: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(value.byteLength);
  copy.set(value);
  return copy.buffer;
}

async function importVerificationKey(jwk: JsonWebKey): Promise<CryptoKey> {
  if (jwk.kty !== "EC" || jwk.crv !== "P-256" || !jwk.x || !jwk.y || jwk.d) invalid("invalid_key", 503);
  try {
    return await crypto.subtle.importKey("jwk", jwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["verify"]);
  } catch {
    return invalid("invalid_key", 503);
  }
}

export async function verifyBaogiaAssertion(
  assertion: string,
  config: BaogiaAssertionConfig,
  now = Math.floor(Date.now() / 1000),
): Promise<BaogiaIdentity> {
  if (!assertion || assertion.length > 8_192) invalid();
  const parts = assertion.split(".");
  if (parts.length !== 3 || parts.some((part) => !part)) invalid();
  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const header = record(parseSegment(encodedHeader));
  if (!header || header.alg !== "ES256" || header.typ !== "JWT") invalid();
  if (header.kid !== config.keyId) invalid("unknown_key");
  if ("crit" in header) invalid();

  let signature: Uint8Array;
  try {
    signature = base64UrlToBytes(encodedSignature);
  } catch {
    return invalid();
  }
  if (signature.byteLength !== 64) invalid();
  const validSignature = await crypto.subtle.verify(
    { name: "ECDSA", hash: "SHA-256" },
    await importVerificationKey(config.publicJwk),
    arrayBuffer(signature),
    encoder.encode(`${encodedHeader}.${encodedPayload}`),
  );
  if (!validSignature) invalid("invalid_signature");

  const claims = record(parseSegment(encodedPayload));
  if (
    !claims || claims.v !== 1 || claims.iss !== config.issuer || claims.aud !== config.audience
    || !boundedString(claims.sub, 256) || !boundedString(claims.username, 128)
    || !boundedString(claims.name, 256) || claims.role !== "ADMIN" || !boundedString(claims.jti, 256)
    || !integer(claims.iat) || !integer(claims.nbf) || !integer(claims.exp)
    || claims.nbf > claims.iat || claims.nbf > now || claims.iat > now
    || claims.exp <= now || claims.exp <= claims.iat || claims.exp - claims.iat > 30
  ) invalid("invalid_claims");

  return {
    subject: claims.sub,
    username: claims.username,
    displayName: claims.name,
    role: "ADMIN",
    issuedAt: claims.iat,
    notBefore: claims.nbf,
    expiresAt: claims.exp,
    jti: claims.jti,
  };
}
