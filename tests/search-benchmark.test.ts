import { describe, expect, it } from "vitest";
import querySet from "@/data/ai-search-query-set.json";
import { parseBingRss, selectBenchmarkQueries } from "@/lib/search-benchmark";

describe("public search benchmark", () => {
  it("selects 10 queries for each required benchmark category", () => {
    const sample = selectBenchmarkQueries(querySet.queries);
    const counts = sample.reduce<Record<string, number>>((result, entry) => {
      result[entry.benchmarkCategory] = (result[entry.benchmarkCategory] ?? 0) + 1;
      return result;
    }, {});

    expect(sample).toHaveLength(40);
    expect(counts).toEqual({ commercial: 10, informational: 10, comparison: 10, "local-cnc": 10 });
  });

  it("parses observable organic result titles and URLs from Bing RSS", () => {
    const xml = "<rss><channel><item><title>Tùng Phát</title><link>https://mdftungphat.com/van-mdf/</link><description>MDF</description></item><item><title>Competitor</title><link>https://example.com/mdf</link><description>Other</description></item></channel></rss>";
    expect(parseBingRss(xml)).toEqual([
      { title: "Tùng Phát", url: "https://mdftungphat.com/van-mdf/", description: "MDF" },
      { title: "Competitor", url: "https://example.com/mdf", description: "Other" },
    ]);
  });
});
