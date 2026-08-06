import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { collectPaginatedRecords } from "@/lib/catalog/full-import/pagination";
import { normalizeSupplierCode } from "@/lib/catalog/normalize-code";
import { extractBaThanhIndex } from "@/lib/catalog/ba-thanh-source";
import { assertRobotsAllowed } from "@/lib/catalog/robots-policy";
import type { SupplierColorCode } from "@/lib/catalog/types";
import { BA_THANH_DOCUMENT_SOURCES, BA_THANH_FAMILY_SOURCES, type BaThanhDiscoveredSourceUrl } from "./full-import";
import { fetchText } from "./http";
import { CATALOG_PATH, IMPORT_DIR, SOURCE_INDEX_URL, SOURCE_ROBOTS_URL, USER_AGENT } from "./config";

const SITEMAP_INDEX_URL = "https://bathanh.com.vn/sitemap_index.xml";
const LAMINATE_INDEX_URL = "https://bathanh.com.vn/map-mau-laminate";
const PAGE_API = "https://bathanh.com.vn/wp-json/wp/v2/pages";

type WordpressPage = { id: number; link: string };

export function validateBaThanhDiscoveryCoverage(options: {
  baselineMelamineCodes: string[];
  freshMelamineCodes: string[];
  laminateCodes: string[];
}) {
  const baseline = new Set(options.baselineMelamineCodes);
  const freshMelamine = new Set(options.freshMelamineCodes);
  const laminate = new Set(options.laminateCodes);
  const missing = [...baseline].filter((code) => !freshMelamine.has(code));
  if (missing.length) throw new Error(`${missing.length} retained Melamine code(s) are missing from the current map`);
  if (freshMelamine.size !== options.freshMelamineCodes.length) throw new Error("Duplicate Melamine codes discovered");
  if (laminate.size !== options.laminateCodes.length) throw new Error("Duplicate WAY Laminate codes discovered");
  return { melamine: freshMelamine.size, laminate: laminate.size };
}

function xmlUrls(xml: string): string[] {
  return [...xml.matchAll(/<loc>([\s\S]*?)<\/loc>/gi)]
    .map((match) => match[1].replace(/&amp;/g, "&").trim())
    .filter(Boolean);
}

function canonical(value: string): string {
  return new URL(value).toString();
}

function pageType(url: string, productUrls: Set<string>, laminateUrls: Set<string>) {
  const normalized = canonical(url);
  if (productUrls.has(normalized) || laminateUrls.has(normalized)) return "product" as const;
  if (BA_THANH_FAMILY_SOURCES.some((source) => canonical(source.sourceUrl) === normalized)) return "product-family" as const;
  if (BA_THANH_DOCUMENT_SOURCES.some((source) => canonical(source.sourceUrl) === normalized)) return "catalogue" as const;
  const pathname = new URL(url).pathname.replace(/\/$/, "");
  if (["/map-ma-melamine", "/map-mau-laminate", "/san-pham", "/portfolio"].includes(pathname)) return "collection" as const;
  return "unknown" as const;
}

function addUnique(target: Map<string, BaThanhDiscoveredSourceUrl>, item: BaThanhDiscoveredSourceUrl) {
  const url = canonical(item.url);
  if (!target.has(url)) target.set(url, { ...item, url });
}

