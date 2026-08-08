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

function pageText(html: string) {
  const footerIndex = html.search(/<footer\b|<div\b[^>]*id=["']footer["']/i);
  const page = footerIndex >= 0 ? html.slice(0, footerIndex) : html;
  const main = page.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] ?? page;
  return main
    .replace(/<script\b[\s\S]*?<\/script>|<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z0-9#]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function foldedPageText(html: string) {
  return pageText(html).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
}

function primaryPageLabel(html: string) {
  const label = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1]
    ?? html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1]
    ?? "";
  return label
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z0-9#]+;/gi, " ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

const contentFamilyRules: Array<{ pattern: RegExp; canonicalUrl: string; label: string; recordIds: string[] }> = [
  { pattern: /\b(?:HMR|MMR|LMR)\b|MDF.{0,30}(?:CHONG AM|KHANG AM|MOISTURE)/, canonicalUrl: "https://bathanh.com.vn/phan-biet-hdf-va-mdf-loi-xanh.html", label: "MDF chống ẩm HMR", recordIds: ["ba-thanh:family:van-mdf-chong-am-hmr"] },
  { pattern: /\bHDF\b|HIGH DENSITY FIBERBOARD/, canonicalUrl: "https://bathanh.com.vn/portfolio/van-mdf-hdf", label: "HDF", recordIds: ["ba-thanh:family:van-hdf"] },
  { pattern: /\bMDF\b|MEDIUM DENSITY FIBERBOARD/, canonicalUrl: "https://bathanh.com.vn/portfolio/gioi-thieu-qui-cach-van-mdf", label: "MDF", recordIds: ["ba-thanh:family:van-mdf"] },
  { pattern: /GO GHEP|FINGER ?JOINT/, canonicalUrl: "https://bathanh.com.vn/portfolio/van-go-ghep", label: "gỗ ghép", recordIds: ["ba-thanh:family:van-go-ghep"] },
  { pattern: /\bOKAL\b|PARTICLE ?BOARD|\bMFC\b/, canonicalUrl: "https://bathanh.com.vn/portfolio/vanokal", label: "OKAL/MFC", recordIds: ["ba-thanh:family:van-okal-mfc"] },
  { pattern: /CHI (?:VIEN|DAN CANH)|EDGE ?BANDING|NEP.{0,20}\bPVC\b/, canonicalUrl: "https://bathanh.com.vn/portfolio/chi-vien-veneer-pvc", label: "chỉ dán cạnh", recordIds: ["ba-thanh:family:chi-dan-canh-veneer-pvc"] },
  { pattern: /DONGWHA|VAN SAN|FLOORING/, canonicalUrl: "https://bathanh.com.vn/catalogue-van-san-dongwha", label: "ván sàn", recordIds: ["ba-thanh:family:van-san-dongwha-natus", "ba-thanh:family:van-san-dongwha-sanus"] },
  { pattern: /VAN.{0,20}(?:PHU )?VENEER|VENEER.{0,20}(?:BOARD|PANEL)/, canonicalUrl: "https://bathanh.com.vn/portfolio/van-phu-veneer", label: "ván phủ Veneer", recordIds: ["ba-thanh:family:van-phu-veneer"] },
  { pattern: /VAN.{0,20}PHU GIAY|PAPER.{0,20}(?:FACED|COATED).{0,20}(?:BOARD|PANEL)/, canonicalUrl: "https://bathanh.com.vn/portfolio/van-phu-giay-melamine", label: "ván phủ giấy", recordIds: ["ba-thanh:family:van-phu-giay"] },
  { pattern: /VAN.{0,20}PHU MELAMINE|MELAMINE.{0,20}(?:FACED|COATED).{0,20}(?:BOARD|PANEL)/, canonicalUrl: "https://bathanh.com.vn/portfolio/van-phu-melamine", label: "ván phủ Melamine", recordIds: ["ba-thanh:family:van-phu-melamine"] },
];

function contentFamilyEvidence(html: string) {
  const primary = primaryPageLabel(html);
  const primaryMatches = contentFamilyRules.filter((rule) => rule.pattern.test(primary));
  if (primaryMatches.length) return primaryMatches;
  const text = foldedPageText(html);
  const productCue = /\b(?:VAN (?:MDF|HDF|GO|PHU|OKAL|MFC|SAN)|BOARD|PANEL|TAM (?:MDF|HDF|GO|PHU|OKAL|MFC)|SAN PHAM|PRODUCT|QUY CACH|THICKNESS|DO DAY|TY TRONG|DENSITY|COT VAN|CORE)\b/.test(text);
  if (!productCue) return [];
  return contentFamilyRules.filter((rule) => rule.pattern.test(text));
}

export function classifyBaThanhPage(options: {
  url: string;
  html: string;
  status: number;
  knownProductSources: Map<string, string>;
  discoveredAt: string;
}): { classification: BaThanhSourceClassification; extraMelamine?: BaThanhFullSourceItem; extraLaminate?: BaThanhFullSourceItem } {
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
  const expectedCode = routeCode(url);
  if (expectedCode) {
    const parsed = recognizeBaThanhDetail(options.html, { expectedCode, sourceUrl: url });
    if (parsed.accepted) {
      const canonical = options.knownProductSources.get(expectedCode);
      if (canonical && canonical !== url) {
        return { classification: { outcome: "duplicate", reason: "Fetched product page resolves to a code already represented by its canonical source page.", canonicalUrl: canonical, recordCode: expectedCode, evidence } };
      }
      const normalized = normalizeSupplierCode(expectedCode);
      const materialText = foldedPageText(options.html);
      const materialType = /\bLAMINATE\b|LAMINATE.{0,20}\bWAY\b/.test(materialText) ? "laminate" as const : "melamine" as const;
      const extraKey = materialType === "laminate" ? "extraLaminate" : "extraMelamine";
      return {
        classification: { outcome: "imported", reason: `Fetched page exposes a verified public ${materialType === "laminate" ? "WAY Laminate" : "Melamine"} product code.`, recordCode: expectedCode, evidence },
        ...(!canonical ? {
          [extraKey]: {
            materialType,
            sourceUrl: url,
            sourceImageUrl: parsed.images[0],
            category: "public-product-page",
            sourceCategoryLabel: materialType === "laminate" ? "Sản phẩm Laminate WAY công khai" : "Sản phẩm Melamine công khai",
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

  const primaryLabel = primaryPageLabel(options.html);
  if (/\b(?:LIEN HE|CONTACT|COMPANY|ABOUT|GIOI THIEU|CHINH SACH|POLICY|THANH TOAN|PAYMENT|DOI TRA|RETURN|NHA MAY|FACTORY|TIN TUC|NEWS|BLOG|DAI LY|AGENT|DICH VU|SERVICE)\b/.test(primaryLabel)) {
    return {
      classification: {
        outcome: "non-product",
        reason: `Fetched page primary heading identifies corporate or service content (${primaryLabel || "untitled"}); embedded product navigation is not treated as catalogue identity.`,
        evidence,
      },
    };
  }

  const familyEvidence = contentFamilyEvidence(options.html);
  const folded = foldedPageText(options.html);
  const codeCount = new Set([...folded.matchAll(/\b(?:BTSC|BTS|BT|SC|W|P|S|F)[-_ ]?\d{1,4}[A-Z]{0,4}\b/g)]
    .map((match) => normalizeSupplierCode(match[0]).normalized)).size;
  if (pathname === "/map-ma-melamine" && /\bMELAMINE\b/.test(folded) && codeCount > 1) {
    return { classification: { outcome: "imported", reason: "Fetched collection contains multiple verified Melamine codes.", recordGroup: "melamine", evidence } };
  }
  if (pathname === "/map-mau-laminate" && /\bLAMINATE\b/.test(folded) && codeCount > 1) {
    return { classification: { outcome: "imported", reason: "Fetched collection contains multiple verified WAY Laminate codes.", recordGroup: "laminate", evidence } };
  }
  const collectionCue = /\b(?:DANH MUC|CAC DONG SAN PHAM|PRODUCT CATEGORIES|COLLECTION|CATALOGUE)\b/.test(folded);
  if (familyEvidence.length > 1) {
    return {
      classification: {
        outcome: collectionCue || pathname === "/" ? "imported" : "duplicate",
        reason: `Fetched code-less page contains ${collectionCue || pathname === "/" ? "collection" : "comparison"} evidence for ${familyEvidence.map((item) => item.label).join(", ")}.`,
        canonicalUrls: familyEvidence.map((item) => item.canonicalUrl),
        recordIds: familyEvidence.flatMap((item) => item.recordIds),
        evidence,
      },
    };
  }
  if (familyEvidence.length) {
    return { classification: { outcome: "duplicate", reason: `Fetched code-less page contains product-family evidence for ${familyEvidence[0].label}.`, canonicalUrl: familyEvidence[0].canonicalUrl, recordIds: familyEvidence[0].recordIds, evidence } };
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
  type PageResult = BaThanhDiscoveredSourceUrl & { extraMelamine?: BaThanhFullSourceItem; extraLaminate?: BaThanhFullSourceItem };
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
      return {
        ...item,
        status: 200,
        checksum: result.classification.evidence.checksum,
        classification: result.classification,
        extraMelamine: result.extraMelamine,
        extraLaminate: result.extraLaminate,
      };
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
  const uniqueExtraMelamine = extraMelamine.filter((item, index, all) =>
    !existingCodes.has(item.codeNormalized) && all.findIndex((candidate) => candidate.codeNormalized === item.codeNormalized) === index);
  const extraLaminate = pageResults
    .map((item) => item.extraLaminate as BaThanhFullSourceItem | undefined)
    .filter((item): item is BaThanhFullSourceItem => Boolean(item));
  const existingLaminateCodes = new Set(laminateDetails.map((item) => item.codeNormalized));
  const uniqueExtraLaminate = extraLaminate.filter((item, index, all) =>
    !existingLaminateCodes.has(item.codeNormalized) && all.findIndex((candidate) => candidate.codeNormalized === item.codeNormalized) === index);
  const allMelamineDetails = [...melamineDetails, ...uniqueExtraMelamine];
  const allLaminateDetails = [...laminateDetails, ...uniqueExtraLaminate];
  for (const extra of [...uniqueExtraMelamine, ...uniqueExtraLaminate]) knownProductSources.set(extra.codeNormalized, extra.sourceUrl);

  fullDiscovery.crawledAt = new Date().toISOString();
  fullDiscovery.discovered = pageResults.map((item) => {
    const discoveredItem = { ...item };
    delete discoveredItem.extraMelamine;
    delete discoveredItem.extraLaminate;
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
    total: allLaminateDetails.length,
    successful: allLaminateDetails.filter((item) => item.status === "PARSED").length,
    discoveredOutsideMap: allLaminateDetails.filter((item) =>
      !(fullDiscovery.laminateBaselineCodes as string[] | undefined)?.includes(item.codeNormalized)).length,
    rejected: laminateDetails.filter((item) => item.status === "REJECTED").length,
    failed: laminateDetails.filter((item) => item.status === "FAILED").length,
  };
  await fs.writeFile(path.join(IMPORT_DIR, "discovered-codes.json"), `${JSON.stringify(allMelamineDetails, null, 2)}\n`);
  await fs.writeFile(path.join(IMPORT_DIR, "discovered-laminate-codes.json"), `${JSON.stringify(allLaminateDetails, null, 2)}\n`);
  await fs.writeFile(fullDiscoveryPath, `${JSON.stringify(fullDiscovery, null, 2)}\n`);
  return { fullDiscovery, melamine: allMelamineDetails, details: allLaminateDetails };
}

if (process.argv[1]?.endsWith("crawl-full.ts")) {
  crawlBaThanhFull({ refresh: process.argv.includes("--refresh") }).then(({ fullDiscovery }) => {
    console.log(JSON.stringify({ command: "crawl:full", ...fullDiscovery.laminateCrawl }, null, 2));
  }).catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
