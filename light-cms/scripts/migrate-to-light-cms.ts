import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { analyzeSource } from "./analyze-source";
import { buildMigrationSql } from "./build-migration-sql";
import { assertStagingResources } from "./guard-environment";

const args = new Set(process.argv.slice(2)); const apply = args.has("--apply"); const staging = args.has("--environment") && process.argv.includes("staging"); const mediaOnly = args.has("--media-only"); const databaseOnly = args.has("--database-only");
const root = path.resolve(import.meta.dirname, "../.."); const output = path.join(root, "light-cms/output/migration"); fs.mkdirSync(output, { recursive: true });
const analysis = analyzeSource(root); if (analysis.issues.length) throw new Error(`Source analysis failed: ${analysis.issues.join("; ")}`);
fs.writeFileSync(path.join(output, "analysis.json"), JSON.stringify(analysis, null, 2)); fs.writeFileSync(path.join(output, "migration.sql"), buildMigrationSql(analysis)); fs.writeFileSync(path.join(output, "media-manifest.json"), JSON.stringify(analysis.media, null, 2));
if (!apply) { console.log(`Light CMS migration dry-run: ${analysis.records.length} records, ${analysis.settings.length} settings, ${analysis.media.length} media`); process.exit(0); }
if (!staging) throw new Error("Remote writes require --apply --environment staging");
const resources = { environment: "staging", worker: "tungphat-light-cms-api-20260805-0855-staging", pages: "tungphat-light-cms-20260805-0855-staging", d1: "tungphat-light-cms-20260805-0855-staging", r2: "tungphat-light-media-20260805-0855-staging" }; assertStagingResources(resources);
const wrangler = path.join(root, "light-cms/node_modules/.bin/wrangler"); const config = path.join(root, "light-cms/wrangler.worker.jsonc");
if (!mediaOnly) execFileSync(wrangler, ["d1", "execute", resources.d1, "--remote", "--config", config, "--file", path.join(output, "migration.sql")], { stdio: "inherit" });
if (!databaseOnly) for (const media of analysis.media) execFileSync(wrangler, ["r2", "object", "put", `${resources.r2}/migrated${media.publicPath}`, "--remote", "--file", path.join(root, media.sourcePath), "--content-type", media.mimeType], { stdio: "inherit" });
console.log("Light CMS staging migration apply complete");
