export type AccessIdentityClaims = {
  subject: string;
  email: string;
  issuedAt: number;
  expiresAt: number;
  notBefore?: number;
};

export type AccessJwtConfig = {
  issuer: string;
  audience: string;
  jwksUrl: string;
  maxTokenAgeSeconds?: number;
  clockSkewSeconds?: number;
};

export type AccessJwtMetrics = {
  cacheStatus: "hit" | "miss" | "refresh";
  jwksFetches: number;
};

export class AccessJwtError extends Error {
  constructor(public readonly code: string) {
    super(code);
    this.name = "AccessJwtError";
  }
}

type JwkWithKid = JsonWebKey & { kid: string };
type CacheEntry = { expiresAtMs: number; jwks: Map<string, JwkWithKid>; keys: Map<string, CryptoKey> };
type KeyResult = { key: CryptoKey; metrics: AccessJwtMetrics };
type FetchLike = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

const defaultTtlSeconds = 10 * 60;
const minTtlSeconds = 60;
const maxTtlSeconds = 60 * 60;
const unknownKidRefreshCooldownMs = 30 * 1000;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;

function decodeBase64Url(value: string) {
  if (!/^[A-Za-z0-9_-]+$/u.test(value)) throw new AccessJwtError("malformed_token");
  try {
    const binary = atob(value.replaceAll("-", "+").replaceAll("_", "/").padEnd(Math.ceil(value.length / 4) * 4, "="));
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
  } catch {
    throw new AccessJwtError("malformed_token");
  }
}

function parseJsonSegment(value: string) {
  try {
    return JSON.parse(new TextDecoder().decode(decodeBase64Url(value))) as unknown;
  } catch (error) {
    if (error instanceof AccessJwtError) throw error;
    throw new AccessJwtError("malformed_token");
  }
}

function ttlFrom(response: Response) {
  const match = /(?:^|,)\s*max-age=(\d+)/iu.exec(response.headers.get("Cache-Control") || "");
  const seconds = match ? Number(match[1]) : defaultTtlSeconds;
  return Math.min(maxTtlSeconds, Math.max(minTtlSeconds, Number.isFinite(seconds) ? seconds : defaultTtlSeconds));
}

function validJwk(value: unknown): value is JwkWithKid {
  if (!value || typeof value !== "object") return false;
  const key = value as Record<string, unknown>;
  return typeof key.kid === "string" && key.kid.length > 0 && key.kty === "RSA" && (!key.alg || key.alg === "RS256") && (!key.use || key.use === "sig");
}

export class AccessJwksCache {
  private readonly entries = new Map<string, CacheEntry>();
  private readonly pending = new Map<string, Promise<CacheEntry>>();
  private readonly fetchCounts = new Map<string, number>();
  private readonly unknownKidRefreshes = new Map<string, number>();

  constructor(private readonly fetcher?: FetchLike) {}

  private async load(url: string, nowMs: number): Promise<CacheEntry> {
    const existing = this.pending.get(url);
    if (existing) return existing;
    const loading = (async () => {
      let response: Response;
      try {
        this.fetchCounts.set(url, (this.fetchCounts.get(url) || 0) + 1);
        response = await (this.fetcher || fetch)(url, { headers: { Accept: "application/json" }, redirect: "manual" });
      } catch {
        throw new AccessJwtError("jwks_unavailable");
      }
      if (!response.ok) throw new AccessJwtError("jwks_unavailable");
      let payload: unknown;
      try {
        payload = await response.json();
      } catch {
        throw new AccessJwtError("jwks_unavailable");
      }
      const values = payload && typeof payload === "object" && Array.isArray((payload as { keys?: unknown }).keys)
        ? (payload as { keys: unknown[] }).keys
        : null;
      if (!values) throw new AccessJwtError("jwks_unavailable");
      const jwks = new Map<string, JwkWithKid>();
      for (const value of values) if (validJwk(value)) jwks.set(value.kid, value);
      const entry = { expiresAtMs: nowMs + ttlFrom(response) * 1000, jwks, keys: new Map<string, CryptoKey>() };
      this.entries.set(url, entry);
      return entry;
    })();
    this.pending.set(url, loading);
    try {
      return await loading;
    } finally {
      this.pending.delete(url);
    }
  }

