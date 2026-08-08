import fs from "node:fs";
import path from "node:path";

function readJson<T>(file: string): T {
  return JSON.parse(fs.readFileSync(file, "utf8")) as T;
}

function readOptionalJson(file: string) {
  return fs.existsSync(file) ? readJson<Record<string, unknown>>(file) : null;
}

function latestMonitorPath() {
  return fs.readdirSync("reports").filter((file) => /^search-monitor-\d{4}-\d{2}-\d{2}\.json$/u.test(file)).sort().map((file) => path.join("reports", file)).at(-1) ?? null;
}

function countPublishedArticles() {
  return fs.readdirSync("content/articles").filter((file) => file.endsWith(".md")).filter((file) => {
    const source = fs.readFileSync(path.join("content/articles", file), "utf8");
    return /^draft:\s*false\s*$/mu.test(source) && /^noindex:\s*false\s*$/mu.test(source);
  }).length;
}

type CrawlReport = {
  indexable: number;
  directAnswerPages: number;
  verifiedDataPages: number;
  sourceProvenancePages: number;
  thinIndexablePages: number;
  canonicalErrors: number;
  schemaErrors: number;
  brokenLinks: number;
  aiCrawlerBlockers: number;
  botSimulation: unknown[];
  security?: unknown;
};
type QueryMap = { queryCount: number; entries: Array<{ currentStatus: string }> };
type EntityGraph = { summary: { corroborated: number }; records: Array<{ sourceType: string; branch: string | null; consistency: string; url: string | null }> };
type Monitor = { summary: { topCompetitors: unknown[]; [key: string]: unknown }; comparison: unknown; records: unknown[] };

const crawl = readJson<CrawlReport>("reports/production-crawl.json");
const queryMap = readJson<QueryMap>("data/query-url-map.json");
const entityGraph = readJson<EntityGraph>("reports/entity-graph.json");
const baseline = readJson<{ benchmark: unknown; searchActivation: { indexNow: unknown } }>("reports/search-visibility-baseline.json");
const materials = readJson<{ materials: unknown[]; sources: unknown[] }>("data/materials/materials.json");
const monitorPath = latestMonitorPath();
const monitor = monitorPath ? readJson<Monitor>(monitorPath) : null;
const gsc = readOptionalJson("reports/search-console-baseline.json");
const bing = readOptionalJson("reports/bing-search-baseline.json");

const report = {
  schemaVersion: "1.0",
  phase: "3",
  generatedAt: new Date().toISOString(),
  production: { url: "https://mdftungphat.com", deployedSha: process.env.DEPLOYED_SHA ?? null, deploymentId: process.env.DEPLOYMENT_ID ?? null, status: process.env.DEPLOYMENT_STATUS ?? null, liveVerification: process.env.LIVE_VERIFICATION ?? null },
  beforeAfter: {
    indexableUrls: { phase2: 15, phase3: crawl.indexable }, directAnswerPages: { phase2: 12, phase3: crawl.directAnswerPages }, verifiedDataPages: { phase2: 9, phase3: crawl.verifiedDataPages }, provenancePages: { phase2: 11, phase3: crawl.sourceProvenancePages }, materialRecords: { phase2: 6, phase3: materials.materials.length }, entityVerifiedConsistent: { phase2: 2, phase3: entityGraph.summary.corroborated }, thinIndexables: { phase2: 0, phase3: crawl.thinIndexablePages }, canonicalErrors: { phase2: 0, phase3: crawl.canonicalErrors }, schemaErrors: { phase2: 0, phase3: crawl.schemaErrors }, brokenLinks: { phase2: 0, phase3: crawl.brokenLinks }, aiCrawlerBlockers: { phase2: 0, phase3: crawl.aiCrawlerBlockers },
  },
  googleSearchConsole: gsc ?? { status: "BLOCKED_AUTH", property: null, sitemap: null, indexedUrls: null, queries: null, impressions: null, clicks: null, inspectedUrls: [], blocker: "No authenticated browser session or API credentials were available." },
  bing: bing ?? { webmasterStatus: "BLOCKED_AUTH", sitemap: null, indexNow: baseline.searchActivation.indexNow, indexedUrls: null, performanceBaseline: null, blocker: "No authenticated Bing Webmaster account was available." },
  localEntity: { googleBusiness: "BLOCKED_AUTH", googleMaps: entityGraph.records.filter((record) => record.sourceType === "maps").map((record) => ({ branch: record.branch, consistency: record.consistency, url: record.url })), bingPlaces: "AUTH_BLOCKED", facebook: "MISSING", zalo: "CONSISTENT", branchConsistency: entityGraph.records.filter((record) => record.branch).map((record) => ({ branch: record.branch, consistency: record.consistency })) },
  informationMoat: { materialRecords: materials.materials.length, provenanceSources: materials.sources.length, publishedReferenceCenter: true, materialReferenceCsv: "https://mdftungphat.com/material-reference.csv", searchMonitor: Boolean(monitor), searchMonitorReport: monitorPath, entityGraph: true, publishedArticles: countPublishedArticles(), fabricatedCases: 0 },
  contentGapClosure: { queryCount: queryMap.queryCount, covered: queryMap.entries.filter((entry) => entry.currentStatus === "COVERED").length, partial: queryMap.entries.filter((entry) => entry.currentStatus === "PARTIAL").length, gap: queryMap.entries.filter((entry) => entry.currentStatus === "GAP").length, shouldNotTarget: queryMap.entries.filter((entry) => entry.currentStatus === "SHOULD_NOT_TARGET").length, updatedUrls: ["/bai-viet/go-ghep-la-gi/", "/bai-viet/mdf-thuong-va-chong-am/", "/bai-viet/chuan-bi-file-cnc/", "/tham-chieu-vat-lieu/"] },
  searchBenchmark: { phase2: baseline.benchmark, phase3: monitor ? { ...monitor.summary, comparison: monitor.comparison, records: monitor.records } : null },
  topCompetitors: monitor?.summary.topCompetitors ?? [],
  verification: { lint: process.env.VERIFICATION_LINT ?? null, typecheck: process.env.VERIFICATION_TYPECHECK ?? null, tests: process.env.VERIFICATION_TESTS ?? null, cms: process.env.VERIFICATION_CMS ?? null, build: process.env.VERIFICATION_BUILD ?? null, e2e: process.env.VERIFICATION_E2E ?? null, productionCrawl: crawl, schema: crawl.schemaErrors === 0, internalLinks: crawl.brokenLinks === 0, lighthouse: readOptionalJson("reports/lighthouse-mobile.json"), botAccess: crawl.botSimulation, security: crawl.security ?? null },
  unresolvedBlockers: ["GSC/Google Business Profile authentication unavailable in Codex browser session.", "Bing Webmaster/Bing Places authentication unavailable in Codex browser session.", "Official Facebook profile, review data and exact hours remain unverified.", "Technical product dimensions, thicknesses, machine limits, file formats and tolerance remain null until primary evidence is supplied."],
};
fs.writeFileSync("reports/phase3-search-authority.json", `${JSON.stringify(report, null, 2)}\n`);
console.log(`Wrote reports/phase3-search-authority.json from ${monitorPath ?? "no monitor"}`);
