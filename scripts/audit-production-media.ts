import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium, type Page } from "playwright";
import {
  auditMediaReferences,
  extractMediaReferences,
  extractMediaReferencesFromPayload,
} from "../lib/media-cdn-audit";

const origin = (process.env.PRODUCTION_ORIGIN || "https://mdftungphat.com").replace(/\/$/u, "");
const cmsOrigin = (process.env.PAYLOAD_CMS_URL || "https://cms.mdftungphat.com").replace(/\/$/u, "");
const outputPath = path.resolve(process.env.MEDIA_CDN_AUDIT_JSON || "reports/media-cdn-production.json");
const exactPath = "/catalog/thanh-thuy/0330-mw-ambassador-1600w-f9875836c598.webp";
const exactUrl = `https://cdn.mdftungphat.com${exactPath}`;
const exactRoute = "/san-pham/melamine/thanh-thuy-0330-mw-ambassador/";
const exactCatalogueRoute = "/catalogue/thanh-thuy/melamine/0330/";
const cmsPayloadCollections = ["articles", "products", "pages", "projects"];
type AuditFailure = { layer: string; reference: string; reason: string };

function sitemapUrls(xml: string) {
  return [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/giu)].map((match) => match[1].replace(/&amp;/giu, "&").trim());
}

function productionRoutes(urls: string[]) {
  const routes = new Set([
    "/",
    "/catalogue/",
    "/san-pham/",
    "/thuong-hieu/thanh-thuy/",
    "/bai-viet/",
    "/du-an/",
    exactRoute,
    exactCatalogueRoute,
  ]);
  for (const value of urls) {
    const url = new URL(value, origin);
    if (url.origin === origin) routes.add(url.pathname);
  }
  return [...routes];
}

async function scrollPage(page: Page) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += Math.max(window.innerHeight * 0.8, 600)) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 80));
    }
    window.scrollTo(0, 0);
  });
}

async function browserMediaValues(page: Page) {
  return page.evaluate(() => {
    const values = new Set<string>();

    document.querySelectorAll("img, source, picture, link[rel='preload'], meta, script[type='application/ld+json'], a, area, [style], [data-src], [data-srcset]").forEach((element) => {
      [
        element.getAttribute("src"),
        element.getAttribute("srcset"),
        element.getAttribute("href"),
        element.getAttribute("content"),
        element.getAttribute("style"),
        element.getAttribute("data-src"),
        element.getAttribute("data-srcset"),
        element.getAttribute("imagesrcset"),
        element instanceof HTMLImageElement ? element.currentSrc : null,
        element instanceof HTMLScriptElement ? element.textContent : null,
        element instanceof HTMLLinkElement && element.as === "image" ? element.href : null,
        element instanceof HTMLPictureElement ? element.outerHTML : null,
      ].forEach((value) => {
        if (value?.trim()) values.add(value);
      });
    });

    document.querySelectorAll("*").forEach((element) => {
      const backgroundImage = getComputedStyle(element).backgroundImage;
      if (backgroundImage.trim()) values.add(backgroundImage);
    });

    return [...values];
  });
}

function hostCounts(references: Iterable<string>) {
  const counts = new Map<string, number>();
  for (const reference of new Set(references)) {
    try {
      const url = new URL(reference, origin);
      counts.set(url.hostname, (counts.get(url.hostname) || 0) + 1);
    } catch {
      // Non-URL values are ignored; the media audit handles relative paths.
    }
  }
  return Object.fromEntries([...counts.entries()].sort(([left], [right]) => left.localeCompare(right)));
}

function addReferences(target: Set<string>, references: Iterable<string>) {
  for (const reference of references) target.add(reference);
}

function observePage(
  page: Page,
  references: Set<string>,
  brokenReferences: Set<string>,
  consoleErrors: string[],
  routeReferences: Map<string, Set<string>>,
  activeRoute: { value: string },
) {
  const payloadTasks: Promise<void>[] = [];
  const add = (reference: string, route = activeRoute.value) => {
    references.add(reference);
    routeReferences.get(route)?.add(reference);
  };

  page.on("request", (request) => {
    add(request.url());
    const redirectedFrom = request.redirectedFrom();
    if (redirectedFrom) add(redirectedFrom.url());
  });
  page.on("response", (response) => {
    const responseUrl = response.url();
    add(responseUrl);
    if (response.status() >= 400 && auditMediaReferences([responseUrl]).inspected) brokenReferences.add(responseUrl);

    const contentType = response.headers()["content-type"] || "";
    const resourceType = response.request().resourceType();
    if (!["document", "fetch", "xhr", "stylesheet"].includes(resourceType) && !/json|html|css/iu.test(contentType)) return;
    const route = activeRoute.value;
    payloadTasks.push(
      response.text()
        .then((body) => extractMediaReferencesFromPayload(body).forEach((reference) => add(reference, route)))
        .catch(() => undefined),
    );
  });
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  return payloadTasks;
}

