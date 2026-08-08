import fs from "node:fs";
import path from "node:path";
import { fetchAuditResource } from "../lib/http-audit";
import { parseHtmlSignals } from "../lib/live-seo-audit";
import { evaluateProductionAssets, evaluateProductionQualityGates, evaluateSecurityHeaders } from "../lib/production-audit";

const origin = (process.env.PRODUCTION_ORIGIN ?? "https://mdftungphat.com").replace(/\/$/u, "");
const outputPath = process.env.PRODUCTION_AUDIT_JSON ?? "reports/production-crawl.json";
const userAgents = {
  browser: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126 Safari/537.36",
  googlebot: "Googlebot/2.1 (+http://www.google.com/bot.html)",
  googlebotSmartphone: "Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 Chrome/126 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
  bingbot: "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)",
  oaiSearchBot: "OAI-SearchBot/1.0",
  chatgptUser: "ChatGPT-User/1.0",
  gptBot: "GPTBot/1.2",
  perplexityBot: "PerplexityBot/1.0",
};

function normalizeRoute(value: string) {
  const url = new URL(value, origin);
  const route = url.pathname.replace(/\/{2,}/gu, "/");
  return route === "/" ? "/" : `/${route.replace(/^\/+|\/+$/gu, "")}/`;
}

function canonicalOk(value: string, route: string) {
  try {
    const url = new URL(value);
    return url.origin === origin && url.protocol === "https:" && !url.search && !url.hash && normalizeRoute(url.pathname) === route;
  } catch {
    return false;
  }
}

function visibleTextLength(html: string) {
  const body = html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/iu)?.[1] ?? html;
  return body.replace(/<script\b[\s\S]*?<\/script>/giu, " ").replace(/<style\b[\s\S]*?<\/style>/giu, " ").replace(/<[^>]+>/gu, " ").replace(/\s+/gu, " ").trim().length;
}

async function main() {
const [robotsResponse, sitemapResponse, knowledgeResponse, llmsResponse, indexNowKeyResponse, materialReferenceResponse, cncPreflightResponse] = await Promise.all([
  fetchAuditResource(`${origin}/robots.txt`, userAgents.browser),
  fetchAuditResource(`${origin}/sitemap.xml`, userAgents.browser),
  fetchAuditResource(`${origin}/knowledge.json`, userAgents.browser),
  fetchAuditResource(`${origin}/llms.txt`, userAgents.browser),
  fetchAuditResource(`${origin}/indexnow-key.txt`, userAgents.browser),
  fetchAuditResource(`${origin}/material-reference.csv`, userAgents.browser),
  fetchAuditResource(`${origin}/cnc-preflight-checklist.csv`, userAgents.browser),
]);
const sitemapUrls = [...sitemapResponse.body.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/giu)].map((match) => match[1].trim());
const routes = [...new Set(sitemapUrls.map(normalizeRoute))];
const pages: Array<{ route: string; url: string; status: number; location: string | null; body: string; headers: Record<string, string>; signals: ReturnType<typeof parseHtmlSignals> | null }> = [];
for (const route of routes) {
  const response = await fetchAuditResource(`${origin}${route}`, userAgents.browser);
  pages.push({ route, url: `${origin}${route}`, ...response, signals: response.status >= 200 && response.status < 300 ? parseHtmlSignals(response.body, response.headers) : null });
}

const indexable = pages.filter((page) => page.signals?.indexable);
const noindex = pages.filter((page) => page.signals && !page.signals.indexable);
const titleCounts = new Map<string, number>();
const descriptionCounts = new Map<string, number>();
indexable.forEach(({ signals }) => {
  if (signals?.title) titleCounts.set(signals.title, (titleCounts.get(signals.title) ?? 0) + 1);
  if (signals?.description) descriptionCounts.set(signals.description, (descriptionCounts.get(signals.description) ?? 0) + 1);
});
const duplicateCount = (counts: Map<string, number>) => [...counts.values()].filter((count) => count > 1).length;
const knownRoutes = new Set(pages.map((page) => page.route));
const inbound = new Map(pages.map((page) => [page.route, 0]));
const linkedRoutes = new Set(pages.flatMap((page) => page.signals?.internalLinks ?? []).map(normalizeRoute));
const extraRoutes = [...linkedRoutes].filter((route) => !knownRoutes.has(route));
const extraLinkChecks: Array<{ route: string; status: number; location: string | null }> = [];
for (const route of extraRoutes) {
  const response = await fetchAuditResource(`${origin}${route}`, userAgents.browser);
  extraLinkChecks.push({ route, status: response.status, location: response.location });
}
const brokenLinks = extraLinkChecks.filter((link) => link.status >= 400);
const redirectLinks = extraLinkChecks.filter((link) => link.status >= 300 && link.status < 400);
pages.forEach((page) => (page.signals?.internalLinks ?? []).forEach((href) => {
  const route = normalizeRoute(href);
  if (inbound.has(route)) inbound.set(route, (inbound.get(route) ?? 0) + 1);
}));
const sitemapErrors = sitemapResponse.status !== 200
  ? 1
  : sitemapUrls.length !== new Set(sitemapUrls).size
    ? 1
    : sitemapUrls.filter((url, index) => !url.startsWith(`${origin}/`) || !url.endsWith("/") || !canonicalOk(url, normalizeRoute(url)) || pages[index]?.status !== 200).length;

