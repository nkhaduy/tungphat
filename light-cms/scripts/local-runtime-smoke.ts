import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { once } from "node:events";
import { createHash } from "node:crypto";
import { AccessJwksCache, verifyAccessJwt } from "../src/worker/security/access-jwt";
import { accessPublicJwk, signAccessToken } from "../tests/fixtures/access-keys";
import { analyzeSource } from "./analyze-source";
import { buildMigrationSql } from "./build-migration-sql";

const root = path.resolve(import.meta.dirname, "..");
const repositoryRoot = path.resolve(root, "..");
const wrangler = path.join(root, "node_modules/.bin/wrangler");
const config = path.join(root, "wrangler.worker.jsonc");
const database = "tungphat-light-cms-20260805-0855-staging";
const bucket = "tungphat-light-media-20260805-0855-staging";
const state = fs.mkdtempSync(path.join(os.tmpdir(), "tungphat-light-runtime-"));
const jwksServer = http.createServer((_request, response) => {
  response.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "public, max-age=600" });
  response.end(JSON.stringify({ keys: [accessPublicJwk] }));
});

try {
  const analysis = analyzeSource(repositoryRoot);
  if (analysis.issues.length) throw new Error(`Source analysis failed: ${analysis.issues.join("; ")}`);
  const migrationFile = path.join(state, "migration.sql");
  fs.writeFileSync(migrationFile, buildMigrationSql(analysis), { mode: 0o600 });
  execFileSync(wrangler, ["d1", "migrations", "apply", database, "--local", "--persist-to", state, "--config", config], { cwd: root, stdio: "ignore" });
  for (let attempt = 0; attempt < 2; attempt += 1) {
    execFileSync(wrangler, ["d1", "execute", database, "--local", "--persist-to", state, "--config", config, "--file", migrationFile], { cwd: root, stdio: "ignore" });
  }
  const d1Output = execFileSync(wrangler, [
    "d1", "execute", database, "--local", "--persist-to", state, "--config", config,
    "--command", "SELECT (SELECT COUNT(*) FROM content_records) AS records,(SELECT COUNT(*) FROM settings_records) AS settings,(SELECT COUNT(*) FROM media) AS media,(SELECT COUNT(*) FROM versions) AS versions; SELECT active,status,access_subject,password_hash FROM users WHERE id='light-cms-migration';",
    "--json",
  ], { cwd: root, encoding: "utf8" });
  const d1 = JSON.parse(d1Output) as Array<{ results: Array<Record<string, unknown>> }>;

  const sourceMedia = analysis.media[0];
  if (!sourceMedia) throw new Error("No source media available for local R2 smoke");
  const sourceFile = path.join(repositoryRoot, sourceMedia.sourcePath);
  const downloadedFile = path.join(state, "downloaded-media");
  const objectKey = `local-smoke/${Date.now()}-${path.basename(sourceMedia.publicPath)}`;
  const objectPath = `${bucket}/${objectKey}`;
  execFileSync(wrangler, ["r2", "object", "put", objectPath, "--local", "--persist-to", state, "--config", config, "--file", sourceFile, "--content-type", sourceMedia.mimeType, "--force"], { cwd: root, stdio: "ignore" });
  execFileSync(wrangler, ["r2", "object", "get", objectPath, "--local", "--persist-to", state, "--config", config, "--file", downloadedFile], { cwd: root, stdio: "ignore" });
  const sourceBytes = fs.readFileSync(sourceFile);
  const downloadedBytes = fs.readFileSync(downloadedFile);
  if (!sourceBytes.equals(downloadedBytes)) throw new Error("Local R2 object differs from the source media");
  execFileSync(wrangler, ["r2", "object", "delete", objectPath, "--local", "--persist-to", state, "--config", config, "--force"], { cwd: root, stdio: "ignore" });

  jwksServer.listen(0, "127.0.0.1");
  await once(jwksServer, "listening");
  const jwksAddress = jwksServer.address();
  if (!jwksAddress || typeof jwksAddress === "string") throw new Error("JWKS server did not start");
  const issuer = `http://127.0.0.1:${jwksAddress.port}`;
  const audience = "local-light-cms";
  const epoch = Math.floor(Date.now() / 1000);
  const token = await signAccessToken({ iss: issuer, aud: [audience], sub: "local-access-subject", email: "admin@example.com", iat: epoch, nbf: epoch - 1, exp: epoch + 600 });
  const cache = new AccessJwksCache();
  const coldStarted = performance.now();
  const cold = await verifyAccessJwt(token, { issuer, audience, jwksUrl: `${issuer}/certs` }, { cache, now: epoch });
  const coldWallMs = performance.now() - coldStarted;
  const warmStarted = performance.now();
  const warm = await verifyAccessJwt(token, { issuer, audience, jwksUrl: `${issuer}/certs` }, { cache, now: epoch });
  const warmWallMs = performance.now() - warmStarted;

  console.log(JSON.stringify({
    ok: true,
    d1: { counts: d1[0]?.results[0], migrationActor: d1[1]?.results[0], idempotentRuns: 2 },
    r2: {
      bytes: sourceBytes.byteLength,
      sha256: createHash("sha256").update(downloadedBytes).digest("hex"),
      put: true,
      get: true,
      delete: true,
    },
    jwt: {
      identity: { subject: cold.identity.subject, email: cold.identity.email },
      coldWallMs,
      warmWallMs,
      coldCache: cold.metrics.cacheStatus,
      warmCache: warm.metrics.cacheStatus,
      jwksFetches: warm.metrics.jwksFetches,
    },
  }, null, 2));
} finally {
  jwksServer.close();
  fs.rmSync(state, { recursive: true, force: true });
}
