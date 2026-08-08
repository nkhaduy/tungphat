import fs from "node:fs";
import path from "node:path";
import { buildPhase5Report } from "../lib/phase5-report";

function readJson<T>(file: string): T {
  return JSON.parse(fs.readFileSync(file, "utf8")) as T;
}

function optional<T>(file: string): T | null {
  return fs.existsSync(file) ? readJson<T>(file) : null;
}

const crawlPath = process.env.PHASE5_CRAWL_PATH ?? "reports/production-crawl-phase5.json";
const benchmarkPath = process.env.PHASE5_BENCHMARK_PATH ?? "reports/ai-search-benchmark-phase5.json";
const crawl = optional<Record<string, number | unknown>>(crawlPath) ?? {};
const indexation = optional<{ summary?: { google?: Record<string, number>; bing?: Record<string, number> } }>("reports/indexation-observations.json");
const materials = readJson<{ materials: unknown[]; sources: unknown[] }>("data/materials/materials.json");
const entity = readJson<{ summary: { corroborated: number; mismatches: number } }>("reports/entity-graph.json");
const queryMap = readJson<{ entries: Array<{ currentStatus: string }> }>("data/query-url-map.json");
const performance = optional<{ samples: unknown[]; median: unknown }>("reports/phase5-lighthouse.json") ?? { samples: [], median: null };
const verification = optional<Record<string, unknown>>("reports/phase5-verification.json") ?? {};
const indexNow = optional<unknown>("reports/indexnow-delta.json");
const benchmark = optional<unknown>(benchmarkPath);
const count = (status: string) => queryMap.entries.filter((entry) => entry.currentStatus === status).length;
const blockers = [
  "Google Search Console and Google Business Profile: BLOCKED_AUTH because no browser/account session was available.",
  "Bing Webmaster and Bing Places: BLOCKED_AUTH because no browser/account session was available.",
  "Official Facebook, business hours, reviews, machine model, fixed CNC formats/tolerances, stock and prices remain unverified.",
];

const report = buildPhase5Report({
  generatedAt: new Date().toISOString(),
  production: { sha: process.env.DEPLOYED_SHA ?? null, deploymentId: process.env.DEPLOYMENT_ID ?? null, status: process.env.DEPLOYMENT_STATUS ?? null },
  crawl,
  indexation,
  materials: { records: materials.materials.length, sources: materials.sources.length },
  entity: entity.summary,
  query: { covered: count("COVERED"), partial: count("PARTIAL"), gap: count("GAP"), shouldNotTarget: count("SHOULD_NOT_TARGET") },
  performance,
  indexNow,
  benchmark,
  verification,
  blockers,
});
const output = process.env.PHASE5_REPORT_OUTPUT ?? "reports/phase5-search-authority.json";
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
console.log(`Wrote ${output}`);
