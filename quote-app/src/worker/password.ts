import { argon2id } from "@noble/hashes/argon2.js";
import { base64UrlDecode, base64UrlEncode, constantTimeEqual } from "./crypto";

const MEMORY_KIB = 19_456;
const TIME_COST = 2;
const PARALLELISM = 1;
const HASH_BYTES = 32;
const ARGON_VERSION = "v1";
const PBKDF2_VERSION = "v2";
// Workers currently caps PBKDF2 iteration counts at 100,000.
const PBKDF2_ITERATIONS = 100_000;

function derive(password: string, salt: Uint8Array): Uint8Array {
  return argon2id(password, salt, {
    t: TIME_COST,
    m: MEMORY_KIB,
    p: PARALLELISM,
    dkLen: HASH_BYTES,
    maxmem: 32 * 1024 * 1024,
  });
}

function validatePassword(password: string): void {
  if (password.length < 10 || password.length > 1024) throw new Error("Mật khẩu phải có ít nhất 10 ký tự.");
}

async function derivePbkdf2(password: string, salt: Uint8Array): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const saltBuffer = new ArrayBuffer(salt.byteLength);
  new Uint8Array(saltBuffer).set(salt);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: saltBuffer, iterations: PBKDF2_ITERATIONS }, key, HASH_BYTES * 8);
  return new Uint8Array(bits);
}

export async function hashPassword(password: string): Promise<string> {
  validatePassword(password);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return [
    PBKDF2_VERSION,
    "pbkdf2-sha256",
    `i=${PBKDF2_ITERATIONS}`,
    base64UrlEncode(salt),
    base64UrlEncode(await derivePbkdf2(password, salt)),
  ].join("$");
}

export async function verifyPassword(password: string, encoded: string): Promise<boolean> {
  const parts = encoded.split("$");
  if (parts.length !== 5) return false;
  if (parts[0] === PBKDF2_VERSION && parts[1] === "pbkdf2-sha256" && parts[2] === `i=${PBKDF2_ITERATIONS}`) {
    try {
      const salt = base64UrlDecode(parts[3]);
      const expected = base64UrlDecode(parts[4]);
      if (salt.length !== 16 || expected.length !== HASH_BYTES) return false;
      return constantTimeEqual(base64UrlEncode(await derivePbkdf2(password, salt)), parts[4]);
    } catch {
      return false;
    }
  }
  if (parts[0] !== ARGON_VERSION || parts[1] !== "argon2id") return false;
  if (parts[2] !== `m=${MEMORY_KIB},t=${TIME_COST},p=${PARALLELISM}`) return false;
  try {
    const salt = base64UrlDecode(parts[3]);
    const expected = parts[4];
    if (salt.length !== 16 || base64UrlDecode(expected).length !== HASH_BYTES) return false;
    return constantTimeEqual(base64UrlEncode(derive(password, salt)), expected);
  } catch {
    return false;
  }
}
