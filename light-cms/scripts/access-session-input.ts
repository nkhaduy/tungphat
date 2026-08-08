export type AccessSessionInput = {
  jwt: string;
  cookie?: string;
};

type Environment = Record<string, string | undefined>;

export function readAccessSession(environment: Environment, identity: "ADMIN" | "EDITOR"): AccessSessionInput {
  const jwtName = `LIGHT_CMS_${identity}_ACCESS_JWT`;
  const cookieName = `LIGHT_CMS_${identity}_ACCESS_COOKIE`;
  const jwt = (environment[jwtName] || "").trim();
  if (!jwt) throw new Error(`${jwtName} is required; reuse a real Cloudflare Access session without storing it in artifacts`);
  if (jwt.split(".").length !== 3) throw new Error(`${jwtName} is malformed`);
  const cookie = (environment[cookieName] || "").trim();
  if (cookie && !/^CF_Authorization=[^;\s]+$/u.test(cookie)) throw new Error(`${cookieName} must contain only CF_Authorization=<value>`);
  return { jwt, ...(cookie ? { cookie } : {}) };
}

export function applyAccessSession(headers: Headers, session: AccessSessionInput) {
  for (const name of [
    "Cf-Access-Authenticated-User-Email",
    "Cf-Access-User-Email",
    "X-Auth-Request-Email",
    "X-Forwarded-Email",
  ]) headers.delete(name);
  headers.set("Cf-Access-Jwt-Assertion", session.jwt);
  if (session.cookie) headers.set("Cookie", session.cookie);
}
