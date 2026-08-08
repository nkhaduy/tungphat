import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { extractSitemapUrls, shouldNotifyIndexNow, submitIndexNow } from "../lib/indexnow.ts";

const sitemapPath = process.env.INDEXNOW_SITEMAP_PATH ?? "out/sitemap.xml";
const statePath = process.env.INDEXNOW_STATE_PATH ?? ".indexnow-state.json";
const siteOrigin = "https://mdftungphat.com";
const key = process.env.INDEXNOW_KEY;
const force = process.argv.includes("--force");
const dryRun = process.argv.includes("--dry-run") || !key;

if (!existsSync(sitemapPath)) throw new Error(`Missing sitemap: ${sitemapPath}`);
const sitemap = readFileSync(sitemapPath, "utf8");
const urls = extractSitemapUrls(sitemap, siteOrigin);
const hash = createHash("sha256").update(sitemap).digest("hex");
const previousHash = existsSync(statePath) ? JSON.parse(readFileSync(statePath, "utf8")).hash : undefined;

if (!shouldNotifyIndexNow(previousHash, hash, force)) {
  console.log("IndexNow skipped: sitemap unchanged.");
  process.exit(0);
}

const payload = { host: new URL(siteOrigin).host, key: key ?? "", keyLocation: key ? `${siteOrigin}/indexnow-key.txt` : "", urlList: urls };
if (dryRun) {
  console.log(JSON.stringify({ dryRun: true, reason: key ? "explicit dry run" : "INDEXNOW_KEY is not configured", urlCount: urls.length, hash }, null, 2));
  process.exit(0);
}

const result = await submitIndexNow({ endpoint: "https://api.indexnow.org/indexnow", payload });
writeFileSync(statePath, JSON.stringify({ hash, submittedAt: new Date().toISOString(), urlCount: urls.length }) + "\n");
console.log(`IndexNow submitted ${urls.length} URLs after ${result.attempts} attempt(s), status ${result.status}.`);
