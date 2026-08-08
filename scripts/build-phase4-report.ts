import fs from "node:fs";
import path from "node:path";

function readJson<T>(file: string): T {
  return JSON.parse(fs.readFileSync(file, "utf8")) as T;
}

function readOptionalJson<T>(file: string | undefined): T | null {
  return file && fs.existsSync(file) ? readJson<T>(file) : null;
}

function countPublishedArticles() {
  const directory = "content/articles";
  if (!fs.existsSync(directory)) return 0;
  return fs.readdirSync(directory).filter((file) => {
    if (!file.endsWith(".md")) return false;
    const source = fs.readFileSync(path.join(directory, file), "utf8");
    return !/^draft:\s*true\s*$/imu.test(source) && !/^noindex:\s*true\s*$/imu.test(source);
  }).length;
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
type AuthenticationReport = { status?: string; [key: string]: unknown };
type CncChecklist = { items: unknown[]; sourceUrls?: string[] };

const output = process.env.PHASE4_REPORT_OUTPUT ?? "reports/phase4-search-growth.json";
const crawlPath = process.env.PHASE4_CRAWL_PATH;
const monitorPath = process.env.PHASE4_MONITOR_PATH;
const crawl = readOptionalJson<CrawlReport>(crawlPath);
const monitor = readOptionalJson<Monitor>(monitorPath);
const queryMap = readJson<QueryMap>("data/query-url-map.json");
const materials = readJson<{ materials: unknown[]; sources: unknown[] }>("data/materials/materials.json");
const cncChecklist = readJson<CncChecklist>("data/cnc-preflight-checklist.json");
const entityGraph = readJson<EntityGraph>("reports/entity-graph.json");
const baseline = readJson<Baseline>("reports/search-visibility-baseline.json");

const googleSearchConsole = readOptionalJson<AuthenticationReport>(process.env.GSC_BASELINE_PATH ?? "reports/search-console-baseline.json") ?? {
  status: "BLOCKED_AUTH",
  property: null,
  sitemap: null,
  indexedUrls: null,
  queries: null,
  impressions: null,
  clicks: null,
  inspectedUrls: [],
  blocker: "No authenticated browser session or API credentials were available.",
};
const bingWebmaster = readOptionalJson<AuthenticationReport>(process.env.BING_BASELINE_PATH ?? "reports/bing-search-baseline.json") ?? {
  status: "BLOCKED_AUTH",
  sitemap: null,
  indexedUrls: null,
  performanceBaseline: null,
  blocker: "No authenticated Bing Webmaster account was available.",
};
const googleBusinessProfile = { status: process.env.GBP_STATUS ?? "BLOCKED_AUTH", branches: null };
const bingPlaces = { status: process.env.BING_PLACES_STATUS ?? "BLOCKED_AUTH" };
const facebook = { status: process.env.FACEBOOK_STATUS ?? "MISSING", url: process.env.FACEBOOK_URL ?? null };
const zalo = { status: "CONSISTENT", url: "https://zalo.me/0909259160" };

const performance = {
  before: {
    mobileScore: 78,
    lcpMs: 4500,
    fcpMs: 2850,
    cls: 0,
    tbtMs: 126,
    ttfbMs: 37,
    source: "Phase 3 mobile Lighthouse lab baseline supplied in the Phase 4 source-of-truth.",
  },
  after: {
    mobileScore: process.env.LIGHTHOUSE_MOBILE_SCORE ? Number(process.env.LIGHTHOUSE_MOBILE_SCORE) : null,
    lcpMs: process.env.LIGHTHOUSE_LCP_MS ? Number(process.env.LIGHTHOUSE_LCP_MS) : null,
    fcpMs: process.env.LIGHTHOUSE_FCP_MS ? Number(process.env.LIGHTHOUSE_FCP_MS) : null,
    cls: process.env.LIGHTHOUSE_CLS ? Number(process.env.LIGHTHOUSE_CLS) : null,
    tbtMs: process.env.LIGHTHOUSE_TBT_MS ? Number(process.env.LIGHTHOUSE_TBT_MS) : null,
    ttfbMs: process.env.LIGHTHOUSE_TTFB_MS ? Number(process.env.LIGHTHOUSE_TTFB_MS) : null,
    lcpElement: "/images/cnc-service-home.webp",
    rootCause: "Render/main-thread delay dominated LCP; the LCP image itself was small, preloaded and transferred quickly.",
    source: process.env.LIGHTHOUSE_SOURCE ?? null,
  },
  fieldData: null,
};

const authentication = { googleSearchConsole, bingWebmaster, googleBusinessProfile, bingPlaces, facebook, zalo };
const blocked = (status: unknown) => status === "BLOCKED_AUTH" || status === "AUTH_BLOCKED";
const blockers: string[] = [];
if (blocked(googleSearchConsole.status) || blocked(googleBusinessProfile.status)) blockers.push("GSC/Google Business Profile authentication unavailable in Codex browser session.");
if (blocked(bingWebmaster.status) || blocked(bingPlaces.status)) blockers.push("Bing Webmaster/Bing Places authentication unavailable in Codex browser session.");
if (["MISSING", "UNVERIFIED"].includes(String(facebook.status))) blockers.push("Official Facebook profile remains unverified.");
if (JSON.stringify(materials.materials).includes("Chưa xác minh")) blockers.push("Technical product dimensions, thicknesses and richer catalogue specifications remain unverified and were left unpublished/null-equivalent.");
blockers.push("Exact CNC machine limits, supported file formats and tolerances remain unverified and were not published as facts.");

const downloadableResources = [
  ["public/material-reference.csv", "https://mdftungphat.com/material-reference.csv"],
  ["public/cnc-preflight-checklist.csv", "https://mdftungphat.com/cnc-preflight-checklist.csv"],
].filter(([file]) => fs.existsSync(file)).map(([, url]) => url);

const report = {
  schemaVersion: "1.1",
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
    indexableUrls: crawl?.indexable ?? null,
    directAnswerPages: crawl?.directAnswerPages ?? null,
    verifiedDataPages: crawl?.verifiedDataPages ?? null,
    provenancePages: crawl?.sourceProvenancePages ?? null,
    materialRecords: materials.materials.length,
    entityVerifiedConsistent: entityGraph.summary.corroborated ?? null,
    thinIndexables: crawl?.thinIndexablePages ?? null,
    canonicalErrors: crawl?.canonicalErrors ?? null,
    schemaErrors: crawl?.schemaErrors ?? null,
    brokenLinks: crawl?.brokenLinks ?? null,
    aiCrawlerBlockers: crawl?.aiCrawlerBlockers ?? null,
  },
  informationMoat: {
    materialRecordsAdded: Math.max(0, materials.materials.length - 6),
    materialRecords: materials.materials.length,
    provenanceSources: materials.sources.length,
    cncPreflightChecks: cncChecklist.items.length,
    cncPreflightSourceUrls: cncChecklist.sourceUrls?.length ?? 0,
    downloadableResources,
    publishedArticles: countPublishedArticles(),
    fabricatedCases: 0,
    catalogueDiscovery: { importedCandidates: null, publicRecordsAdded: Math.max(0, materials.materials.length - 6), status: "EDITORIAL_REVIEW_REQUIRED" },
  },
  queryMap: {
    queryCount: queryMap.queryCount,
    covered: queryMap.entries.filter((entry) => entry.currentStatus === "COVERED").length,
    partial: queryMap.entries.filter((entry) => entry.currentStatus === "PARTIAL").length,
    gap: queryMap.entries.filter((entry) => entry.currentStatus === "GAP").length,
    shouldNotTarget: queryMap.entries.filter((entry) => entry.currentStatus === "SHOULD_NOT_TARGET").length,
    modifiedUrls: ["/san-pham/", "/gia-cong-cnc/", "/cat-cnc-go/", "/van-go-cong-nghiep/"],
  },
  authentication,
  entityCorroboration: { summary: entityGraph.summary, records: entityGraph.records },
  indexNow: baseline.searchActivation?.indexNow ?? null,
  searchBenchmark: {
    phase2: baseline.benchmark ?? null,
    phase4: monitor ? { summary: monitor.summary, comparison: monitor.comparison, records: monitor.records, sourcePath: monitorPath } : null,
    directAiCitationsObserved: monitor?.summary?.citedCount ?? null,
  },
  verification: {
    lint: process.env.VERIFICATION_LINT ?? null,
    typecheck: process.env.VERIFICATION_TYPECHECK ?? null,
    appTests: process.env.VERIFICATION_TESTS ?? null,
    cms: process.env.VERIFICATION_CMS ?? null,
    build: process.env.VERIFICATION_BUILD ?? null,
    e2e: process.env.VERIFICATION_E2E ?? null,
    productionCrawl: crawl ? { ...crawl, sourcePath: crawlPath } : null,
    schema: crawl ? crawl.schemaErrors === 0 : null,
    internalLinks: crawl ? crawl.brokenLinks === 0 : null,
    lighthouse: performance.after,
    botAccess: crawl?.botSimulation ?? null,
    security: crawl?.security ?? null,
  },
  blockers,
};

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
console.log(`Wrote ${output}`);
