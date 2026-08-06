import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { recognizeBaThanhDetail, reconcileBaThanhCode } from "@/lib/catalog/ba-thanh-source";
import { normalizeSupplierCode } from "@/lib/catalog/normalize-code";
import { assertRobotsAllowed } from "@/lib/catalog/robots-policy";
import type { BaThanhDiscoveredSourceUrl, BaThanhFullSourceItem, BaThanhSourceClassification } from "./full-import";
import { BA_THANH_DOCUMENT_SOURCES, BA_THANH_FAMILY_SOURCES } from "./full-import";
import { CONCURRENCY, IMPORT_DIR, REQUEST_GAP_MS, USER_AGENT } from "./config";
import { fetchText, mapWithConcurrency, sleep, type FetchResponseMetadata } from "./http";

export function validateBaThanhCrawlCoverage(items: Array<{ codeNormalized: string; status: string }>) {
  const successful = items.filter((item) => item.status === "PARSED");
  if (!items.length || successful.length !== items.length) {
    throw new Error(`Catalogue crawl incomplete: ${successful.length}/${items.length} verified`);
  }
  if (new Set(successful.map((item) => item.codeNormalized)).size !== successful.length) {
    throw new Error("Catalogue crawl contains duplicate normalized codes");
  }
}

async function crawlProductSources(
  sources: BaThanhFullSourceItem[],
  robots: string,
  refresh?: boolean,
) {
  return mapWithConcurrency(sources, CONCURRENCY, async (item) => {
    await sleep(REQUEST_GAP_MS);
    try {
      let responseMetadata: FetchResponseMetadata = { finalUrl: item.sourceUrl, redirects: [], fromCache: false };
      const html = await fetchText(item.sourceUrl, {
        refresh,
        validateUrl: (url) => assertRobotsAllowed(robots, USER_AGENT, url),
        onResponse: (metadata) => { responseMetadata = metadata; },
      });
      const parsed = recognizeBaThanhDetail(html, { expectedCode: item.codeNormalized, sourceUrl: item.sourceUrl });
      const reconciled = parsed.accepted ? reconcileBaThanhCode(item.codeRaw, parsed.verifiedCodeRaw) : {};
      return {
        ...item,
        ...reconciled,
        status: parsed.accepted ? "PARSED" as const : "REJECTED" as const,
        httpStatus: 200,
        finalUrl: responseMetadata.finalUrl,
        redirects: responseMetadata.redirects,
        pageChecksum: createHash("sha256").update(html).digest("hex"),
        heading: parsed.heading,
        text: parsed.text,
        images: parsed.images,
      };
    } catch (error) {
      return {
        ...item,
        status: "FAILED" as const,
        httpStatus: 0,
        finalUrl: item.sourceUrl,
        redirects: [],
        error: error instanceof Error ? error.message : String(error),
        images: [],
      };
    }
  });
}

const duplicateFamilyRoutes = new Map<string, string>([
  ["/map-ma-melamine/van-phu-keo-melamine", "https://bathanh.com.vn/portfolio/van-phu-melamine"],
  ["/map-ma-melamine/van-phu-verneer", "https://bathanh.com.vn/portfolio/van-phu-veneer"],
  ["/map-ma-melamine/nep-chi-pvc-dan-go", "https://bathanh.com.vn/portfolio/chi-vien-veneer-pvc"],
  ["/en/solution/only-veneer-pvc-edgebanding", "https://bathanh.com.vn/portfolio/chi-vien-veneer-pvc"],
  ["/en/solution/processing-melamine-paper", "https://bathanh.com.vn/portfolio/van-phu-giay-melamine"],
  ["/en/solution/processing-veneer", "https://bathanh.com.vn/portfolio/van-phu-veneer"],
]);

function routeCode(url: string) {
  const pathname = decodeURIComponent(new URL(url).pathname).toUpperCase();
  const match = pathname.match(/(?:^|\/)(?:WAY-)?((?:BTSC|BTS|BT|SC|MT|W|P|S|F)[-_]?\d{1,4}[A-Z]{0,4})(?:[-_/]|$)/);
  return match?.[1] ? normalizeSupplierCode(match[1]).normalized : undefined;
}

