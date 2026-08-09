import fs from "node:fs";
import path from "node:path";
import { findFirstPartyPosition, parseGoogleResultUrls } from "../lib/phase7-evidence";
import { parseBingRss } from "../lib/search-benchmark";

const queries = [
  { query: "Tùng Phát", class: "brand" },
  { query: "Gỗ Tùng Phát", class: "brand" },
  { query: "mdftungphat", class: "brand" },
  { query: "Công ty TNHH TMDV Gỗ Tùng Phát", class: "brand" },
  { query: "0909 259 160", class: "brand" },
  { query: "Tùng Phát Tam Bình", class: "local" },
  { query: "Tùng Phát Thủ Đức", class: "local" },
  { query: "MDF Tam Bình", class: "local" },
  { query: "CNC Tam Bình", class: "local" },
  { query: "cắt CNC MDF Thủ Đức", class: "long-tail" },
  { query: "cắt CNC gỗ Thủ Đức", class: "long-tail" },
  { query: "mua MDF Thủ Đức", class: "long-tail" },
  { query: "chuẩn bị file cắt CNC gỗ", class: "long-tail" },
  { query: "MDF thường và chống ẩm khác gì", class: "long-tail" },
  { query: "gỗ ghép là gì", class: "long-tail" },
] as const;

async function fetchGoogle(query: string) {
  try {
    const response = await fetch(`https://www.google.com/search?q=${encodeURIComponent(query)}`, {
      headers: { "user-agent": "Mozilla/5.0 (compatible; TungPhat-Phase7-SearchObserver/1.0)", accept: "text/html" },
      signal: AbortSignal.timeout(15000),
    });
    const html = await response.text();
    const urls = parseGoogleResultUrls(html);
    return { status: response.status, available: urls !== null, position: urls ? findFirstPartyPosition(urls, "mdftungphat.com") : null, urls: urls ?? [] };
  } catch {
    return { status: 0, available: false, position: null, urls: [] };
  }
}

async function fetchBing(query: string) {
  try {
    const response = await fetch(`https://www.bing.com/search?format=rss&count=10&q=${encodeURIComponent(query)}`, {
      headers: { "user-agent": "TungPhat-Phase7-SearchObserver/1.0 (+https://mdftungphat.com/)", accept: "application/rss+xml" },
      signal: AbortSignal.timeout(15000),
    });
    const results = response.ok ? parseBingRss(await response.text()) : [];
    return { status: response.status, available: response.ok, position: findFirstPartyPosition(results.map((result) => result.url), "mdftungphat.com"), urls: results.map((result) => result.url) };
  } catch {
    return { status: 0, available: false, position: null, urls: [] };
  }
}

async function main() {
  const checkedAt = new Date().toISOString();
  const records = [];
  for (const item of queries) {
    const [google, bing] = await Promise.all([fetchGoogle(item.query), fetchBing(item.query)]);
    records.push({
      query: item.query,
      class: item.class,
      checkedAt,
      google: { ...google, found: google.position !== null },
      bing: { ...bing, found: bing.position !== null },
      limitation: "Public search observation only; not authenticated indexation, ranking, AI retrieval, or AI citation evidence.",
    });
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  const result = {
    schemaVersion: "1.0",
    checkedAt,
    domain: "mdftungphat.com",
    queryCount: records.length,
    summary: {
      googleBrandFound: records.filter((record) => record.class === "brand" && record.google.found).length,
      bingBrandFound: records.filter((record) => record.class === "brand" && record.bing.found).length,
      googleLongTailFound: records.filter((record) => record.class === "long-tail" && record.google.found).length,
      bingLongTailFound: records.filter((record) => record.class === "long-tail" && record.bing.found).length,
      googleLocalFound: records.filter((record) => record.class === "local" && record.google.found).length,
      bingLocalFound: records.filter((record) => record.class === "local" && record.bing.found).length,
    },
    records,
  };
  const outputPath = process.env.PHASE7_SEARCH_PRESENCE_OUTPUT ?? "reports/phase7-search-presence.json";
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify({ outputPath, ...result.summary }, null, 2));
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