const bots = [];
for (const [name, userAgent] of Object.entries(userAgents)) {
  if (name === "browser") continue;
  const response = await fetchAuditResource(`${origin}/`, userAgent);
  const signals = response.status >= 200 && response.status < 300 ? parseHtmlSignals(response.body, response.headers) : null;
  bots.push({ bot: name, userAgent, status: response.status, location: response.location, contentReadable: Boolean(signals?.title && signals?.canonical), indexable: signals?.indexable ?? false, blocked: response.status < 200 || response.status >= 400 || !signals?.title || /challenge|captcha|access denied/iu.test(response.body) });
}

const statusCounts = pages.reduce<Record<string, number>>((counts, page) => {
  const key = `${Math.floor(page.status / 100)}xx`;
  counts[key] = (counts[key] ?? 0) + 1;
  return counts;
}, {});
const assetEvidence = (response: typeof robotsResponse) => ({
  status: response.status,
  contentType: response.headers["content-type"] ?? null,
  body: response.body,
});
const productionAssets = evaluateProductionAssets({
  robots: assetEvidence(robotsResponse),
  sitemap: assetEvidence(sitemapResponse),
  knowledge: assetEvidence(knowledgeResponse),
  llms: assetEvidence(llmsResponse),
  indexNowKey: assetEvidence(indexNowKeyResponse),
  materialReference: assetEvidence(materialReferenceResponse),
  cncPreflight: assetEvidence(cncPreflightResponse),
});
const security = evaluateSecurityHeaders(pages.find((page) => page.route === "/")?.headers ?? {});
const canonicalErrors = indexable.filter((page) => !page.signals || !canonicalOk(page.signals.canonical, page.route)).length;
const schemaErrors = pages.reduce((sum, page) => sum + (page.signals?.schemaErrors ?? 0), 0);
const orphanPages = indexable.filter((page) => page.route !== "/" && (inbound.get(page.route) ?? 0) === 0).length;
const thinIndexablePages = indexable.filter((page) => visibleTextLength(page.body) < 200).length;
const aiCrawlerBlockers = bots.filter((bot) => bot.blocked).length;
const qualityGateFailures = evaluateProductionQualityGates({ canonicalErrors, schemaErrors, brokenLinks: brokenLinks.length, sitemapErrors, aiCrawlerBlockers, thinIndexablePages, orphanPages, retrievalAssetErrors: productionAssets.errors, securityErrors: security.errors });
const result = {
  checkedAt: new Date().toISOString(),
  origin,
  pagesChecked: pages.length,
  totalHtml: pages.filter((page) => page.signals).length,
  indexable: indexable.length,
  noindex: noindex.length,
  statusCounts,
  canonicalErrors,
  duplicateTitles: duplicateCount(titleCounts),
  duplicateDescriptions: duplicateCount(descriptionCounts),
  brokenLinks: brokenLinks.length,
  brokenLinkSamples: brokenLinks.slice(0, 20),
  redirectLinks: redirectLinks.slice(0, 20),
  orphanPages,
  thinIndexablePages,
  directAnswerPages: indexable.filter((page) => page.signals?.directAnswer).length,
  schemaErrors,
  structuredDataPages: indexable.filter((page) => (page.signals?.schemaCount ?? 0) > 0).length,
  verifiedDataPages: indexable.filter((page) => /nguồn tham chiếu|bảng tham chiếu|bộ dữ liệu/iu.test(page.body)).length,
  sourceProvenancePages: indexable.filter((page) => /nguồn|cập nhật dữ liệu|last verified|source/iu.test(page.body)).length,
  sitemap: { status: sitemapResponse.status, declaredInRobots: /sitemap:\s*https:\/\//iu.test(robotsResponse.body), urls: sitemapUrls.length, errors: sitemapErrors },
  retrievalAssets: {
    knowledgeJson: { status: knowledgeResponse.status, contentType: knowledgeResponse.headers["content-type"] ?? null },
    llmsTxt: { status: llmsResponse.status, contentType: llmsResponse.headers["content-type"] ?? null },
    indexNowKey: { status: indexNowKeyResponse.status, contentType: indexNowKeyResponse.headers["content-type"] ?? null },
    materialReference: { status: materialReferenceResponse.status, contentType: materialReferenceResponse.headers["content-type"] ?? null },
    cncPreflight: { status: cncPreflightResponse.status, contentType: cncPreflightResponse.headers["content-type"] ?? null },
    errors: productionAssets,
  },
  robots: { status: robotsResponse.status, body: robotsResponse.body, headers: robotsResponse.headers },
  botSimulation: bots,
  aiCrawlerBlockers,
  headers: pages.find((page) => page.route === "/")?.headers ?? {},
  security,
  qualityGateFailures,
};
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));
if (qualityGateFailures.length) {
  console.error(`Production SEO audit failed: ${qualityGateFailures.join(", ")}`);
  process.exitCode = 1;
}
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
