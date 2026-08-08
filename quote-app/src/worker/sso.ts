import type { SessionUser } from "../shared/types";
import { base64UrlEncode, randomToken } from "./crypto";
import { HttpError } from "./http";

export const CMS_SSO_ISSUER = "https://baogia.mdftungphat.com";
export const CMS_SSO_AUDIENCE = "tungphat-light-cms";
export const CMS_SSO_CALLBACK = "https://cms.mdftungphat.com/api/auth/sso/callback";
export const CMS_SSO_KEY_ID = "baogia-cms-2026-08";

export type CmsSsoClaims = {
  v: 1;
  iss: string;
  aud: string;
  sub: string;
  username: string;
  name: string;
  role: "ADMIN";
  iat: number;
  nbf: number;
  exp: number;
  jti: string;
};

const encoder = new TextEncoder();

function encodeJson(value: unknown): string {
  return base64UrlEncode(encoder.encode(JSON.stringify(value)));
}

function htmlEscape(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

async function signingKey(serializedJwk: string): Promise<CryptoKey> {
  try {
    const jwk = JSON.parse(serializedJwk) as JsonWebKey;
    if (jwk.kty !== "EC" || jwk.crv !== "P-256" || !jwk.d || !jwk.x || !jwk.y) throw new Error("invalid_jwk");
    return await crypto.subtle.importKey("jwk", jwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  } catch {
    throw new HttpError(503, "Hệ thống đăng nhập CMS chưa được cấu hình.");
  }
}

export async function signCmsAssertion(
  user: Pick<SessionUser, "id" | "username" | "fullName" | "role">,
  env: Pick<QuoteAppEnv, "CMS_SSO_PRIVATE_JWK">,
  now = Math.floor(Date.now() / 1000),
): Promise<string> {
  if (user.role !== "ADMIN") throw new HttpError(403, "Bạn chưa được cấp quyền quản trị CMS.");
  const header = encodeJson({ alg: "ES256", kid: CMS_SSO_KEY_ID, typ: "JWT" });
  const claims: CmsSsoClaims = {
    v: 1,
    iss: CMS_SSO_ISSUER,
    aud: CMS_SSO_AUDIENCE,
    sub: user.id,
    username: user.username,
    name: user.fullName,
    role: "ADMIN",
    iat: now,
    nbf: now - 5,
    exp: now + 30,
    jti: randomToken(24),
  };
  const payload = encodeJson(claims);
  const signingInput = `${header}.${payload}`;
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    await signingKey(env.CMS_SSO_PRIVATE_JWK),
    encoder.encode(signingInput),
  );
  return `${signingInput}.${base64UrlEncode(new Uint8Array(signature))}`;
}

export function cmsSsoForm(assertion: string, state: string, callback = CMS_SSO_CALLBACK): Response {
  if (callback !== CMS_SSO_CALLBACK) throw new HttpError(503, "Cấu hình đăng nhập CMS không hợp lệ.");
  const safeCallback = htmlEscape(callback);
  const body = `<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>Đang mở Light CMS</title></head><body><form id="cms-sso" method="post" action="${safeCallback}"><input type="hidden" name="assertion" value="${htmlEscape(assertion)}"><input type="hidden" name="state" value="${htmlEscape(state)}"><noscript><button type="submit">Tiếp tục đến CMS</button></noscript></form><script>document.getElementById("cms-sso").submit();</script></body></html>`;
  return new Response(body, {
    status: 200,
    headers: {
      "Cache-Control": "no-store, private",
      "Content-Type": "text/html; charset=UTF-8",
      "Content-Security-Policy": `default-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action ${CMS_SSO_CALLBACK}; script-src 'unsafe-inline'`,
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
    },
  });
}
