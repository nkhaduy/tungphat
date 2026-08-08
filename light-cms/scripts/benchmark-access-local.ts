import fs from "node:fs";
import path from "node:path";
import { onRequest } from "../functions/api/[[path]]";
import { verifyBaogiaAssertion } from "../src/worker/security/baogia-jwt";
import { createSession, verifySession } from "../src/worker/security/session";
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
  return { count: sorted.length, p50: at(0.5), p95: at(0.95), p99: at(0.99), max: sorted.at(-1) || 0 };
}

async function timed<T>(values: number[], operation: () => Promise<T>) {
  const started = performance.now();
  const result = await operation();
  values.push(performance.now() - started);
  return result;
}

const epoch = Math.floor(Date.now() / 1000);
const assertion = await signBaogiaTestAssertion({ iat: epoch, nbf: epoch - 5, exp: epoch + 30, jti: `benchmark_${crypto.randomUUID().replaceAll("-", "")}` });
const config = { issuer: BAOGIA_TEST_ISSUER, audience: BAOGIA_TEST_AUDIENCE, publicJwk: BAOGIA_TEST_PUBLIC_JWK, keyId: BAOGIA_TEST_KEY_ID };
const coldValues: number[] = [];
for (let index = 0; index < 20; index += 1) await timed(coldValues, () => verifyBaogiaAssertion(assertion, config, epoch));
const warmValues: number[] = [];
for (let index = 0; index < 300; index += 1) await timed(warmValues, () => verifyBaogiaAssertion(assertion, config, epoch));

const { db, sqlite } = createSqliteD1();
const now = new Date().toISOString();
sqlite.prepare(`INSERT INTO users(id,email,name,display_name,role,password_hash,active,status,baogia_subject,baogia_username,created_at,updated_at)
  VALUES('benchmark-user','benchmark@baogia.invalid','Benchmark User','Benchmark User','super-admin','!baogia-sso!',1,'active','benchmark-subject','benchmark',?,?)`).run(now, now);
const secret = "s".repeat(32);
const created = await createSession({ DB: db, SESSION_SECRET: secret, COOKIE_SECURE: true }, { id: "benchmark-user", email: "benchmark@baogia.invalid", name: "Benchmark User", role: "super-admin" }, epoch);
const sessionRequest = new Request("https://cms.mdftungphat.com/api/auth/session", { headers: { Cookie: created.cookie.split(";")[0] } });
const sessionValues: number[] = [];
for (let index = 0; index < 300; index += 1) await timed(sessionValues, () => verifySession(sessionRequest, { DB: db, SESSION_SECRET: secret }, epoch + 1));

const gatewayValues: number[] = [];
const gatewayContext = (request: Request) => ({ request, env: { LIGHT_CMS_API: { fetch: async () => new Response("ok", { headers: { "Cache-Control": "no-store" } }) } } }) as unknown as Parameters<typeof onRequest>[0];
for (let index = 0; index < 500; index += 1) {
  await timed(gatewayValues, () => Promise.resolve(onRequest(gatewayContext(
    new Request("https://cms.mdftungphat.com/api/dashboard", { headers: { Cookie: created.cookie.split(";")[0] } }),
  ))));
}

const report = {
  generatedAt: new Date().toISOString(),
  environment: "local-node",
  cpu: null,
  jwt: { cold: stats(coldValues), warm: stats(warmValues), jwksFetches: 0 },
  sessionCheck: stats(sessionValues),
  gateway: stats(gatewayValues),
  errors: 0,
  note: "Wall-time diagnostic only; Cloudflare Worker CPU acceptance requires the real Baogia SSO staging deployment and tail metrics.",
};
const output = path.resolve(import.meta.dirname, "../output/benchmark");
fs.mkdirSync(output, { recursive: true });
fs.writeFileSync(path.join(output, "local-sso-benchmark.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
