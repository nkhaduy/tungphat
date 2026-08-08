export type ProductionAssetStatuses = {
  robots: number | ProductionAssetResponse;
  sitemap: number | ProductionAssetResponse;
  knowledge: number | ProductionAssetResponse;
  llms: number | ProductionAssetResponse;
  indexNowKey: number | ProductionAssetResponse;
  materialReference: number | ProductionAssetResponse;
  cncPreflight: number | ProductionAssetResponse;
};

export type ProductionAssetResponse = {
  status: number;
  contentType?: string | null;
  body?: string;
};

function assetResponse(value: number | ProductionAssetResponse): ProductionAssetResponse {
  return typeof value === "number" ? { status: value } : value;
}

function validAssetBody(name: string, response: ProductionAssetResponse) {
  if (response.status < 200 || response.status >= 300) return false;
  if (!response.body || !response.contentType) return true;
  const contentType = response.contentType.toLowerCase();
  const body = response.body.trim();
  if (contentType.includes("text/html")) return false;
  if (name === "knowledge.json") {
    if (!contentType.includes("json")) return false;
    try { JSON.parse(body); return true; } catch { return false; }
  }
  if (name === "sitemap.xml") return contentType.includes("xml") && /<urlset\b|<sitemapindex\b/iu.test(body);
  if (name === "robots.txt") return contentType.includes("text/plain") && /user-agent\s*:/iu.test(body);
  if (name === "llms.txt") return contentType.includes("text/plain") && /tùng\s*phát|mdftungphat/iu.test(body);
  if (name === "indexnow-key.txt") return contentType.includes("text/plain") && /^[a-z0-9-]{8,128}$/iu.test(body);
  if (name.endsWith(".csv")) return (contentType.includes("csv") || contentType.includes("text/plain")) && body.includes(",") && body.includes("\n");
  return true;
}

export function evaluateProductionAssets(statuses: ProductionAssetStatuses) {
  const names: Array<[keyof ProductionAssetStatuses, string]> = [
    ["robots", "robots.txt"],
    ["sitemap", "sitemap.xml"],
    ["knowledge", "knowledge.json"],
    ["llms", "llms.txt"],
    ["indexNowKey", "indexnow-key.txt"],
    ["materialReference", "material-reference.csv"],
    ["cncPreflight", "cnc-preflight-checklist.csv"],
  ];
  const missing: string[] = [];
  const invalid: string[] = [];
  for (const [key, name] of names) {
    const response = assetResponse(statuses[key]);
    if (response.status < 200 || response.status >= 300) missing.push(name);
    else if (!validAssetBody(name, response)) invalid.push(name);
  }
  return invalid.length ? { errors: missing.length + invalid.length, missing, invalid } : { errors: missing.length, missing };
}

export function evaluateSecurityHeaders(headers: Record<string, string | undefined>) {
  const required: Array<[string, string]> = [
    ["content-security-policy", "Content-Security-Policy"],
    ["strict-transport-security", "Strict-Transport-Security"],
    ["x-content-type-options", "X-Content-Type-Options"],
    ["referrer-policy", "Referrer-Policy"],
    ["permissions-policy", "Permissions-Policy"],
  ];
  const missing = required.filter(([key]) => !headers[key]?.trim()).map(([, label]) => label);
  return { errors: missing.length, missing };
}

export function evaluateProductionQualityGates(metrics: {
  canonicalErrors: number;
  schemaErrors: number;
  brokenLinks: number;
  sitemapErrors: number;
  aiCrawlerBlockers: number;
  thinIndexablePages: number;
  orphanPages: number;
  retrievalAssetErrors: number;
  securityErrors: number;
}) {
  const checks: Array<[string, number]> = [
    ["canonicalErrors", metrics.canonicalErrors],
    ["schemaErrors", metrics.schemaErrors],
    ["brokenLinks", metrics.brokenLinks],
    ["sitemapErrors", metrics.sitemapErrors],
    ["aiCrawlerBlockers", metrics.aiCrawlerBlockers],
    ["thinIndexablePages", metrics.thinIndexablePages],
    ["orphanPages", metrics.orphanPages],
    ["retrievalAssets", metrics.retrievalAssetErrors],
    ["securityHeaders", metrics.securityErrors],
  ];
  return checks.filter(([, count]) => count > 0).map(([name]) => name);
}
