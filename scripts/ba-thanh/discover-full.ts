import fs from "node:fs/promises";
import path from "node:path";
import { collectPaginatedRecords } from "@/lib/catalog/full-import/pagination";
import type { DiscoveredSourceUrl } from "@/lib/catalog/full-import/types";
import { normalizeSupplierCode } from "@/lib/catalog/normalize-code";
import { extractBaThanhIndex } from "@/lib/catalog/ba-thanh-source";
import { assertRobotsAllowed } from "@/lib/catalog/robots-policy";
import { BA_THANH_DOCUMENT_SOURCES, BA_THANH_FAMILY_SOURCES } from "./full-import";
import { fetchText } from "./http";
import { IMPORT_DIR, SOURCE_INDEX_URL, SOURCE_ROBOTS_URL, USER_AGENT } from "./config";

const SITEMAP_INDEX_URL = "https://bathanh.com.vn/sitemap_index.xml";
const LAMINATE_INDEX_URL = "https://bathanh.com.vn/map-mau-laminate";
const PAGE_API = "https://bathanh.com.vn/wp-json/wp/v2/pages";

type WordpressPage = { id: number; link: string };

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

function addUnique(target: Map<string, DiscoveredSourceUrl>, item: DiscoveredSourceUrl) {
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
  for (const sitemapUrl of childSitemaps) {
    const body = await fetchText(sitemapUrl, { refresh: options.refresh, validateUrl: allowed });
    sitemapEntries.set(sitemapUrl, xmlUrls(body));
  }

  const melamineParsed = extractBaThanhIndex(melamineHtml, SOURCE_INDEX_URL);
  const laminateParsed = extractBaThanhIndex(laminateHtml, LAMINATE_INDEX_URL);
  const melamineSnapshot = JSON.parse(
    await fs.readFile(path.join(IMPORT_DIR, "discovered-codes.json"), "utf8"),
  ) as Array<{ sourceUrl: string; category: string; codeNormalized: string }>;
  const melamineUrls = new Set(melamineSnapshot.map((item) => canonical(item.sourceUrl)));
  const freshMelamineUrls = new Set(melamineParsed.items.map((item) => canonical(item.sourceUrl)));
  if (melamineUrls.size !== 233 || freshMelamineUrls.size !== 233) {
    throw new Error(`Expected 233 public Melamine URLs, found snapshot=${melamineUrls.size}, source=${freshMelamineUrls.size}`);
  }
  const missingMelamineUrls = [...melamineUrls].filter((url) => !freshMelamineUrls.has(url));
  if (missingMelamineUrls.length) throw new Error(`${missingMelamineUrls.length} retained Melamine URLs are missing from the current map`);

  const discoveredAt = new Date().toISOString();
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
  if (laminate.length !== 33 || new Set(laminate.map((item) => item.codeNormalized)).size !== 33) {
    throw new Error(`Expected 33 unique public WAY Laminate codes, found ${laminate.length}`);
  }

  const pageApiPages: Array<{ url: string; sourceUrls: string[] }> = [];
  const paginated = await collectPaginatedRecords<WordpressPage>(async ({ page, pageSize }) => {
    const url = `${PAGE_API}?page=${page}&per_page=${pageSize}&_fields=id,link`;
    const pages = JSON.parse(await fetchText(url, { refresh: options.refresh, validateUrl: allowed })) as WordpressPage[];
    pageApiPages.push({ url, sourceUrls: pages.map((item) => canonical(item.link)) });
    return { records: pages };
  }, { pageSize: 100 });

  const laminateUrls = new Set(laminate.map((item) => canonical(item.sourceUrl)));
  const discovered = new Map<string, DiscoveredSourceUrl>();
  addUnique(discovered, { supplier: "ba-thanh", url: SOURCE_ROBOTS_URL, discoveredFrom: "html-link", locale: "unknown", pageType: "unknown", status: 200 });
  addUnique(discovered, { supplier: "ba-thanh", url: SITEMAP_INDEX_URL, discoveredFrom: "sitemap", locale: "unknown", pageType: "unknown", status: 200 });
  for (const sitemapUrl of childSitemaps) {
    addUnique(discovered, { supplier: "ba-thanh", url: sitemapUrl, discoveredFrom: "sitemap", sourceParent: SITEMAP_INDEX_URL, locale: "unknown", pageType: "unknown", status: 200 });
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
  addUnique(discovered, { supplier: "ba-thanh", url: PAGE_API, discoveredFrom: "api", locale: "vi", pageType: "collection", status: 200 });
  for (const [index, apiPage] of pageApiPages.entries()) {
    addUnique(discovered, {
      supplier: "ba-thanh",
      url: apiPage.url,
      discoveredFrom: index === 0 ? "api" : "pagination",
      sourceParent: PAGE_API,
      locale: "vi",
      pageType: "collection",
      status: 200,
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
    melamineCategories: melamineParsed.categories,
    melamineCounts: Object.fromEntries(melamineParsed.categories.map((category) => [
      category.slug,
      melamineSnapshot.filter((item) => item.category === category.slug).length,
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
  await fs.writeFile(path.join(IMPORT_DIR, "discovered-laminate-codes.json"), `${JSON.stringify(laminate, null, 2)}\n`);
  return { fullDiscovery, laminate };
}

if (process.argv[1]?.endsWith("discover-full.ts")) {
  discoverBaThanhFull({ refresh: process.argv.includes("--refresh") }).then(({ fullDiscovery, laminate }) => {
    console.log(JSON.stringify({
      command: "discover:full",
      melamine: 233,
      laminate: laminate.length,
      publicPageApiRecords: fullDiscovery.publicPageApiRecords,
      discoveredSourceUrls: fullDiscovery.discovered.length,
    }, null, 2));
  }).catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
