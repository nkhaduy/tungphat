import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { extractSitemapUrls, normalizeIndexNowHtml, selectIndexNowDelta, submitIndexNow } from "../lib/indexnow.ts";

const sitemapPath = process.env.INDEXNOW_SITEMAP_PATH ?? "out/sitemap.xml";
const statePath = process.env.INDEXNOW_STATE_PATH ?? ".indexnow-state.json";
const evidencePath = process.env.INDEXNOW_EVIDENCE_PATH ?? "reports/indexnow-delta.json";
const siteOrigin = "https://mdftungphat.com";
const key = process.env.INDEXNOW_KEY;
const force = process.argv.includes("--force");
const seedProduction = process.argv.includes("--seed-production");
const dryRun = process.argv.includes("--dry-run") || !key;

if (!existsSync(sitemapPath)) throw new Error(`Missing sitemap: ${sitemapPath}`);
const urls = extractSitemapUrls(readFileSync(sitemapPath, "utf8"), siteOrigin);
const outputDirectory = path.dirname(sitemapPath);

if (seedProduction) {
  const productionHashes = {};
  for (const url of urls) {
    const response = await fetch(url, { headers: { "user-agent": "TungPhat-IndexNow-StateSeeder/1.0 (+https://mdftungphat.com/)" }, signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error(`Cannot seed IndexNow state: ${url} returned ${response.status}.`);
    productionHashes[url] = createHash("sha256").update(normalizeIndexNowHtml(await response.text())).digest("hex");
  }
  const seededAt = new Date().toISOString();
  writeFileSync(statePath, `${JSON.stringify({ schemaVersion: "2.0", urlHashes: productionHashes, seededAt, source: "current production before Phase 5 deployment", urlCount: urls.length }, null, 2)}\n`);
  console.log(`IndexNow state seeded from ${urls.length} current production URL(s).`);
  process.exit(0);
}

function outputFileFor(urlValue) {
  const pathname = new URL(urlValue).pathname;
  return pathname === "/" ? path.join(outputDirectory, "index.html") : path.join(outputDirectory, pathname, "index.html");
}

const current = Object.fromEntries(urls.map((url) => {
  const file = outputFileFor(url);
  if (!existsSync(file)) throw new Error(`Missing built canonical HTML for IndexNow hash: ${file}`);
  return [url, createHash("sha256").update(normalizeIndexNowHtml(readFileSync(file, "utf8"))).digest("hex")];
}));
const previousState = existsSync(statePath) ? JSON.parse(readFileSync(statePath, "utf8")) : null;
const previous = previousState?.urlHashes && typeof previousState.urlHashes === "object" ? previousState.urlHashes : {};
const delta = selectIndexNowDelta({ previous, current, force });
const checkedAt = new Date().toISOString();

if (delta.urlList.length === 0) {
  console.log("IndexNow skipped: no canonical URL content delta.");
  process.exit(0);
}

const payload = { host: new URL(siteOrigin).host, key: key ?? "", keyLocation: key ? `${siteOrigin}/indexnow-key.txt` : "", urlList: delta.urlList };
if (dryRun) {
  const evidence = { schemaVersion: "2.0", checkedAt, dryRun: true, reason: key ? "explicit dry run" : "INDEXNOW_KEY is not configured", changed: delta.changed, deleted: delta.deleted, urlCount: delta.urlList.length, response: null };
  writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(JSON.stringify(evidence, null, 2));
  process.exit(0);
}

const result = await submitIndexNow({ endpoint: "https://api.indexnow.org/indexnow", payload });
const evidence = { schemaVersion: "2.0", checkedAt, dryRun: false, changed: delta.changed, deleted: delta.deleted, urlCount: delta.urlList.length, response: result };
writeFileSync(statePath, `${JSON.stringify({ schemaVersion: "2.0", urlHashes: current, submittedAt: checkedAt, urlCount: urls.length }, null, 2)}\n`);
writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);
console.log(`IndexNow submitted ${delta.urlList.length} changed/deleted URL(s) after ${result.attempts} attempt(s), status ${result.status}.`);