export function classifyBaThanhPage(options: {
  url: string;
  html: string;
  status: number;
  knownProductSources: Map<string, string>;
  discoveredAt: string;
}): { classification: BaThanhSourceClassification; extraMelamine?: BaThanhFullSourceItem } {
  const url = new URL(options.url).toString();
  const pathname = new URL(url).pathname.replace(/\/$/, "") || "/";
  const checksum = createHash("sha256").update(options.html).digest("hex");
  const evidence = { kind: "http-html" as const, status: options.status, checksum };
  const duplicateCanonical = duplicateFamilyRoutes.get(pathname);
  if (duplicateCanonical) {
    return { classification: { outcome: "duplicate", reason: "Fetched catalogue route describes the same normalized Ba Thanh product family.", canonicalUrl: duplicateCanonical, evidence } };
  }
  const family = BA_THANH_FAMILY_SOURCES.find((source) => new URL(source.sourceUrl).toString() === url);
  if (family) return { classification: { outcome: "imported", reason: "Fetched official product-family source page.", canonicalUrl: family.sourceUrl, evidence } };
  const document = BA_THANH_DOCUMENT_SOURCES.find((source) => new URL(source.sourceUrl).toString() === url);
  if (document) return { classification: { outcome: "imported", reason: "Fetched official catalogue document page.", canonicalUrl: document.sourceUrl, evidence } };
  const collections: Record<string, BaThanhSourceClassification["recordGroup"]> = {
    "/": "all",
    "/san-pham": "all",
    "/portfolio": "families",
    "/map-ma-melamine": "melamine",
    "/map-mau-laminate": "laminate",
  };
  if (collections[pathname]) return { classification: { outcome: "imported", reason: "Fetched official catalogue collection page.", recordGroup: collections[pathname], evidence } };

  const expectedCode = routeCode(url);
  if (expectedCode) {
    const parsed = recognizeBaThanhDetail(options.html, { expectedCode, sourceUrl: url });
    if (parsed.accepted) {
      const canonical = options.knownProductSources.get(expectedCode);
      if (canonical && canonical !== url) {
        return { classification: { outcome: "duplicate", reason: "Fetched product page resolves to a code already represented by its canonical source page.", canonicalUrl: canonical, recordCode: expectedCode, evidence } };
      }
      const normalized = normalizeSupplierCode(expectedCode);
      return {
        classification: { outcome: "imported", reason: "Fetched page exposes a verified public Melamine product code.", recordCode: expectedCode, evidence },
        ...(!canonical ? {
          extraMelamine: {
            sourceUrl: url,
            sourceImageUrl: parsed.images[0],
            category: "public-product-page",
            sourceCategoryLabel: "Sản phẩm Melamine công khai",
            codeRaw: expectedCode,
            codeNormalized: expectedCode,
            displayName: normalized.display,
            slug: normalized.slug,
            confident: normalized.confident,
            status: "PARSED",
            heading: parsed.heading,
            text: parsed.text,
            images: parsed.images,
            discoveredAt: options.discoveredAt,
            pageChecksum: checksum,
          },
        } : {}),
      };
    }
  }

  return {
    classification: {
      outcome: "non-product",
      reason: "Fetched public HTML contains no verified product code, catalogue collection, document, or material-family signal.",
      evidence,
    },
  };
}