  private async import(entry: CacheEntry, kid: string) {
    const existing = entry.keys.get(kid);
    if (existing) return existing;
    const jwk = entry.jwks.get(kid);
    if (!jwk) return null;
    try {
      const key = await crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
      entry.keys.set(kid, key);
      return key;
    } catch {
      throw new AccessJwtError("jwks_unavailable");
    }
  }

  async getKey(url: string, kid: string, nowMs: number): Promise<KeyResult> {
    let entry = this.entries.get(url);
    let cacheStatus: AccessJwtMetrics["cacheStatus"] = "hit";
    if (!entry || entry.expiresAtMs <= nowMs) {
      cacheStatus = "miss";
      entry = await this.load(url, nowMs);
    }
    let key = await this.import(entry, kid);
    if (!key) {
      const lastRefresh = this.unknownKidRefreshes.get(url);
      if (lastRefresh !== undefined && nowMs - lastRefresh < unknownKidRefreshCooldownMs) throw new AccessJwtError("unknown_kid");
      cacheStatus = "refresh";
      this.unknownKidRefreshes.set(url, nowMs);
      this.entries.delete(url);
      entry = await this.load(url, nowMs);
      key = await this.import(entry, kid);
    }
    if (!key) throw new AccessJwtError("unknown_kid");
    return { key, metrics: { cacheStatus, jwksFetches: this.fetchCounts.get(url) || 0 } };
  }
}

function numericClaim(claims: Record<string, unknown>, name: string) {
  const value = claims[name];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export async function verifyAccessJwt(
  token: string,
  config: AccessJwtConfig,
  options: { cache: AccessJwksCache; now?: number },
) {
  if (!token) throw new AccessJwtError("missing_token");
  const parts = token.split(".");
  if (parts.length !== 3 || parts.some((part) => !part)) throw new AccessJwtError("malformed_token");
  const headerValue = parseJsonSegment(parts[0]);
  const claimsValue = parseJsonSegment(parts[1]);
  if (!headerValue || typeof headerValue !== "object" || !claimsValue || typeof claimsValue !== "object") throw new AccessJwtError("malformed_token");
  const header = headerValue as Record<string, unknown>;
  const claims = claimsValue as Record<string, unknown>;
  if (header.alg !== "RS256") throw new AccessJwtError("invalid_algorithm");
  const kid = typeof header.kid === "string" ? header.kid : "";
  if (!kid) throw new AccessJwtError("malformed_token");

  const now = options.now ?? Math.floor(Date.now() / 1000);
  const keyResult = await options.cache.getKey(config.jwksUrl, kid, now * 1000);
  const validSignature = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    keyResult.key,
    decodeBase64Url(parts[2]),
    new TextEncoder().encode(`${parts[0]}.${parts[1]}`),
  );
  if (!validSignature) throw new AccessJwtError("invalid_signature");

  if (claims.iss !== config.issuer) throw new AccessJwtError("invalid_issuer");
  const audiences = typeof claims.aud === "string" ? [claims.aud] : Array.isArray(claims.aud) ? claims.aud.filter((value): value is string => typeof value === "string") : [];
  if (!audiences.includes(config.audience)) throw new AccessJwtError("invalid_audience");
  const issuedAt = numericClaim(claims, "iat");
  const expiresAt = numericClaim(claims, "exp");
  const notBefore = claims.nbf === undefined ? undefined : numericClaim(claims, "nbf");
  if (issuedAt === null || expiresAt === null || notBefore === null || expiresAt <= issuedAt) throw new AccessJwtError("invalid_time_claims");
  if (expiresAt <= now) throw new AccessJwtError("token_expired");
  const skew = config.clockSkewSeconds ?? 60;
  if (notBefore !== undefined && notBefore > now + skew) throw new AccessJwtError("token_not_active");
  if (issuedAt > now + skew) throw new AccessJwtError("invalid_iat");
  if (issuedAt < now - (config.maxTokenAgeSeconds ?? 12 * 60 * 60) - skew) throw new AccessJwtError("token_too_old");

  const subject = typeof claims.sub === "string" ? claims.sub.trim() : "";
  const email = typeof claims.email === "string" ? claims.email.trim().toLowerCase() : "";
  if (!subject || subject.length > 512 || !emailPattern.test(email) || email.length > 254) throw new AccessJwtError("missing_identity");
  return {
    identity: { subject, email, issuedAt, expiresAt, ...(notBefore === undefined ? {} : { notBefore }) } satisfies AccessIdentityClaims,
    metrics: keyResult.metrics,
  };
}
