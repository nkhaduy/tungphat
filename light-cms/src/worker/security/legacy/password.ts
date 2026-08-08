import { base64UrlToBytes, bytesToBase64Url, constantTimeEqual } from "../crypto";

export const PASSWORD_ALGORITHM = "pbkdf2-sha256";
export const PASSWORD_MIN_ITERATIONS = 25_000;
export const PASSWORD_MAX_ITERATIONS = 600_000;
const DERIVED_BYTES = 32;

export async function derivePassword(password: string, salt: Uint8Array, iterations: number) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: "PBKDF2", salt: salt as unknown as BufferSource, iterations, hash: "SHA-256" }, key, DERIVED_BYTES * 8));
}

export async function hashPassword(password: string, iterations = PASSWORD_MIN_ITERATIONS, suppliedSalt?: Uint8Array) {
  if (!Number.isInteger(iterations) || iterations < PASSWORD_MIN_ITERATIONS || iterations > PASSWORD_MAX_ITERATIONS) throw new Error("Unsupported password cost");
  const salt = suppliedSalt || crypto.getRandomValues(new Uint8Array(16));
  const derived = await derivePassword(password, salt, iterations);
  return `${PASSWORD_ALGORITHM}$${iterations}$${bytesToBase64Url(salt)}$${bytesToBase64Url(derived)}`;
}

export async function verifyPassword(password: string, encoded: string) {
  const [algorithm, iterationText, saltText, expectedText, extra] = encoded.split("$");
  if (extra || algorithm !== PASSWORD_ALGORITHM) return false;
  const iterations = Number(iterationText);
  if (!Number.isInteger(iterations) || iterations < PASSWORD_MIN_ITERATIONS || iterations > PASSWORD_MAX_ITERATIONS) return false;
  try {
    const actual = bytesToBase64Url(await derivePassword(password, base64UrlToBytes(saltText), iterations));
    return constantTimeEqual(actual, expectedText);
  } catch {
    return false;
  }
}
