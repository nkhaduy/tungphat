export type SearchQuery = {
  query: string;
  intent: string;
  idealLandingUrl: string;
  [key: string]: unknown;
};

export type BenchmarkQuery = SearchQuery & { benchmarkCategory: "commercial" | "informational" | "comparison" | "local-cnc" };

export function selectBenchmarkQueries(queries: SearchQuery[]) {
  const buckets: Record<BenchmarkQuery["benchmarkCategory"], BenchmarkQuery[]> = { commercial: [], informational: [], comparison: [], "local-cnc": [] };
  queries.forEach((query) => {
    const benchmarkCategory = query.intent === "commercial" ? "commercial" : query.intent === "informational" ? "informational" : query.intent === "comparison" ? "comparison" : query.intent === "local" || query.intent === "cnc" ? "local-cnc" : null;
    if (benchmarkCategory && buckets[benchmarkCategory].length < 10) buckets[benchmarkCategory].push({ ...query, benchmarkCategory });
  });
  return Object.values(buckets).flat();
}

function decodeXml(value: string) {
  return value.replace(/&amp;/gu, "&").replace(/&lt;/gu, "<").replace(/&gt;/gu, ">").replace(/&quot;/gu, '"').replace(/&#39;/gu, "'");
}

export function parseBingRss(xml: string) {
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/giu)].map((match) => {
    const item = match[1];
    const value = (tag: string) => decodeXml(item.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "iu"))?.[1]?.trim() ?? "");
    return { title: value("title"), url: value("link"), description: value("description") };
  }).filter((item) => item.title && item.url);
}
