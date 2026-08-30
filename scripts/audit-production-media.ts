import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium, type Page } from "playwright";
import { auditMediaReferences, extractMediaReferences } from "../lib/media-cdn-audit";

const origin = (process.env.PRODUCTION_ORIGIN || "https://mdftungphat.com").replace(/\/$/u, "");
const outputPath = path.resolve(process.env.MEDIA_CDN_AUDIT_JSON || "reports/media-cdn-production.json");
const exactPath = "/catalog/thanh-thuy/0330-mw-ambassador-1600w-f9875836c598.webp";
const exactUrl = `https://cdn.mdftungphat.com${exactPath}`;
const exactRoute = "/san-pham/melamine/thanh-thuy-0330-mw-ambassador/";
const exactCatalogueRoute = "/catalogue/thanh-thuy/melamine/0330/";
const minimumRuntimeMedia = Number(process.env.MEDIA_CDN_MIN_RUNTIME_REQUESTS || 30);
type AuditFailure = { layer: string; reference: string; reason: string };

function sitemapUrls(xml: string) {
  return [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/giu)].map((match) => match[1].replace(/&amp;/giu, "&").trim());
}

function representativeRoutes(urls: string[]) {
  const routes = new Set(["/", "/catalogue/", "/san-pham/", "/thuong-hieu/thanh-thuy/", "/bai-viet/", "/du-an/", exactRoute, "/catalogue/thanh-thuy/melamine/0330/"]);
  const groups: Array<[RegExp, number]> = [
    [/\/catalogue\//u, 14],
    [/\/san-pham\//u, 14],
    [/\/thuong-hieu\//u, 6],
    [/\/bai-viet\//u, 6],
    [/\/du-an\//u, 6],
  ];
  for (const [pattern, limit] of groups) {
    let count = 0;
    for (const value of urls) {
      const url = new URL(value, origin);
      if (url.origin !== origin || !pattern.test(url.pathname) || routes.has(url.pathname)) continue;
      routes.add(url.pathname);
      count += 1;
      if (count >= limit) break;
    }
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

function observePage(
  page: Page,
  references: Set<string>,
  brokenReferences: Set<string>,
  consoleErrors: string[],
) {
  page.on("request", (request) => {
    if (["image", "media", "fetch"].includes(request.resourceType())) references.add(request.url());
    const redirectedFrom = request.redirectedFrom();
    if (redirectedFrom) references.add(redirectedFrom.url());
  });
  page.on("response", (response) => {
    if (response.status() >= 400 && auditMediaReferences([response.url()]).inspected) brokenReferences.add(response.url());
  });
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
}

async function main() {
  const sitemapResponse = await fetch(`${origin}/sitemap.xml`, { redirect: "error" });
  if (!sitemapResponse.ok) throw new Error(`Sitemap returned HTTP ${sitemapResponse.status}`);
  const routes = representativeRoutes(sitemapUrls(await sitemapResponse.text()));
  const rawReferences = new Set<string>();
  const fetchFailures: Array<{ url: string; status: number }> = [];

  for (const route of [...routes, "/knowledge.json"]) {
    const response = await fetch(`${origin}${route}`, { redirect: "manual", headers: { "user-agent": "TungPhatMediaCdnAudit/1.0" } });
    if (response.status < 200 || response.status >= 300) fetchFailures.push({ url: `${origin}${route}`, status: response.status });
    const body = await response.text();
    extractMediaReferences(body).forEach((reference) => rawReferences.add(reference));
  }

  for (const route of routes.slice(0, 12)) {
    const response = await fetch(`${origin}${route}`, {
      redirect: "manual",
      headers: { RSC: "1", "Next-Router-Prefetch": "1", "user-agent": "TungPhatMediaCdnAudit/1.0" },
    });
    extractMediaReferences(await response.text()).forEach((reference) => rawReferences.add(reference));
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const runtimeReferences = new Set<string>();
  const domReferences = new Set<string>();
  const brokenReferences = new Set<string>();
  const consoleErrors: string[] = [];
  observePage(page, runtimeReferences, brokenReferences, consoleErrors);

  const browserRoutes = [exactRoute, "/catalogue/", "/thuong-hieu/thanh-thuy/", ...routes.filter((route) => route !== exactRoute)].slice(0, 16);
  let browserPagesChecked = 0;
  for (const route of browserRoutes) {
    await page.goto(`${origin}${route}`, { waitUntil: "domcontentloaded", timeout: 60_000 });
    browserPagesChecked += 1;
    await scrollPage(page);
    await page.waitForTimeout(300);
    const content = await page.content();
    extractMediaReferences(content).forEach((reference) => domReferences.add(reference));
    const performanceUrls = await page.evaluate(() => performance.getEntriesByType("resource").map((entry) => entry.name));
    performanceUrls.forEach((reference) => runtimeReferences.add(reference));
    if (auditMediaReferences(runtimeReferences).inspected >= minimumRuntimeMedia) break;
  }

  const mobileReferences = new Set<string>();
  const mobileDomReferences = new Set<string>();
  const mobileBrokenReferences = new Set<string>();
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    hasTouch: true,
    isMobile: true,
  });
  const mobilePage = await mobileContext.newPage();
  observePage(mobilePage, mobileReferences, mobileBrokenReferences, consoleErrors);
  await mobilePage.goto(`${origin}${exactCatalogueRoute}`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  browserPagesChecked += 1;
  await scrollPage(mobilePage);
  await mobilePage.waitForTimeout(300);
  extractMediaReferences(await mobilePage.content()).forEach((reference) => mobileDomReferences.add(reference));
  const mobilePerformanceUrls = await mobilePage.evaluate(() => performance.getEntriesByType("resource").map((entry) => entry.name));
  mobilePerformanceUrls.forEach((reference) => mobileReferences.add(reference));
  mobileReferences.forEach((reference) => runtimeReferences.add(reference));
  mobileDomReferences.forEach((reference) => domReferences.add(reference));
  mobileBrokenReferences.forEach((reference) => brokenReferences.add(reference));
  await browser.close();

  const exactResponse = await fetch(exactUrl, { method: "HEAD", redirect: "manual" });
  const exactRuntime = [...runtimeReferences].some((reference) => {
    try {
      const url = new URL(reference);
      return url.hostname === "cdn.mdftungphat.com" && url.pathname === exactPath;
    } catch {
      return false;
    }
  });
  const rawAudit = auditMediaReferences(rawReferences);
  const domAudit = auditMediaReferences(domReferences);
  const runtimeAudit = auditMediaReferences(runtimeReferences, brokenReferences);
  const mobileAudit = auditMediaReferences(mobileReferences, mobileBrokenReferences);
  const mobileExactRuntime = [...mobileReferences].some((reference) => {
    try {
      const url = new URL(reference);
      return url.hostname === "cdn.mdftungphat.com" && url.pathname === exactPath;
    } catch {
      return false;
    }
  });
  const failures: AuditFailure[] = [
    ...rawAudit.failures.map((failure) => ({ layer: "html-rsc-api", ...failure })),
    ...domAudit.failures.map((failure) => ({ layer: "browser-dom", ...failure })),
    ...runtimeAudit.failures.map((failure) => ({ layer: "browser-runtime", ...failure })),
    ...mobileAudit.failures.map((failure) => ({ layer: "browser-mobile", ...failure })),
  ];
  if (!exactRuntime) failures.push({ layer: "exact-sample", reference: exactUrl, reason: "not-requested" });
  if (!mobileExactRuntime) failures.push({ layer: "exact-sample-mobile", reference: exactUrl, reason: "not-requested" });
  if (exactResponse.status !== 200) failures.push({ layer: "exact-sample", reference: exactUrl, reason: `http-${exactResponse.status}` });
  if (!exactResponse.headers.get("content-type")?.toLowerCase().startsWith("image/webp")) {
    failures.push({ layer: "exact-sample", reference: exactUrl, reason: "invalid-content-type" });
  }
  if (runtimeAudit.inspected < minimumRuntimeMedia) {
    failures.push({ layer: "browser-runtime", reference: origin, reason: `only-${runtimeAudit.inspected}-media-resources` });
  }
  fetchFailures.forEach((failure) => failures.push({ layer: "crawl", reference: failure.url, reason: `http-${failure.status}` }));

  const result = {
    checkedAt: new Date().toISOString(),
    origin,
    pagesCrawled: routes.length + 1,
    browserPages: browserPagesChecked,
    raw: rawAudit,
    dom: domAudit,
    runtime: runtimeAudit,
    mobile: {
      viewport: "390x844@2x",
      exactSampleRequested: mobileExactRuntime,
      ...mobileAudit,
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
