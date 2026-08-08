export type ProductionAssetStatuses = {
  robots: number;
  sitemap: number;
  knowledge: number;
  llms: number;
  indexNowKey: number;
  materialReference: number;
  cncPreflight: number;
};

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
  const missing = names.filter(([key]) => statuses[key] < 200 || statuses[key] >= 300).map(([, name]) => name);
  return { errors: missing.length, missing };
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
