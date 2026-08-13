const encoder = new TextEncoder();
const decoder = new TextDecoder();

function base64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(normalized);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function encryptionKey(secret: string) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(secret));
  return crypto.subtle.importKey("raw", digest, "AES-GCM", false, ["encrypt", "decrypt"]);
}

export async function encryptToken(value: string, secret: string) {
  if (!secret || secret.length < 32) throw new Error("gbp_encryption_key_invalid");
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await encryptionKey(secret), encoder.encode(value));
  return `v1.${base64Url(iv)}.${base64Url(new Uint8Array(ciphertext))}`;
}

export async function decryptToken(value: string, secret: string) {
  const [version, iv, ciphertext] = value.split(".");
  if (version !== "v1" || !iv || !ciphertext) throw new Error("gbp_token_invalid");
  const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv: fromBase64Url(iv) }, await encryptionKey(secret), fromBase64Url(ciphertext));
  return decoder.decode(plaintext);
}

export type BusinessLocation = {
  name: string;
  title?: string;
  websiteUri?: string;
  metadata?: { mapsUri?: string; placeId?: string };
};

export function selectTungPhatLocation(locations: BusinessLocation[]) {
  const exactWebsite = locations.find((location) => {
    try { return new URL(location.websiteUri || "").hostname.replace(/^www\./, "") === "mdftungphat.com"; }
    catch { return false; }
  });
  if (exactWebsite) return exactWebsite;
  return locations.find((location) => /tùng\s*phát|tung\s*phat/iu.test(location.title || "")) || null;
}

export function googleAuthorizationUrl(clientId: string, redirectUri: string, state: string) {
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({ client_id: clientId, redirect_uri: redirectUri, response_type: "code", scope: "https://www.googleapis.com/auth/business.manage", access_type: "offline", prompt: "consent", include_granted_scopes: "true", state }).toString();
  return url.toString();
}
