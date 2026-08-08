import fs from "node:fs";
import { classifyPublicObservation, type PublicIndexationObservation } from "../lib/indexation-observation";
import { parseBingRss } from "../lib/search-benchmark";

const origin = (process.env.PRODUCTION_ORIGIN ?? "https://mdftungphat.com").replace(/\/$/u, "");
const outputPath = process.env.INDEXATION_OBSERVATION_OUTPUT ?? "reports/indexation-observations.json";

function sitemapUrls(xml: string) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/giu)].map((match) => match[1].trim());
}

function googleResultUrls(html: string) {
  if (/enable javascript|retry|unusual traffic|consent\.google/iu.test(html)) return null;
  const links = [...html.matchAll(/href="(?:\/url\?q=)?(https?:\/\/[^"&]+)[^"\s]*"/giu)].map((match) => decodeURIComponent(match[1]));
  return links.length ? [...new Set(links)] : null;
}

async function observe(url: string, checkedAt: string) {
  const query = `site:mdftungphat.com "${new URL(url).pathname}"`;
  const [google, bing] = await Promise.all([
    fetch(`https://www.google.com/search?q=${encodeURIComponent(query)}`, { headers: { "user-agent": "Mozilla/5.0 (compatible; TungPhat-IndexationObserver/1.0)", accept: "text/html" }, signal: AbortSignal.timeout(15000) }).then(async (response) => ({ status: response.status, urls: googleResultUrls(await response.text()) })).catch(() => ({ status: 0, urls: null })),
    fetch(`https://www.bing.com/search?format=rss&count=10&q=${encodeURIComponent(query)}`, { headers: { "user-agent": "TungPhat-IndexationObserver/1.0 (+https://mdftungphat.com/)", accept: "application/rss+xml" }, signal: AbortSignal.timeout(15000) }).then(async (response) => ({ status: response.status, urls: response.ok ? parseBingRss(await response.text()).map((item) => item.url) : null })).catch(() => ({ status: 0, urls: null })),
  ]);
  return [
    classifyPublicObservation({ engine: "GOOGLE", targetUrl: url, responseStatus: google.status, resultUrls: google.urls, checkedAt }),
    classifyPublicObservation({ engine: "BING", targetUrl: url, responseStatus: bing.status, resultUrls: bing.urls, checkedAt }),
  ];
}

const checkedAt = new Date().toISOString();
const sitemapResponse = await fetch(`${origin}/sitemap.xml`, { signal: AbortSignal.timeout(15000) });
if (!sitemapResponse.ok) throw new Error(`Production sitemap returned ${sitemapResponse.status}.`);
const urls = sitemapUrls(await sitemapResponse.text());
const observations: PublicIndexationObservation[] = [];
for (const url of urls) {
  observations.push(...await observe(url, checkedAt));
  await new Promise((resolve) => setTimeout(resolve, 250));
}
const count = (engine: "GOOGLE" | "BING", state: string) => observations.filter((item) => item.engine === engine && item.state === state).length;
const report = {
  schemaVersion: "1.0",
  checkedAt,
  sitemap: { url: `${origin}/sitemap.xml`, discovered: true, urlCount: urls.length },
  authentication: { google: "BLOCKED_AUTH", bing: "BLOCKED_AUTH" },
  confirmedIndexed: { google: null, bing: null },
  summary: {
    google: { observed: count("GOOGLE", "OBSERVED"), notObserved: count("GOOGLE", "NOT_OBSERVED"), unknown: count("GOOGLE", "UNKNOWN") },
    bing: { observed: count("BING", "OBSERVED"), notObserved: count("BING", "NOT_OBSERVED"), unknown: count("BING", "UNKNOWN") },
  },
  caveat: "Public search observation cannot confirm index status. NOT_OBSERVED is not NOT_INDEXED.",
  observations,
};
fs.mkdirSync("reports", { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ outputPath, sitemapUrls: urls.length, summary: report.summary }, null, 2));
