export type SsoSessionInput = { cookie: string };

type Environment = Record<string, string | undefined>;

const untrustedIdentityPrefixes = ["cf-access-", "x-auth-request-", "x-baogia-", "x-light-cms-internal-"];
const untrustedIdentityHeaders = new Set(["x-forwarded-email", "x-forwarded-user", "x-remote-user"]);

export function readSsoSession(environment: Environment): SsoSessionInput {
  const name = "LIGHT_CMS_ADMIN_SESSION_COOKIE";
  const cookie = (environment[name] || "").trim();
  if (!cookie) throw new Error(`${name} is required; capture the host-only CMS session after Baogia SSO without storing it in artifacts`);
  if (!cookie.startsWith("tp_light_session=")) throw new Error(`${name} must contain tp_light_session=<signed-value>`);
  if (cookie.includes(";")) throw new Error(`${name} must contain only the tp_light_session cookie`);
  if (!/^tp_light_session=[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/u.test(cookie)) throw new Error(`${name} is malformed`);
  return { cookie };
}

export function applySsoSession(headers: Headers, session: SsoSessionInput) {
  for (const name of [...headers.keys()]) {
    const lower = name.toLowerCase();
    if (untrustedIdentityHeaders.has(lower) || untrustedIdentityPrefixes.some((prefix) => lower.startsWith(prefix))) headers.delete(name);
  }
  headers.set("Cookie", session.cookie);
}
