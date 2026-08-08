import { base64UrlDecode, base64UrlEncode } from "./crypto";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function asArrayBuffer(value: Uint8Array): ArrayBuffer {
  return value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength) as ArrayBuffer;
}

async function vaultKey(secret: string): Promise<CryptoKey> {
  if (secret.length < 32) throw new Error("SESSION_SECRET is too short for password vault.");
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(`tung-phat-password-vault:${secret}`));
  return crypto.subtle.importKey("raw", digest, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

export async function encryptPassword(password: string, secret: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await vaultKey(secret), encoder.encode(password));
  return `v1.${base64UrlEncode(iv)}.${base64UrlEncode(new Uint8Array(encrypted))}`;
}

export async function decryptPassword(ciphertext: string, secret: string): Promise<string> {
  const [version, encodedIv, encodedCiphertext] = ciphertext.split(".");
  if (version !== "v1" || !encodedIv || !encodedCiphertext) throw new Error("Invalid password vault entry.");
  const iv = base64UrlDecode(encodedIv);
  const encrypted = base64UrlDecode(encodedCiphertext);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: asArrayBuffer(iv) },
    await vaultKey(secret),
    asArrayBuffer(encrypted),
  );
  return decoder.decode(decrypted);
}