export async function discoverBaThanhFull(options: { refresh?: boolean } = {}) {
  const robots = await fetchText(SOURCE_ROBOTS_URL, { refresh: options.refresh });
  const allowed = (url: string) => assertRobotsAllowed(robots, USER_AGENT, url);
  allowed(SITEMAP_INDEX_URL);
  allowed(SOURCE_INDEX_URL);
  allowed(LAMINATE_INDEX_URL);

  const [sitemapIndex, melamineHtml, laminateHtml] = await Promise.all([
    fetchText(SITEMAP_INDEX_URL, { refresh: options.refresh, validateUrl: allowed }),
    fetchText(SOURCE_INDEX_URL, { refresh: options.refresh, validateUrl: allowed }),
    fetchText(LAMINATE_INDEX_URL, { refresh: options.refresh, validateUrl: allowed }),
  ]);
  const childSitemaps = xmlUrls(sitemapIndex);
  const sitemapEntries = new Map<string, string[]>();
  const sitemapChecksums = new Map<string, string>();
  for (const sitemapUrl of childSitemaps) {
    const body = await fetchText(sitemapUrl, { refresh: options.refresh, validateUrl: allowed });
    sitemapEntries.set(sitemapUrl, xmlUrls(body));
    sitemapChecksums.set(sitemapUrl, createHash("sha256").update(body).digest("hex"));
  }

  const melamineParsed = extractBaThanhIndex(melamineHtml, SOURCE_INDEX_URL);
  const laminateParsed = extractBaThanhIndex(laminateHtml, LAMINATE_INDEX_URL);
  const discoveredAt = new Date().toISOString();
  const baselineMelamine = JSON.parse(await fs.readFile(CATALOG_PATH, "utf8")) as SupplierColorCode[];
  const baselineByUrl = new Map(baselineMelamine.map((item) => [canonical(item.sourceUrl), item]));
  const melamine = melamineParsed.items.map((item) => {
    const baseline = baselineByUrl.get(canonical(item.sourceUrl));
    const normalized = normalizeSupplierCode(baseline?.codeNormalized ?? item.codeRaw);
    return {
      ...item,
      codeRaw: baseline?.codeRaw ?? item.codeRaw,
      id: `ba-thanh:${normalized.normalized}`,
      codeNormalized: normalized.normalized,
      displayName: normalized.display,
      slug: normalized.slug,
      confident: normalized.confident,
      sourceIndexUrl: SOURCE_INDEX_URL,
      discoveredAt,
      status: "DISCOVERED" as const,
    };
  });
  const laminate = laminateParsed.items.map((item) => {
    const normalized = normalizeSupplierCode(item.codeRaw);
    return {
      ...item,
      id: `ba-thanh:laminate:${normalized.normalized}`,
      codeNormalized: normalized.normalized,
      displayName: normalized.display,
      slug: normalized.slug,
      confident: normalized.confident,
      sourceIndexUrl: LAMINATE_INDEX_URL,
      discoveredAt,
      status: "DISCOVERED" as const,
    };
  });
  validateBaThanhDiscoveryCoverage({
    baselineMelamineCodes: baselineMelamine.map((item) => item.codeNormalized),
    freshMelamineCodes: melamine.map((item) => item.codeNormalized),
    laminateCodes: laminate.map((item) => item.codeNormalized),
  });

  const pageApiPages: Array<{ url: string; sourceUrls: string[] }> = [];
  const paginated = await collectPaginatedRecords<WordpressPage>(async ({ page, pageSize }) => {
    const url = `${PAGE_API}?page=${page}&per_page=${pageSize}&_fields=id,link`;
    const pages = JSON.parse(await fetchText(url, { refresh: options.refresh, validateUrl: allowed })) as WordpressPage[];
    pageApiPages.push({ url, sourceUrls: pages.map((item) => canonical(item.link)) });
    return { records: pages };
  }, { pageSize: 100 });

  const melamineUrls = new Set(melamine.map((item) => canonical(item.sourceUrl)));
  const laminateUrls = new Set(laminate.map((item) => canonical(item.sourceUrl)));
  const discovered = new Map<string, BaThanhDiscoveredSourceUrl>();
  const robotsChecksum = createHash("sha256").update(robots).digest("hex");
  const sitemapChecksum = createHash("sha256").update(sitemapIndex).digest("hex");
  addUnique(discovered, {
    supplier: "ba-thanh", url: SOURCE_ROBOTS_URL, discoveredFrom: "html-link", locale: "unknown", pageType: "unknown", status: 200, checksum: robotsChecksum,
    classification: { outcome: "non-product", reason: "Official robots policy used for crawl authorization; it is not catalogue content.", evidence: { kind: "infrastructure", status: 200, checksum: robotsChecksum } },
  });
  addUnique(discovered, {
    supplier: "ba-thanh", url: SITEMAP_INDEX_URL, discoveredFrom: "sitemap", locale: "unknown", pageType: "unknown", status: 200, checksum: sitemapChecksum,
    classification: { outcome: "non-product", reason: "Official sitemap index used for URL discovery; it is not catalogue content.", evidence: { kind: "infrastructure", status: 200, checksum: sitemapChecksum } },
  });
  for (const sitemapUrl of childSitemaps) {
    const checksum = sitemapChecksums.get(sitemapUrl)!;
    addUnique(discovered, {
      supplier: "ba-thanh", url: sitemapUrl, discoveredFrom: "sitemap", sourceParent: SITEMAP_INDEX_URL, locale: "unknown", pageType: "unknown", status: 200, checksum,
      classification: { outcome: "non-product", reason: "Official child sitemap used for URL discovery; it is not catalogue content.", evidence: { kind: "infrastructure", status: 200, checksum } },
    });
    for (const url of sitemapEntries.get(sitemapUrl) ?? []) {
      addUnique(discovered, {
        supplier: "ba-thanh",
        url,
        discoveredFrom: "sitemap",
        sourceParent: sitemapUrl,
        locale: new URL(url).pathname.startsWith("/en/") ? "en" : "vi",
        pageType: pageType(url, melamineUrls, laminateUrls),
      });
    }
  }
  addUnique(discovered, { supplier: "ba-thanh", url: LAMINATE_INDEX_URL, discoveredFrom: "html-link", locale: "vi", pageType: "collection", status: 200 });
  const apiChecksum = createHash("sha256").update(JSON.stringify(paginated.records.map((item) => [item.id, item.link]))).digest("hex");
  addUnique(discovered, {
    supplier: "ba-thanh", url: PAGE_API, discoveredFrom: "api", locale: "vi", pageType: "collection", status: 200, checksum: apiChecksum,
    classification: { outcome: "non-product", reason: "Official public WordPress API endpoint used for page enumeration; it is discovery infrastructure.", evidence: { kind: "infrastructure", status: 200, checksum: apiChecksum } },
  });
  for (const [index, apiPage] of pageApiPages.entries()) {
    addUnique(discovered, {
      supplier: "ba-thanh",
      url: apiPage.url,
      discoveredFrom: index === 0 ? "api" : "pagination",
      sourceParent: PAGE_API,
      locale: "vi",
      pageType: "collection",
      status: 200,
      checksum: createHash("sha256").update(JSON.stringify(apiPage.sourceUrls)).digest("hex"),
      classification: {
        outcome: "non-product",
        reason: "Paginated public WordPress API response used for page enumeration; it is discovery infrastructure.",
        evidence: { kind: "infrastructure", status: 200, checksum: createHash("sha256").update(JSON.stringify(apiPage.sourceUrls)).digest("hex") },
      },
    });
  }

  const fullDiscovery = {
    schemaVersion: 1,
    supplier: "ba-thanh",
    discoveredAt,
    robotsUrl: SOURCE_ROBOTS_URL,
    sitemapIndexUrl: SITEMAP_INDEX_URL,
    childSitemaps,
    sitemapEntries: Object.fromEntries(sitemapEntries),
    pageApi: PAGE_API,
    pageApiPages,
    publicPageApiRecords: paginated.records.length,
    melamineIndexUrl: SOURCE_INDEX_URL,
    melamineBaselineCodes: baselineMelamine.map((item) => item.codeNormalized).sort(),
    melamineCategories: melamineParsed.categories,
    melamineCounts: Object.fromEntries(melamineParsed.categories.map((category) => [
      category.slug,
      melamine.filter((item) => item.category === category.slug).length,
    ])),
    laminateIndexUrl: LAMINATE_INDEX_URL,
    laminateCategories: laminateParsed.categories,
    laminateCounts: Object.fromEntries(laminateParsed.categories.map((category) => [
      category.slug,
      laminate.filter((item) => item.category === category.slug).length,
    ])),
    discovered: [...discovered.values()],
  };
  await fs.mkdir(IMPORT_DIR, { recursive: true });
  await fs.writeFile(path.join(IMPORT_DIR, "full-discovery.json"), `${JSON.stringify(fullDiscovery, null, 2)}\n`);
  await fs.writeFile(path.join(IMPORT_DIR, "discovered-codes.json"), `${JSON.stringify(melamine, null, 2)}\n`);
  await fs.writeFile(path.join(IMPORT_DIR, "discovered-laminate-codes.json"), `${JSON.stringify(laminate, null, 2)}\n`);
  return { fullDiscovery, melamine, laminate };
}

if (process.argv[1]?.endsWith("discover-full.ts")) {
  discoverBaThanhFull({ refresh: process.argv.includes("--refresh") }).then(({ fullDiscovery, laminate }) => {
    console.log(JSON.stringify({
      command: "discover:full",
      melamine: Object.values(fullDiscovery.melamineCounts).reduce((sum, count) => sum + count, 0),
      laminate: laminate.length,
      publicPageApiRecords: fullDiscovery.publicPageApiRecords,
      discoveredSourceUrls: fullDiscovery.discovered.length,
    }, null, 2));
  }).catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
