import fs from "node:fs";
import path from "node:path";
import querySet from "../data/ai-search-query-set.json";
import { buildQueryUrlMap } from "../lib/query-url-map";
import { parseBingRss, selectBenchmarkQueries } from "../lib/search-benchmark";

async function main() {
const outputPath = process.env.AI_BENCHMARK_OUTPUT ?? "reports/ai-search-benchmark.json";
const checkedAt = new Date().toISOString();
const selected = selectBenchmarkQueries(querySet.queries);
const map = new Map(buildQueryUrlMap(querySet.queries).map((entry) => [entry.query, entry]));
const records: Array<{ query: string; category: string; engine: string; checkedAt: string; responseStatus: number; found: boolean; sourcePosition: number | null; citedOrSource: boolean; targetUrl: string; competitorSources: string[]; limitation: string }> = [];
for (const query of selected) {
  const response = await fetch(`https://www.bing.com/search?format=rss&count=10&q=${encodeURIComponent(query.query)}`, { headers: { "user-agent": "TungPhat-SEO-Benchmark/1.0 (+https://mdftungphat.com/)", accept: "application/rss+xml,application/xml;q=0.9" } });
  const xml = await response.text();
  const results = response.ok ? parseBingRss(xml) : [];
  const firstParty = results.findIndex((result) => {
    try { return new URL(result.url).hostname === "mdftungphat.com"; } catch { return false; }
  });
  const competitorSources = [...new Set(results.map((result) => {
    try { return new URL(result.url).hostname.replace(/^www\./u, ""); } catch { return ""; }
  }).filter((host) => host && host !== "mdftungphat.com" && !host.endsWith("bing.com")))].slice(0, 10);
  records.push({ query: query.query, category: query.benchmarkCategory, engine: "Bing Web Search RSS", checkedAt, responseStatus: response.status, found: firstParty >= 0, sourcePosition: firstParty >= 0 ? firstParty + 1 : null, citedOrSource: firstParty >= 0, targetUrl: map.get(query.query)?.targetUrl ?? query.idealLandingUrl, competitorSources, limitation: "Public web search source observation; not a direct AI-answer citation and not a ranking guarantee." });
  await new Promise((resolve) => setTimeout(resolve, 250));
}
const result = { schemaVersion: "1.0", checkedAt, domain: querySet.domain, surface: "Bing Web Search RSS", queryCount: records.length, records };
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify({ outputPath, queryCount: records.length, found: records.filter((record) => record.found).length }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