export async function crawlBaThanhFull(options: { refresh?: boolean } = {}) {
  const fullDiscoveryPath = path.join(IMPORT_DIR, "full-discovery.json");
  const fullDiscovery = JSON.parse(await fs.readFile(fullDiscoveryPath, "utf8"));
  const robots = await fetchText(String(fullDiscovery.robotsUrl), { refresh: options.refresh });
  const melamineSources = JSON.parse(
    await fs.readFile(path.join(IMPORT_DIR, "discovered-codes.json"), "utf8"),
  ) as BaThanhFullSourceItem[];
  const laminateSources = JSON.parse(
    await fs.readFile(path.join(IMPORT_DIR, "discovered-laminate-codes.json"), "utf8"),
  ) as BaThanhFullSourceItem[];
  const [melamineDetails, laminateDetails] = await Promise.all([
    crawlProductSources(melamineSources, robots, options.refresh),
    crawlProductSources(laminateSources, robots, options.refresh),
  ]);
  validateBaThanhCrawlCoverage(melamineDetails);
  validateBaThanhCrawlCoverage(laminateDetails);

  const knownProductSources = new Map([...melamineDetails, ...laminateDetails].map((item) => [
    item.codeNormalized,
    new URL(item.sourceUrl).toString(),
  ]));
  const productDetailsByUrl = new Map([...melamineDetails, ...laminateDetails].map((item) => [new URL(item.sourceUrl).toString(), item]));
  const discovered = fullDiscovery.discovered as BaThanhDiscoveredSourceUrl[];
  type PageResult = BaThanhDiscoveredSourceUrl & { extraMelamine?: BaThanhFullSourceItem };
  const pageResults = await mapWithConcurrency<BaThanhDiscoveredSourceUrl, PageResult>(discovered, CONCURRENCY, async (item) => {
    if (item.classification?.evidence.kind === "infrastructure") return item;
    const url = new URL(item.url);
    if (url.protocol !== "https:" || url.hostname !== "bathanh.com.vn") {
      return { ...item, classification: undefined };
    }
    const knownDetail = productDetailsByUrl.get(url.toString());
    if (knownDetail?.pageChecksum) {
      return {
        ...item,
        pageType: "product" as const,
        status: Number(knownDetail.httpStatus ?? 200),
        checksum: knownDetail.pageChecksum,
        classification: {
          outcome: "imported" as const,
          reason: "Fetched and verified public product detail page.",
          recordCode: knownDetail.codeNormalized,
          evidence: { kind: "http-html" as const, status: Number(knownDetail.httpStatus ?? 200), checksum: knownDetail.pageChecksum },
        },
      };
    }
    await sleep(REQUEST_GAP_MS);
    try {
      const html = await fetchText(url.toString(), {
        refresh: options.refresh,
        validateUrl: (candidate) => assertRobotsAllowed(robots, USER_AGENT, candidate),
      });
      const result = classifyBaThanhPage({ url: url.toString(), html, status: 200, knownProductSources, discoveredAt: fullDiscovery.discoveredAt });
      return { ...item, status: 200, checksum: result.classification.evidence.checksum, classification: result.classification, extraMelamine: result.extraMelamine };
    } catch (error) {
      return {
        ...item,
        status: 0,
        classification: {
          outcome: "blocked" as const,
          reason: `Public page could not be fetched after bounded retry: ${error instanceof Error ? error.message : String(error)}`,
          evidence: { kind: "http-html" as const, status: 0, checksum: createHash("sha256").update(String(error)).digest("hex") },
        },
      };
    }
  });
  const extraMelamine = pageResults
    .map((item) => item.extraMelamine as BaThanhFullSourceItem | undefined)
    .filter((item): item is BaThanhFullSourceItem => Boolean(item));
  const existingCodes = new Set(melamineDetails.map((item) => item.codeNormalized));
  const uniqueExtra = extraMelamine.filter((item, index, all) =>
    !existingCodes.has(item.codeNormalized) && all.findIndex((candidate) => candidate.codeNormalized === item.codeNormalized) === index);
  const allMelamineDetails = [...melamineDetails, ...uniqueExtra];
  for (const extra of uniqueExtra) knownProductSources.set(extra.codeNormalized, extra.sourceUrl);

  fullDiscovery.crawledAt = new Date().toISOString();
  fullDiscovery.discovered = pageResults.map((item) => {
    const discoveredItem = { ...item };
    delete discoveredItem.extraMelamine;
    return discoveredItem;
  });
  fullDiscovery.melamineCrawl = {
    total: allMelamineDetails.length,
    successful: allMelamineDetails.filter((item) => item.status === "PARSED").length,
    discoveredOutsideMap: allMelamineDetails.filter((item) =>
      !(fullDiscovery.melamineBaselineCodes as string[] | undefined)?.includes(item.codeNormalized)).length,
    rejected: melamineDetails.filter((item) => item.status === "REJECTED").length,
    failed: melamineDetails.filter((item) => item.status === "FAILED").length,
  };
  fullDiscovery.laminateCrawl = {
    total: laminateDetails.length,
    successful: laminateDetails.filter((item) => item.status === "PARSED").length,
    rejected: laminateDetails.filter((item) => item.status === "REJECTED").length,
    failed: laminateDetails.filter((item) => item.status === "FAILED").length,
  };
  await fs.writeFile(path.join(IMPORT_DIR, "discovered-codes.json"), `${JSON.stringify(allMelamineDetails, null, 2)}\n`);
  await fs.writeFile(path.join(IMPORT_DIR, "discovered-laminate-codes.json"), `${JSON.stringify(laminateDetails, null, 2)}\n`);
  await fs.writeFile(fullDiscoveryPath, `${JSON.stringify(fullDiscovery, null, 2)}\n`);
  return { fullDiscovery, melamine: allMelamineDetails, details: laminateDetails };
}

if (process.argv[1]?.endsWith("crawl-full.ts")) {
  crawlBaThanhFull({ refresh: process.argv.includes("--refresh") }).then(({ fullDiscovery }) => {
    console.log(JSON.stringify({ command: "crawl:full", ...fullDiscovery.laminateCrawl }, null, 2));
  }).catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