async function fetchMediaReferences(url: string, rawReferences: Set<string>, fetchFailures: Array<{ url: string; status: number }>) {
  const response = await fetch(url, { redirect: "manual", headers: { "user-agent": "TungPhatMediaCdnAudit/2.0" } });
  if (response.status < 200 || response.status >= 300) fetchFailures.push({ url, status: response.status });
  addReferences(rawReferences, extractMediaReferencesFromPayload(await response.text()));
}

async function main() {
  const sitemapResponse = await fetch(`${origin}/sitemap.xml`, { redirect: "error" });
  if (!sitemapResponse.ok) throw new Error(`Sitemap returned HTTP ${sitemapResponse.status}`);
  const routes = productionRoutes(sitemapUrls(await sitemapResponse.text()));
  const rawReferences = new Set<string>();
  const fetchFailures: Array<{ url: string; status: number }> = [];

  for (const route of [...routes, "/knowledge.json"]) {
    await fetchMediaReferences(`${origin}${route}`, rawReferences, fetchFailures);
  }
  for (const route of routes) {
    const response = await fetch(`${origin}${route}`, {
      redirect: "manual",
      headers: { RSC: "1", "Next-Router-Prefetch": "1", "user-agent": "TungPhatMediaCdnAudit/2.0" },
    });
    addReferences(rawReferences, extractMediaReferencesFromPayload(await response.text()));
  }
  for (const collection of cmsPayloadCollections) {
    await fetchMediaReferences(`${cmsOrigin}/api/${collection}?limit=100&depth=1&sort=slug`, rawReferences, fetchFailures);
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const runtimeReferences = new Set<string>();
  const domReferences = new Set<string>();
  const brokenReferences = new Set<string>();
  const consoleErrors: string[] = [];
  const routeReferences = new Map<string, Set<string>>();
  const activeRoute = { value: "unknown" };
  const payloadTasks = observePage(page, runtimeReferences, brokenReferences, consoleErrors, routeReferences, activeRoute);

  let browserPagesChecked = 0;
  for (const route of routes) {
    activeRoute.value = route;
    routeReferences.set(route, new Set());
    await page.goto(`${origin}${route}`, { waitUntil: "domcontentloaded", timeout: 60_000 });
    browserPagesChecked += 1;
    await scrollPage(page);
    await page.waitForTimeout(300);
    const routeSet = routeReferences.get(route) || new Set<string>();
    const domValues = await browserMediaValues(page);
    addReferences(domReferences, domValues);
    addReferences(routeSet, domValues);
    const htmlValues = extractMediaReferences(await page.content());
    addReferences(domReferences, htmlValues);
    addReferences(routeSet, htmlValues);
    const performanceValues = await page.evaluate(() => performance.getEntriesByType("resource").map((entry) => entry.name));
    addReferences(runtimeReferences, performanceValues);
    addReferences(routeSet, performanceValues);
  }

  const mobileReferences = new Set<string>();
  const mobileDomReferences = new Set<string>();
  const mobileBrokenReferences = new Set<string>();
  const mobileRouteReferences = new Map<string, Set<string>>();
  const mobileActiveRoute = { value: "mobile:/" };
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    hasTouch: true,
    isMobile: true,
  });
  const mobilePage = await mobileContext.newPage();
  const mobilePayloadTasks = observePage(mobilePage, mobileReferences, mobileBrokenReferences, consoleErrors, mobileRouteReferences, mobileActiveRoute);
  mobileRouteReferences.set(mobileActiveRoute.value, new Set());
  await mobilePage.goto(`${origin}/`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  browserPagesChecked += 1;
  await scrollPage(mobilePage);
  await mobilePage.waitForTimeout(300);
  const mobileRouteSet = mobileRouteReferences.get(mobileActiveRoute.value) || new Set<string>();
  const mobileDomValues = await browserMediaValues(mobilePage);
  addReferences(mobileDomReferences, mobileDomValues);
  addReferences(mobileRouteSet, mobileDomValues);
  const mobileHtmlValues = extractMediaReferences(await mobilePage.content());
  addReferences(mobileDomReferences, mobileHtmlValues);
  addReferences(mobileRouteSet, mobileHtmlValues);
  const mobilePerformanceValues = await mobilePage.evaluate(() => performance.getEntriesByType("resource").map((entry) => entry.name));
  addReferences(mobileReferences, mobilePerformanceValues);
  addReferences(mobileRouteSet, mobilePerformanceValues);
  mobileActiveRoute.value = `mobile:${exactCatalogueRoute}`;
  mobileRouteReferences.set(mobileActiveRoute.value, new Set());
  await mobilePage.goto(`${origin}${exactCatalogueRoute}`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  browserPagesChecked += 1;
  await scrollPage(mobilePage);
  await mobilePage.waitForTimeout(300);
  const mobileExactRouteSet = mobileRouteReferences.get(mobileActiveRoute.value) || new Set<string>();
  const mobileExactDomValues = await browserMediaValues(mobilePage);
  addReferences(mobileDomReferences, mobileExactDomValues);
  addReferences(mobileExactRouteSet, mobileExactDomValues);
  const mobileExactHtmlValues = extractMediaReferences(await mobilePage.content());
  addReferences(mobileDomReferences, mobileExactHtmlValues);
  addReferences(mobileExactRouteSet, mobileExactHtmlValues);
  const mobileExactPerformanceValues = await mobilePage.evaluate(() => performance.getEntriesByType("resource").map((entry) => entry.name));
  addReferences(mobileReferences, mobileExactPerformanceValues);
  addReferences(mobileExactRouteSet, mobileExactPerformanceValues);

  await Promise.all([...payloadTasks, ...mobilePayloadTasks]);
  await browser.close();

  const exactResponse = await fetch(exactUrl, { method: "HEAD", redirect: "manual" });
  const rawAudit = auditMediaReferences(rawReferences);
  const domAudit = auditMediaReferences(domReferences);
  const runtimeAudit = auditMediaReferences(runtimeReferences, brokenReferences);
  const mobileAudit = auditMediaReferences(mobileReferences, mobileBrokenReferences);
  const homepageReferences = new Set([
    ...(routeReferences.get("/") || []),
    ...(mobileRouteReferences.get("mobile:/") || []),
  ]);
  const homepageAudit = auditMediaReferences(homepageReferences);
  const runtimeSummary = {
    "cdn.mdftungphat.com": runtimeAudit.cdn,
    "cms.mdftungphat.com media": runtimeAudit.cms,
    "mdftungphat.com catalog/media": runtimeAudit.mainDomain,
    "legacy R2": runtimeAudit.legacyR2,
    broken: runtimeAudit.broken,
  };
  const exactRuntime = [...runtimeReferences].some((reference) => {
    try {
      const url = new URL(reference);
      return url.hostname === "cdn.mdftungphat.com" && url.pathname === exactPath;
    } catch {
      return false;
    }
  });
  const mobileExactRuntime = [...mobileReferences].some((reference) => {
    try {
      const url = new URL(reference);
      return url.hostname === "cdn.mdftungphat.com" && url.pathname === exactPath;
    } catch {
      return false;
    }
  });
  const failures: AuditFailure[] = [
    ...rawAudit.failures.map((failure) => ({ layer: "html-rsc-api-cms-payload", ...failure })),
    ...domAudit.failures.map((failure) => ({ layer: "browser-dom", ...failure })),
    ...runtimeAudit.failures.map((failure) => ({ layer: "browser-runtime", ...failure })),
    ...mobileAudit.failures.map((failure) => ({ layer: "browser-mobile", ...failure })),
  ];
  if (homepageAudit.cms > 0) failures.push({ layer: "homepage-runtime", reference: origin, reason: `cms-media-${homepageAudit.cms}` });
  if (!exactRuntime) failures.push({ layer: "exact-sample", reference: exactUrl, reason: "not-requested" });
  if (!mobileExactRuntime) failures.push({ layer: "exact-sample-mobile", reference: exactUrl, reason: "not-requested" });
  if (exactResponse.status !== 200) failures.push({ layer: "exact-sample", reference: exactUrl, reason: `http-${exactResponse.status}` });
  if (!exactResponse.headers.get("content-type")?.toLowerCase().startsWith("image/webp")) {
    failures.push({ layer: "exact-sample", reference: exactUrl, reason: "invalid-content-type" });
  }
  fetchFailures.forEach((failure) => failures.push({ layer: "crawl", reference: failure.url, reason: `http-${failure.status}` }));

  const result = {
    checkedAt: new Date().toISOString(),
    origin,
    cmsOrigin,
    pagesCrawled: routes.length + 1,
    browserPages: browserPagesChecked,
    routes,
    homepage: { ...homepageAudit, runtimeHostCounts: hostCounts(homepageReferences) },
    raw: rawAudit,
    dom: domAudit,
    runtime: { ...runtimeAudit, hostCounts: hostCounts(runtimeReferences) },
    runtimeSummary,
    mobile: {
      viewport: "390x844@2x",
      exactSampleRequested: mobileExactRuntime,
      ...mobileAudit,
      hostCounts: hostCounts(mobileReferences),
    },
    exactSample: {
      url: exactUrl,
      runtimeRequested: exactRuntime,
      status: exactResponse.status,
      contentType: exactResponse.headers.get("content-type"),
      contentLength: exactResponse.headers.get("content-length"),
      etag: exactResponse.headers.get("etag"),
      cacheControl: exactResponse.headers.get("cache-control"),
      cfCacheStatus: exactResponse.headers.get("cf-cache-status"),
    },
    consoleErrors: [...new Set(consoleErrors)].slice(0, 30),
    failures,
  };
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify(result, null, 2));
  if (failures.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
