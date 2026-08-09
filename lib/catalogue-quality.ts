export type CatalogueQualityPage = {
  url: string;
  status: "PASS" | "FAIL";
  score: number;
  signals: Record<string, boolean>;
  issues: string[];
};

export type CatalogueQualityReport = {
  schemaVersion: "1.0";
  checkedAt: string;
  summary: { total: number; passed: number; failed: number };
  pages: CatalogueQualityPage[];
};

type AuditInput = {
  sitemapUrls: string[];
  readHtml: (url: string) => string;
  checkedAt?: string;
};

function normalizeUrl(value: string) {
  const url = new URL(value);
  url.hash = "";
  url.search = "";
  if (!url.pathname.endsWith("/")) url.pathname += "/";
  return url.toString();
}

function bodyText(html: string) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&(?:nbsp|amp|quot|lt|gt);/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasTag(html: string, tag: string) {
  return new RegExp(`<${tag}\\b`, "i").test(html);
}

function hasMeta(html: string, name: string) {
  return new RegExp(`<meta\\b[^>]*\\bname=["']${name}["'][^>]*\\bcontent=["'][^"']+`, "i").test(html)
    || new RegExp(`<meta\\b[^>]*\\bcontent=["'][^"']+["'][^>]*\\bname=["']${name}["']`, "i").test(html);
}

function hasCanonical(html: string, expectedUrl: string) {
  const match = html.match(/<link\b[^>]*\brel=["']canonical["'][^>]*\bhref=["']([^"']+)/i)
    ?? html.match(/<link\b[^>]*\bhref=["']([^"']+)["'][^>]*\brel=["']canonical["']/i);
  if (!match) return false;
  try {
    return normalizeUrl(match[1]) === expectedUrl;
  } catch {
    return false;
  }
}

export function auditCataloguePages({ sitemapUrls, readHtml, checkedAt = new Date().toISOString() }: AuditInput): CatalogueQualityReport {
  const urls = sitemapUrls.filter((url) => new URL(url).pathname.startsWith("/catalogue/"));
  const pages = urls.map((url): CatalogueQualityPage => {
    const canonicalUrl = normalizeUrl(url);
    const html = readHtml(url);
    const text = bodyText(html);
    const signals = {
      identifyingData: hasTag(html, "h1") && /<h1\b[^>]*>[^<\s][\s\S]*<\/h1>/i.test(html),
      metadata: hasTag(html, "title") && hasMeta(html, "description"),
      canonical: hasCanonical(html, canonicalUrl),
      visual: hasTag(html, "img"),
      provenance: /nguồn|nguon|source|supplier|official|chính thức|doi chieu/i.test(text),
      categoryContext: /aria-label=["']Breadcrumb|href=["']\/catalogue\//i.test(html),
      commercialUtility: /zalo\.me|tel:|data-track-event|bao-gia|lien-he/i.test(html),
      structuredData: /<script\b[^>]*type=["']application\/ld\+json["']/i.test(html),
    };
    const issues = Object.entries(signals)
      .filter(([, present]) => !present)
      .map(([name]) => `missing${name[0].toUpperCase()}${name.slice(1)}`);
    return {
      url: canonicalUrl,
      status: issues.length ? "FAIL" : "PASS",
      score: Object.values(signals).filter(Boolean).length,
      signals,
      issues,
    };
  });
  const passed = pages.filter((page) => page.status === "PASS").length;
  return {
    schemaVersion: "1.0",
    checkedAt,
    summary: { total: pages.length, passed, failed: pages.length - passed },
    pages,
  };
}
