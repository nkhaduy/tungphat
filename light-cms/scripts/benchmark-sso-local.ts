import fs from "node:fs";
import path from "node:path";
import { onRequest } from "../functions/api/[[path]]";
import { verifyBaogiaAssertion } from "../src/worker/security/baogia-jwt";
import { completeBaogiaSso, startBaogiaSso } from "../src/worker/security/baogia-sso";
import { requireMutation, revokeSession, verifySession } from "../src/worker/security/session";
import {
  BAOGIA_TEST_AUDIENCE,
  BAOGIA_TEST_ISSUER,
  BAOGIA_TEST_KEY_ID,
  BAOGIA_TEST_PUBLIC_JWK,
  signBaogiaTestAssertion,
} from "../tests/fixtures/baogia-sso-keys";
import { createSqliteD1 } from "../tests/helpers/sqlite-d1";

type Stats = { count: number; p50: number; p95: number; p99: number; max: number };

function stats(values: number[]): Stats {
  const sorted = [...values].sort((left, right) => left - right);
  const at = (percentile: number) => sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * percentile))] || 0;
  return { count: sorted.length, p50: at(.5), p95: at(.95), p99: at(.99), max: sorted.at(-1) || 0 };
}

async function timed<T>(values: number[], operation: () => Promise<T>) {
  const started = performance.now();
  try { return await operation(); } finally { values.push(performance.now() - started); }
}

function cookieValue(setCookie: string, name: string): string {
  const match = setCookie.match(new RegExp(`(?:^|, )${name}=([^;]+)`));
  if (!match) throw new Error(`Missing ${name} cookie`);
  return `${name}=${match[1]}`;
}

function callback(assertion: string, state: string, cookie: string) {
  return new Request("https://cms.mdftungphat.com/api/auth/sso/callback", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Cookie: cookie },
    body: new URLSearchParams({ assertion, state }),
  });
}

const epoch = Math.floor(Date.now() / 1000);
const assertion = await signBaogiaTestAssertion({ iat: epoch, nbf: epoch - 5, exp: epoch + 30, jti: `benchmark_${crypto.randomUUID().replaceAll("-", "")}` });
const config = { issuer: BAOGIA_TEST_ISSUER, audience: BAOGIA_TEST_AUDIENCE, publicJwk: BAOGIA_TEST_PUBLIC_JWK, keyId: BAOGIA_TEST_KEY_ID };
const coldVerify: number[] = [];
await timed(coldVerify, () => verifyBaogiaAssertion(assertion, config, epoch));
const warmVerify: number[] = [];
for (let index = 0; index < 300; index += 1) await timed(warmVerify, () => verifyBaogiaAssertion(assertion, config, epoch));

const local = createSqliteD1();
let d1Queries = 0;
const db = {
  prepare(sql: string) { d1Queries += 1; return local.db.prepare(sql); },
  batch(statements: D1PreparedStatement[]) { return local.db.batch(statements); },
} as D1Database;
const secret = "s".repeat(32);
const env = {
  DB: db,
  SESSION_SECRET: secret,
  BAOGIA_SSO_ISSUER: BAOGIA_TEST_ISSUER,
  BAOGIA_SSO_AUD: BAOGIA_TEST_AUDIENCE,
  BAOGIA_SSO_PUBLIC_JWK: JSON.stringify(BAOGIA_TEST_PUBLIC_JWK),
  BAOGIA_SSO_KEY_ID: BAOGIA_TEST_KEY_ID,
  COOKIE_SECURE: true,
};

const start = startBaogiaSso(new Request("https://cms.mdftungphat.com/api/auth/sso/start"), { COOKIE_SECURE: true });
const state = new URL(start.headers.get("Location")!).searchParams.get("state")!;
const stateCookie = cookieValue(start.headers.get("Set-Cookie")!, "tp_light_sso_state");
const completionValues: number[] = [];
const completion = await timed(completionValues, () => completeBaogiaSso(callback(assertion, state, stateCookie), env, epoch));
const sessionCookie = cookieValue(completion.headers.get("Set-Cookie")!, "tp_light_session");
const sessionRequest = new Request("https://cms.mdftungphat.com/api/auth/session", { headers: { Cookie: sessionCookie } });
const sessionValues: number[] = [];
let verified = await verifySession(sessionRequest, { DB: db, SESSION_SECRET: secret }, epoch + 1);
if (!verified) throw new Error("SSO benchmark did not create a valid CMS session");
for (let index = 0; index < 300; index += 1) await timed(sessionValues, () => verifySession(sessionRequest, { DB: db, SESSION_SECRET: secret }, epoch + 1));

const replayStart = startBaogiaSso(new Request("https://cms.mdftungphat.com/api/auth/sso/start"), { COOKIE_SECURE: true });
const replayState = new URL(replayStart.headers.get("Location")!).searchParams.get("state")!;
const replayCookie = cookieValue(replayStart.headers.get("Set-Cookie")!, "tp_light_sso_state");
const replayValues: number[] = [];
let replayRejected = false;
try { await timed(replayValues, () => completeBaogiaSso(callback(assertion, replayState, replayCookie), env, epoch)); } catch (error) { replayRejected = error instanceof Error && error.message === "assertion_replayed"; }
if (!replayRejected) throw new Error("Replayed SSO assertion was not rejected");

const csrfValues: number[] = [];
for (let index = 0; index < 300; index += 1) {
  const request = new Request("https://cms.mdftungphat.com/api/products/item", { method: "PATCH", headers: { Origin: "https://cms.mdftungphat.com", "X-CSRF-Token": verified.csrf } });
  const allowed = await timed(csrfValues, () => requireMutation(request, { allowedOrigins: ["https://cms.mdftungphat.com"] }, verified!));
  if (!allowed) throw new Error("Valid CSRF request was rejected");
}

const gatewayValues: number[] = [];
const gatewayContext = (request: Request) => ({ request, env: { LIGHT_CMS_API: { fetch: async () => new Response("ok", { headers: { "Cache-Control": "no-store" } }) } } }) as unknown as Parameters<typeof onRequest>[0];
for (let index = 0; index < 500; index += 1) await timed(gatewayValues, () => Promise.resolve(onRequest(gatewayContext(new Request("https://cms.mdftungphat.com/api/dashboard", { headers: { Cookie: sessionCookie } })))));

const revokeValues: number[] = [];
await timed(revokeValues, () => revokeSession(sessionRequest, { DB: db, SESSION_SECRET: secret }, epoch + 2));
verified = await verifySession(sessionRequest, { DB: db, SESSION_SECRET: secret }, epoch + 3);
if (verified) throw new Error("Revoked CMS session remained valid");

const report = {
  generatedAt: new Date().toISOString(),
  environment: "local-node",
  cpu: null,
  es256: { coldVerify: stats(coldVerify), warmVerify: stats(warmVerify) },
  assertionCompletion: stats(completionValues),
  assertionReplay: { ...stats(replayValues), rejected: replayRejected },
  sessionCheck: stats(sessionValues),
  csrfCheck: stats(csrfValues),
  sessionRevoke: stats(revokeValues),
  gateway: stats(gatewayValues),
  d1Queries,
  errors: 0,
  note: "Wall-time diagnostic only; Cloudflare Worker CPU acceptance requires the deployed Baogia SSO path and Workers tail metrics.",
};
const output = path.resolve(import.meta.dirname, "../output/benchmark");
fs.mkdirSync(output, { recursive: true });
fs.writeFileSync(path.join(output, "local-sso-benchmark.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
