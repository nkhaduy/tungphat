import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { once } from "node:events";
import { onRequest } from "../functions/api/[[path]]";
import { resolveAccessUser } from "../src/worker/security/access-auth";
import { AccessJwksCache, verifyAccessJwt } from "../src/worker/security/access-jwt";
import { accessPublicJwk, signAccessToken } from "../tests/fixtures/access-keys";
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

let jwksFetches = 0;
const server = http.createServer((_request, response) => {
  jwksFetches += 1;
  response.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "public, max-age=600" });
  response.end(JSON.stringify({ keys: [accessPublicJwk] }));
});

try {
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("JWKS benchmark server did not start");
  const issuer = `http://127.0.0.1:${address.port}`;
  const audience = "local-access-benchmark";
  const epoch = Math.floor(Date.now() / 1000);
  const token = await signAccessToken({ iss: issuer, aud: [audience], sub: "benchmark-subject", email: "benchmark@example.com", iat: epoch, nbf: epoch - 1, exp: epoch + 600 });
  const config = { issuer, audience, jwksUrl: `${issuer}/certs` };

  const coldValues: number[] = [];
  for (let index = 0; index < 20; index += 1) {
    await timed(coldValues, () => verifyAccessJwt(token, config, { cache: new AccessJwksCache(), now: epoch }));
  }
  const warmCache = new AccessJwksCache();
  await verifyAccessJwt(token, config, { cache: warmCache, now: epoch });
  const warmValues: number[] = [];
  for (let index = 0; index < 300; index += 1) {
    await timed(warmValues, () => verifyAccessJwt(token, config, { cache: warmCache, now: epoch }));
  }

  const { db: database } = createSqliteD1();
  const now = new Date().toISOString();
  await database.prepare(`INSERT INTO users(id,email,name,display_name,role,password_hash,active,status,access_subject,created_at,updated_at)
    VALUES('benchmark-user','benchmark@example.com','Benchmark User','Benchmark User','admin','!access-only!',1,'active','benchmark-subject',?1,?1)`).bind(now).run();
  const lookupValues: number[] = [];
  for (let index = 0; index < 300; index += 1) {
    await timed(lookupValues, () => resolveAccessUser(database, { subject: "benchmark-subject", email: "benchmark@example.com", issuedAt: epoch, expiresAt: epoch + 600 }, `benchmark-${index}`, { now, auditLogin: false }));
  }

  const gatewayValues: number[] = [];
  const gatewayContext = (request: Request) => ({ request, env: { LIGHT_CMS_API: { fetch: async () => new Response("ok", { headers: { "Cache-Control": "no-store" } }) } } }) as unknown as Parameters<typeof onRequest>[0];
  for (let index = 0; index < 500; index += 1) {
    await timed(gatewayValues, () => Promise.resolve(onRequest(gatewayContext(new Request("https://staging.example/api/dashboard", { headers: { "Cf-Access-Jwt-Assertion": token, Cookie: "CF_Authorization=opaque" } })))));
  }

  const report = {
    generatedAt: new Date().toISOString(),
    environment: "local-node",
    cpu: null,
    jwt: { cold: stats(coldValues), warm: stats(warmValues), jwksFetches, expectedJwksFetches: 21 },
    d1UserLookup: stats(lookupValues),
    gateway: stats(gatewayValues),
    errors: 0,
    note: "Wall-time diagnostic only; Cloudflare Worker CPU acceptance requires real Access staging and tail metrics.",
  };
  const output = path.resolve(import.meta.dirname, "../output/benchmark");
  fs.mkdirSync(output, { recursive: true });
  fs.writeFileSync(path.join(output, "local-access-benchmark.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} finally {
  server.close();
}
