import { argon2id } from "@noble/hashes/argon2.js";
import { base64UrlDecode, base64UrlEncode, constantTimeEqual } from "./crypto";

export const ARGON2_MEMORY_KIB = 19_456;
export const ARGON2_TIME_COST = 2;
export const ARGON2_PARALLELISM = 1;
const HASH_BYTES = 32;
const VERSION = "v2";
const ALGORITHM = "argon2id";
const ARGON_VERSION = 0x13;
const MAX_MEMORY_BYTES = 32 * 1024 * 1024;

function derive(password: string, salt: Uint8Array) {
  return argon2id(password, salt, {
    t: ARGON2_TIME_COST,
    m: ARGON2_MEMORY_KIB,
    p: ARGON2_PARALLELISM,
    version: ARGON_VERSION,
    dkLen: HASH_BYTES,
    maxmem: MAX_MEMORY_BYTES,
  });
}

export async function hashPassword(password: string, salt?: Uint8Array) {
  const actualSalt = salt || crypto.getRandomValues(new Uint8Array(16));
  const hash = derive(password, actualSalt);
  return [
    VERSION,
    ALGORITHM,
    `v=${ARGON_VERSION}`,
    `m=${ARGON2_MEMORY_KIB},t=${ARGON2_TIME_COST},p=${ARGON2_PARALLELISM}`,
    base64UrlEncode(actualSalt),
    base64UrlEncode(hash),
  ].join("$");
}

export async function verifyPassword(password: string, encoded: string) {
  const parts = encoded.split("$");
  if (parts.length !== 6 || parts[0] !== VERSION || parts[1] !== ALGORITHM || parts[2] !== `v=${ARGON_VERSION}`) {
    return false;
  }
  if (parts[3] !== `m=${ARGON2_MEMORY_KIB},t=${ARGON2_TIME_COST},p=${ARGON2_PARALLELISM}`) return false;
  try {
    const salt = base64UrlDecode(parts[4]);
    const expected = parts[5];
    if (salt.length < 16 || base64UrlDecode(expected).length !== HASH_BYTES) return false;
    return constantTimeEqual(base64UrlEncode(derive(password, salt)), expected);
  } catch {
    return false;
  }
}
