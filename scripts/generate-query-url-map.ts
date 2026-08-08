import fs from "node:fs";
import querySet from "../data/ai-search-query-set.json";
import { buildQueryUrlMap } from "../lib/query-url-map";

const output = process.env.QUERY_URL_MAP_OUTPUT ?? "data/query-url-map.json";
const entries = buildQueryUrlMap(querySet.queries);
fs.writeFileSync(output, `${JSON.stringify({ version: "1.0", generatedAt: "2026-08-08", domain: querySet.domain, queryCount: entries.length, entries }, null, 2)}\n`);
console.log(`Query URL map generated: ${entries.length} queries -> ${output}`);
