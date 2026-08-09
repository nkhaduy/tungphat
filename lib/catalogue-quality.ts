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
  configurationErrors: string[];
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

function mainContent(html: string) {
  return html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] ?? "";
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

function hasIdentifyingData(html: string, url: string) {
  const heading = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1];
  if (!heading) return false;

  const normalizeIdentity = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .replace(/[^a-z0-9]+/gi, "")
      .toLowerCase();
  const text = bodyText(html);
  const pathname = new URL(url).pathname;
  if (pathname === "/catalogue/") return /mã màu|ma mau|catalogue/i.test(text);

  const slug = decodeURIComponent(pathname.split("/").filter(Boolean).at(-1) ?? "");
  return Boolean(slug) && normalizeIdentity(text).includes(normalizeIdentity(slug));
}

export function auditCataloguePages({ sitemapUrls, readHtml, checkedAt = new Date().toISOString() }: AuditInput): CatalogueQualityReport {
  const urls = sitemapUrls.filter((url) => new URL(url).pathname.startsWith("/catalogue/"));
  const configurationErrors = urls.length ? [] : ["noCatalogueTargets"];
  const pages = urls.map((url): CatalogueQualityPage => {
    const canonicalUrl = normalizeUrl(url);
    const html = readHtml(url);
    const main = mainContent(html);
    const text = bodyText(main);
    const signals = {
      identifyingData: hasIdentifyingData(main, canonicalUrl),
      metadata: hasTag(html, "title") && hasMeta(html, "description"),
      canonical: hasCanonical(html, canonicalUrl),
      visual: hasTag(main, "img"),
      provenance: /nguồn|nguon|source|supplier|official|chính thức|doi chieu/i.test(text),
      categoryContext: /aria-label=["']Breadcrumb|href=["']\/catalogue\//i.test(main),
      commercialUtility: /zalo\.me|tel:|data-track-event|bao-gia|lien-he/i.test(main),
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
    configurationErrors,
    summary: { total: pages.length, passed, failed: pages.length - passed },
    pages,
  };
}
