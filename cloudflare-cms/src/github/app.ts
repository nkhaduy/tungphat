import { base64UrlEncode } from "../auth/crypto";

type GitHubEnv = Pick<CloudflareCmsEnv,
  "GITHUB_APP_ID" | "GITHUB_INSTALLATION_ID" | "GITHUB_APP_PRIVATE_KEY" | "GITHUB_FINE_GRAINED_TOKEN"
>;

let cached: { token: string; expiresAt: number } | null = null;

function pemBytes(value: string) {
  const normalized = value.replace(/\\n/g, "\n").trim();
  const body = normalized.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, "");
  const binary = atob(body);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}
async function appJwt(env: GitHubEnv, now = Math.floor(Date.now() / 1000)) {
  const header = base64UrlEncode(new TextEncoder().encode(JSON.stringify({ alg: "RS256", typ: "JWT" })));
  const payload = base64UrlEncode(new TextEncoder().encode(JSON.stringify({ iat: now - 30, exp: now + 540, iss: env.GITHUB_APP_ID })));
  const input = `${header}.${payload}`;
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemBytes(env.GITHUB_APP_PRIVATE_KEY),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(input));
  return `${input}.${base64UrlEncode(new Uint8Array(signature))}`;
}

export async function githubToken(env: GitHubEnv) {
  const now = Math.floor(Date.now() / 1000);
  if (cached && cached.expiresAt > now + 90) return cached.token;
  if (env.GITHUB_APP_ID && env.GITHUB_INSTALLATION_ID && env.GITHUB_APP_PRIVATE_KEY) {
    const response = await fetch(`https://api.github.com/app/installations/${encodeURIComponent(env.GITHUB_INSTALLATION_ID)}/access_tokens`, {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${await appJwt(env, now)}`,
        "User-Agent": "tungphat-cms-gateway",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });
    if (!response.ok) throw new Error(`github_installation_token_${response.status}`);
    const body = await response.json() as { token?: string; expires_at?: string };
    if (!body.token || !body.expires_at) throw new Error("github_installation_token_invalid");
    cached = { token: body.token, expiresAt: Math.floor(Date.parse(body.expires_at) / 1000) };
    return body.token;
  }
  if (env.GITHUB_FINE_GRAINED_TOKEN) return env.GITHUB_FINE_GRAINED_TOKEN;
  throw new Error("github_credentials_unavailable");
}

export function clearGitHubTokenCache() {
  cached = null;
}
