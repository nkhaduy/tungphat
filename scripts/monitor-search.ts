import fs from "node:fs";
import path from "node:path";
import querySet from "../data/ai-search-query-set.json";
import { parseBingRss, selectBenchmarkQueries } from "../lib/search-benchmark";
import { parseHtmlSignals } from "../lib/live-seo-audit";
import { annotateSearchRecords, compareSearchReports, summarizeSearchRecords, type SearchMonitorRecord } from "../lib/search-monitor";

const origin = (process.env.PRODUCTION_ORIGIN ?? "https://mdftungphat.com").replace(/\/$/u, "");
const outputPath = process.env.SEARCH_MONITOR_OUTPUT ?? `reports/search-monitor-${new Date().toISOString().slice(0, 10)}.json`;
const limitation = "Public Bing RSS observation only; not a direct ChatGPT/Perplexity citation, ranking guarantee, or indexation guarantee.";

function readPreviousReport() {
  const directory = path.dirname(outputPath);
  const files = fs.existsSync(directory) ? fs.readdirSync(directory).filter((file) => /^search-monitor-\d{4}-\d{2}-\d{2}\.json$/u.test(file)).sort() : [];
  const previousPath = files.filter((file) => path.join(directory, file) !== outputPath).at(-1);
  if (previousPath) {
    const parsed = JSON.parse(fs.readFileSync(path.join(directory, previousPath), "utf8"));
    return { path: path.join(directory, previousPath), records: parsed.records as SearchMonitorRecord[] };
  }
  const baselinePath = path.join(directory, "ai-search-benchmark.json");
  if (!fs.existsSync(baselinePath)) return { path: null, records: [] };
  const baseline = JSON.parse(fs.readFileSync(baselinePath, "utf8"));
  return {
    path: baselinePath,
    records: (baseline.records ?? []).map((record: Record<string, unknown>) => ({
      ...record,
      searchAvailable: record.responseStatus === 200,
      directAiCitation: null,
      targetStatus: null,
      targetIndexable: null,
      targetAvailable: false,
      limitation,
    })) as SearchMonitorRecord[],
  };
}

async function inspectTarget(targetUrl: string) {
  const route = targetUrl.split("#")[0] || "/";
  try {
    const response = await fetch(`${origin}${route}`, { headers: { accept: "text/html", "user-agent": "TungPhat-SearchMonitor/1.0 (+https://mdftungphat.com/)" }, signal: AbortSignal.timeout(15000) });
    const body = await response.text();
    const headers = Object.fromEntries(response.headers.entries());
    const signals = response.ok ? parseHtmlSignals(body, headers) : null;
    return { status: response.status, indexable: signals?.indexable ?? null, available: response.ok };
  } catch {
    return { status: null, indexable: null, available: false };
  }
}

async function inspectSearch(query: string) {
  try {
    const response = await fetch(`https://www.bing.com/search?format=rss&count=10&q=${encodeURIComponent(query)}`, { headers: { accept: "application/rss+xml,application/xml;q=0.9", "user-agent": "TungPhat-SearchMonitor/1.0 (+https://mdftungphat.com/)" }, signal: AbortSignal.timeout(15000) });
    const xml = await response.text();
    return { status: response.status, available: response.ok, results: response.ok ? parseBingRss(xml) : [] };
  } catch {
    return { status: 0, available: false, results: [] };
  }
}

async function main() {
  const checkedAt = new Date().toISOString();
  const runId = process.env.SEARCH_MONITOR_RUN_ID ?? `bing-rss-${checkedAt.replace(/[:.]/gu, "-")}`;
  const selected = selectBenchmarkQueries(querySet.queries);
  const previous = readPreviousReport();
  const records: SearchMonitorRecord[] = [];
  for (const query of selected) {
    const targetUrl = query.idealLandingUrl;
    const [search, target] = await Promise.all([
      inspectSearch(query.query),
      inspectTarget(targetUrl),
    ]);
    const results = search.results;
    const firstParty = results.findIndex((result) => {
      try { return new URL(result.url).hostname.replace(/^www\./u, "") === "mdftungphat.com"; } catch { return false; }
    });
    const competitorSources = [...new Set(results.map((result) => {
      try { return new URL(result.url).hostname.replace(/^www\./u, ""); } catch { return ""; }
    }).filter((host) => host && host !== "mdftungphat.com" && !host.endsWith("bing.com")))].slice(0, 10);
    records.push({ query: query.query, category: query.intent === "local" || query.intent === "cnc" ? "local-cnc" : query.intent as SearchMonitorRecord["category"], engine: "Bing Web Search RSS", checkedAt, responseStatus: search.status, searchAvailable: search.available, found: search.available && firstParty >= 0, sourcePosition: search.available && firstParty >= 0 ? firstParty + 1 : null, directAiCitation: null, targetUrl, targetStatus: target.status, targetIndexable: target.indexable, targetAvailable: target.available, competitorSources, limitation });
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  const annotatedRecords = annotateSearchRecords(records, previous.records, runId);
  const result = { schemaVersion: "2.0", runId, checkedAt, domain: querySet.domain, surface: "Bing Web Search RSS + public target inspection", queryCount: annotatedRecords.length, records: annotatedRecords, summary: summarizeSearchRecords(annotatedRecords), comparison: compareSearchReports(annotatedRecords, previous.records), previousReport: previous.path };
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify({ outputPath, queryCount: records.length, found: result.summary.foundCount, previousReport: previous.path, comparison: result.comparison }, null, 2));
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
