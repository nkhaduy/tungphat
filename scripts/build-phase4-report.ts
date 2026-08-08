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

type CrawlReport = {
  indexable?: number;
  directAnswerPages?: number;
  verifiedDataPages?: number;
  sourceProvenancePages?: number;
  thinIndexablePages?: number;
  canonicalErrors?: number;
  schemaErrors?: number;
  brokenLinks?: number;
  aiCrawlerBlockers?: number;
  botSimulation?: unknown[];
  security?: unknown;
};
type QueryMap = { queryCount: number; entries: Array<{ currentStatus: string; targetUrl: string }> };
type EntityGraph = { summary: { corroborated?: number; [key: string]: unknown }; records: unknown[] };
type Baseline = { searchActivation?: { indexNow?: unknown }; benchmark?: unknown };
type Monitor = { summary?: { citedCount?: number | null; [key: string]: unknown }; comparison?: unknown; records?: unknown[] };

const output = process.env.PHASE4_REPORT_OUTPUT ?? "reports/phase4-search-growth.json";
const crawl = readJson<CrawlReport>("reports/production-crawl.json");
const queryMap = readJson<QueryMap>("data/query-url-map.json");
const materials = readJson<{ materials: unknown[]; sources: unknown[] }>("data/materials/materials.json");
const entityGraph = readJson<EntityGraph>("reports/entity-graph.json");
const baseline = readJson<Baseline>("reports/search-visibility-baseline.json");
const monitorPath = latestMonitorPath();
const monitor = monitorPath ? readJson<Monitor>(monitorPath) : null;
const performance = {
  before: { mobileScore: 78, lcpMs: 4500, fcpMs: 2850, cls: 0, tbtMs: 126, ttfbMs: 37 },
  after: {
    mobileScore: process.env.LIGHTHOUSE_MOBILE_SCORE ? Number(process.env.LIGHTHOUSE_MOBILE_SCORE) : null,
    lcpMs: process.env.LIGHTHOUSE_LCP_MS ? Number(process.env.LIGHTHOUSE_LCP_MS) : null,
    fcpMs: process.env.LIGHTHOUSE_FCP_MS ? Number(process.env.LIGHTHOUSE_FCP_MS) : null,
    cls: process.env.LIGHTHOUSE_CLS ? Number(process.env.LIGHTHOUSE_CLS) : null,
    tbtMs: process.env.LIGHTHOUSE_TBT_MS ? Number(process.env.LIGHTHOUSE_TBT_MS) : null,
    ttfbMs: process.env.LIGHTHOUSE_TTFB_MS ? Number(process.env.LIGHTHOUSE_TTFB_MS) : null,
    lcpElement: "/images/cnc-service-home.webp",
    rootCause: "Render/main-thread delay; analytics was deferred from afterInteractive to lazyOnload.",
  },
};

const report = {
  schemaVersion: "1.0",
  phase: "4",
  generatedAt: new Date().toISOString(),
  production: {
    url: "https://mdftungphat.com",
    deployedSha: process.env.DEPLOYED_SHA ?? null,
    deploymentId: process.env.DEPLOYMENT_ID ?? null,
    status: process.env.DEPLOYMENT_STATUS ?? null,
    customDomain: "https://mdftungphat.com",
    liveVerification: process.env.LIVE_VERIFICATION ?? null,
  },
  performance,
  seoGeo: {
    indexableUrls: crawl.indexable ?? null,
    directAnswerPages: crawl.directAnswerPages ?? null,
    verifiedDataPages: crawl.verifiedDataPages ?? null,
    provenancePages: crawl.sourceProvenancePages ?? null,
    materialRecords: materials.materials.length,
    entityVerifiedConsistent: entityGraph.summary.corroborated ?? null,
    thinIndexables: crawl.thinIndexablePages ?? null,
    canonicalErrors: crawl.canonicalErrors ?? null,
    schemaErrors: crawl.schemaErrors ?? null,
    brokenLinks: crawl.brokenLinks ?? null,
    aiCrawlerBlockers: crawl.aiCrawlerBlockers ?? null,
  },
  informationMoat: {
    materialRecordsAdded: 0,
    materialRecords: materials.materials.length,
    provenanceSources: materials.sources.length,
    cncPreflightChecks: 12,
    downloadableResources: ["https://mdftungphat.com/material-reference.csv", "https://mdftungphat.com/cnc-preflight-checklist.csv"],
    publishedArticles: 3,
    fabricatedCases: 0,
    catalogueDiscovery: { importedCandidates: null, publicRecordsAdded: 0, status: "EDITORIAL_REVIEW_REQUIRED" },
  },
  queryMap: {
    queryCount: queryMap.queryCount,
    covered: queryMap.entries.filter((entry) => entry.currentStatus === "COVERED").length,
    partial: queryMap.entries.filter((entry) => entry.currentStatus === "PARTIAL").length,
    gap: queryMap.entries.filter((entry) => entry.currentStatus === "GAP").length,
    shouldNotTarget: queryMap.entries.filter((entry) => entry.currentStatus === "SHOULD_NOT_TARGET").length,
    modifiedUrls: ["/san-pham/", "/gia-cong-cnc/", "/cat-cnc-go/", "/van-go-cong-nghiep/"],
  },
  authentication: {
    googleSearchConsole: readOptionalJson("reports/search-console-baseline.json") ?? { status: "BLOCKED_AUTH", property: null, sitemap: null, indexedUrls: null, queries: null, impressions: null, clicks: null, inspectedUrls: [], blocker: "No authenticated browser session or API credentials were available." },
    bingWebmaster: readOptionalJson("reports/bing-search-baseline.json") ?? { status: "BLOCKED_AUTH", sitemap: null, indexedUrls: null, performanceBaseline: null, blocker: "No authenticated Bing Webmaster account was available." },
    googleBusinessProfile: { status: "BLOCKED_AUTH", branches: null },
    bingPlaces: { status: "AUTH_BLOCKED" },
    facebook: { status: "MISSING", url: null },
    zalo: { status: "CONSISTENT", url: "https://zalo.me/0909259160" },
  },
  entityCorroboration: { summary: entityGraph.summary, records: entityGraph.records },
  indexNow: baseline.searchActivation?.indexNow ?? null,
  searchBenchmark: {
    phase2: baseline.benchmark ?? null,
    phase4: monitor ? { summary: monitor.summary, comparison: monitor.comparison, records: monitor.records } : null,
    directAiCitationsObserved: monitor?.summary?.citedCount ?? null,
  },
  verification: {
    lint: process.env.VERIFICATION_LINT ?? null,
    typecheck: process.env.VERIFICATION_TYPECHECK ?? null,
    appTests: process.env.VERIFICATION_TESTS ?? null,
    cms: process.env.VERIFICATION_CMS ?? null,
    build: process.env.VERIFICATION_BUILD ?? null,
    e2e: process.env.VERIFICATION_E2E ?? null,
    productionCrawl: crawl,
    schema: crawl.schemaErrors === 0,
    internalLinks: crawl.brokenLinks === 0,
    lighthouse: performance.after,
    botAccess: crawl.botSimulation ?? null,
    security: crawl.security ?? null,
  },
  blockers: [
    "GSC/Google Business Profile authentication unavailable in Codex browser session.",
    "Bing Webmaster/Bing Places authentication unavailable in Codex browser session.",
    "Official Facebook profile, review data and exact business hours remain unverified.",
    "Technical product dimensions, thicknesses, machine limits, file formats and tolerance remain null until primary evidence is supplied.",
  ],
};

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
console.log(`Wrote ${output}`);
