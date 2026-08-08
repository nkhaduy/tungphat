import { describe, expect, it } from "vitest";
import { AccessJwksCache, verifyAccessJwt } from "../src/worker/security/access-jwt";
import { accessPublicJwk, signAccessToken } from "./fixtures/access-keys";

const now = 1_800_000_000;
const issuer = "https://tungphat-test.cloudflareaccess.com";
const audience = "light-cms-access-audience";
const config = { issuer, audience, jwksUrl: `${issuer}/cdn-cgi/access/certs`, maxTokenAgeSeconds: 12 * 60 * 60 };

function validClaims(overrides: Record<string, unknown> = {}) {
  return { iss: issuer, aud: [audience], sub: "access-subject-1", email: "Admin@Example.com", iat: now - 10, nbf: now - 10, exp: now + 600, ...overrides };
}

function jwksResponse(keys: JsonWebKey[] = [accessPublicJwk], cacheControl = "public, max-age=600") {
  return new Response(JSON.stringify({ keys }), { status: 200, headers: { "Content-Type": "application/json", "Cache-Control": cacheControl } });
}

async function expectCode(promise: Promise<unknown>, code: string) {
  await expect(promise).rejects.toMatchObject({ code });
}

describe("Cloudflare Access JWT verification", () => {
  it("rejects a missing token", async () => {
    await expectCode(verifyAccessJwt("", config, { now, cache: new AccessJwksCache(async () => jwksResponse()) }), "missing_token");
  });

  it("rejects malformed JWT JSON and segment counts", async () => {
    const cache = new AccessJwksCache(async () => jwksResponse());
    await expectCode(verifyAccessJwt("one.two", config, { now, cache }), "malformed_token");
    await expectCode(verifyAccessJwt("e30.invalid.signature", config, { now, cache }), "malformed_token");
  });

  it("accepts a real RS256 signature and normalizes email", async () => {
    const result = await verifyAccessJwt(await signAccessToken(validClaims()), config, { now, cache: new AccessJwksCache(async () => jwksResponse()) });
    expect(result.identity).toEqual(expect.objectContaining({ subject: "access-subject-1", email: "admin@example.com" }));
    expect(result.metrics).toEqual(expect.objectContaining({ cacheStatus: "miss", jwksFetches: 1 }));
  });

  it("uses Worker-compatible manual redirect handling for the JWKS request", async () => {
    let redirect: RequestRedirect | undefined;
    const cache = new AccessJwksCache(async (_input, init) => {
      redirect = init?.redirect;
      return jwksResponse();
    });
    await verifyAccessJwt(await signAccessToken(validClaims()), config, { now, cache });
    expect(redirect).toBe("manual");
  });

  it("rejects algorithms other than RS256", async () => {
    const token = await signAccessToken(validClaims(), { alg: "HS256", kid: accessPublicJwk.kid, typ: "JWT" });
    await expectCode(verifyAccessJwt(token, config, { now, cache: new AccessJwksCache(async () => jwksResponse()) }), "invalid_algorithm");
  });

  it("rejects an invalid signature", async () => {
    const token = await signAccessToken(validClaims());
    const parts = token.split(".");
    parts[2] = `${parts[2].slice(0, -2)}aa`;
    await expectCode(verifyAccessJwt(parts.join("."), config, { now, cache: new AccessJwksCache(async () => jwksResponse()) }), "invalid_signature");
  });

  it("rejects the wrong issuer", async () => {
    const token = await signAccessToken(validClaims({ iss: "https://other.cloudflareaccess.com" }));
    await expectCode(verifyAccessJwt(token, config, { now, cache: new AccessJwksCache(async () => jwksResponse()) }), "invalid_issuer");
  });

  it("rejects the wrong application audience", async () => {
    const token = await signAccessToken(validClaims({ aud: ["another-application"] }));
    await expectCode(verifyAccessJwt(token, config, { now, cache: new AccessJwksCache(async () => jwksResponse()) }), "invalid_audience");
  });

  it("accepts the application audience as a string claim", async () => {
    const result = await verifyAccessJwt(await signAccessToken(validClaims({ aud: audience })), config, { now, cache: new AccessJwksCache(async () => jwksResponse()) });
    expect(result.identity.subject).toBe("access-subject-1");
  });

  it("rejects expired, future-not-before, and future-issued tokens", async () => {
    const cache = new AccessJwksCache(async () => jwksResponse());
    await expectCode(verifyAccessJwt(await signAccessToken(validClaims({ exp: now - 1 })), config, { now, cache }), "token_expired");
    await expectCode(verifyAccessJwt(await signAccessToken(validClaims({ nbf: now + 61 })), config, { now, cache }), "token_not_active");
    await expectCode(verifyAccessJwt(await signAccessToken(validClaims({ iat: now + 61 })), config, { now, cache }), "invalid_iat");
  });

  it("rejects tokens older than the configured Access session ceiling", async () => {
    const token = await signAccessToken(validClaims({ iat: now - 12 * 60 * 60 - 61, nbf: now - 12 * 60 * 60 - 61 }));
    await expectCode(verifyAccessJwt(token, config, { now, cache: new AccessJwksCache(async () => jwksResponse()) }), "token_too_old");
  });

  it("rejects missing subject or email claims", async () => {
    const cache = new AccessJwksCache(async () => jwksResponse());
    await expectCode(verifyAccessJwt(await signAccessToken(validClaims({ sub: "" })), config, { now, cache }), "missing_identity");
    await expectCode(verifyAccessJwt(await signAccessToken(validClaims({ email: "not-an-email" })), config, { now, cache }), "missing_identity");
  });

  it("reuses a warm JWKS cache without another fetch", async () => {
    let fetches = 0;
    const cache = new AccessJwksCache(async () => { fetches += 1; return jwksResponse(); });
    await verifyAccessJwt(await signAccessToken(validClaims()), config, { now, cache });
    const second = await verifyAccessJwt(await signAccessToken(validClaims({ sub: "access-subject-2" })), config, { now: now + 1, cache });
    expect(fetches).toBe(1);
    expect(second.metrics.cacheStatus).toBe("hit");
  });

  it("refreshes JWKS once when kid is unknown", async () => {
    let fetches = 0;
    const rotated = { ...accessPublicJwk, kid: "rotated-key" };
    const cache = new AccessJwksCache(async () => { fetches += 1; return fetches === 1 ? jwksResponse([]) : jwksResponse([rotated]); });
    const token = await signAccessToken(validClaims(), { alg: "RS256", kid: "rotated-key", typ: "JWT" });
    const result = await verifyAccessJwt(token, config, { now, cache });
    expect(fetches).toBe(2);
    expect(result.metrics.cacheStatus).toBe("refresh");
  });

  it("fails closed when kid remains unknown or JWKS fetch fails", async () => {
    const token = await signAccessToken(validClaims(), { alg: "RS256", kid: "unknown-key", typ: "JWT" });
    await expectCode(verifyAccessJwt(token, config, { now, cache: new AccessJwksCache(async () => jwksResponse([])) }), "unknown_kid");
    await expectCode(verifyAccessJwt(await signAccessToken(validClaims()), config, { now, cache: new AccessJwksCache(async () => new Response("down", { status: 503 })) }), "jwks_unavailable");
  });

  it("does not refetch JWKS for every unknown kid request", async () => {
    let fetches = 0;
    const cache = new AccessJwksCache(async () => { fetches += 1; return jwksResponse(); });
    const first = await signAccessToken(validClaims(), { alg: "RS256", kid: "unknown-key-1", typ: "JWT" });
    const second = await signAccessToken(validClaims(), { alg: "RS256", kid: "unknown-key-2", typ: "JWT" });
    await expectCode(verifyAccessJwt(first, config, { now, cache }), "unknown_kid");
    await expectCode(verifyAccessJwt(second, config, { now: now + 1, cache }), "unknown_kid");
    expect(fetches).toBe(2);
  });
});
