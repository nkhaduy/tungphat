import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const baseUrl = new URL(process.env.HOMEPAGE_PERF_URL || "http://127.0.0.1:4180/");
const reportPath = process.env.HOMEPAGE_PERF_REPORT;
const MiB = 1024 * 1024;
const profiles = [
  {
    name: "mobile",
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    totalBudget: 3.5 * MiB,
    imageBudget: 2.5 * MiB,
  },
  {
    name: "desktop",
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: false,
    totalBudget: 5 * MiB,
    imageBudget: 4 * MiB,
  },
];

function formatMiB(bytes) {
  return `${(bytes / MiB).toFixed(2)} MiB`;
}

function localPathname(url) {
  const parsed = new URL(url);
  return parsed.origin === baseUrl.origin ? decodeURIComponent(parsed.pathname) : "";
}

function hasWebpDerivative(url) {
  const pathname = localPathname(url);
  if (!pathname || !/\.(?:png|jpe?g)$/i.test(pathname) || pathname.includes("..")) return false;
  const webpPath = path.join(process.cwd(), "public", pathname.replace(/^\/+/, "").replace(/\.(?:png|jpe?g)$/i, ".webp"));
  return fs.existsSync(webpPath);
}

async function auditProfile(browser, profile) {
  const context = await browser.newContext({
    viewport: profile.viewport,
    deviceScaleFactor: profile.deviceScaleFactor,
    isMobile: profile.isMobile,
    hasTouch: profile.hasTouch,
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  const requests = new Map();
  const pageErrors = [];
  const consoleErrors = [];

  await cdp.send("Network.enable");
  await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
  cdp.on("Network.requestWillBeSent", (event) => {
    if (!requests.has(event.requestId)) {
      requests.set(event.requestId, {
        requestId: event.requestId,
        url: event.request.url,
        type: event.type,
        initiator: event.initiator?.type || "",
      });
    }
  });
  cdp.on("Network.responseReceived", (event) => {
    const request = requests.get(event.requestId) || { requestId: event.requestId };
    Object.assign(request, {
      url: event.response.url,
      status: event.response.status,
      mimeType: event.response.mimeType,
    });
    requests.set(event.requestId, request);
  });
  cdp.on("Network.loadingFinished", (event) => {
    const request = requests.get(event.requestId);
    if (request) {
      request.encodedDataLength = event.encodedDataLength;
      request.finishedAt = Date.now();
    }
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    consoleErrors.push({ text: message.text(), url: message.location().url || "" });
  });

  await page.addInitScript(() => {
    const originalGetRandomValues = Crypto.prototype.getRandomValues;
    Crypto.prototype.getRandomValues = function deterministicRandomValues(array) {
      const result = originalGetRandomValues.call(this, array);
      if (array.length) array[0] = 2;
      return result;
    };
    window.__homepageImageAudit = { lcp: null, cls: 0 };
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const entry = entries[entries.length - 1];
      if (!entry) return;
      window.__homepageImageAudit.lcp = {
        url: entry.url || "",
        currentSrc: entry.element?.currentSrc || "",
        tagName: entry.element?.tagName || "",
        startTime: entry.startTime,
        size: entry.size,
      };
    }).observe({ type: "largest-contentful-paint", buffered: true });
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) window.__homepageImageAudit.cls += entry.value;
      }
    }).observe({ type: "layout-shift", buffered: true });
  });

  const startedAt = Date.now();
  const response = await page.goto(baseUrl.href, { waitUntil: "networkidle" });
  if (!response || response.status() !== 200) {
    throw new Error(`${profile.name}: homepage trả HTTP ${response?.status() ?? "không xác định"}`);
  }
  await page.waitForTimeout(2000);
  const initialCutoff = Date.now();

  const initialDom = await page.evaluate(() => {
    // Keep the guard compatible with both the annotated hero markup and the
    // current Next/Image output, which does not wrap the image in <picture>.
    const heroImage =
      document.querySelector("[data-homepage-hero] picture img") ||
      document.querySelector('img[src*="/images/cnc-service-home"]');
    const hero =
      document.querySelector("[data-homepage-hero]") ||
      heroImage?.closest("section") ||
      heroImage?.parentElement;
    const heroPicture = heroImage?.closest("picture");
    const heroRect = hero?.getBoundingClientRect();
    const pictureRect = (heroPicture || heroImage?.parentElement)?.getBoundingClientRect();
    return {
      audit: window.__homepageImageAudit,
      hero: {
        desktopSources: hero?.getAttribute("data-hero-desktop-sources")?.split(",").filter(Boolean) || [],
        mobileSources: hero?.getAttribute("data-hero-mobile-sources")?.split(",").filter(Boolean) || [],
        currentSrc: heroImage?.currentSrc || "",
        loading: heroImage?.loading || "",
        fetchPriority: heroImage?.fetchPriority || "",
        width: Number(heroImage?.getAttribute("width") || heroImage?.naturalWidth || 0),
        height: Number(heroImage?.getAttribute("height") || heroImage?.naturalHeight || 0),
        naturalWidth: heroImage?.naturalWidth || 0,
        naturalHeight: heroImage?.naturalHeight || 0,
        renderedWidth: pictureRect?.width || 0,
        renderedHeight: pictureRect?.height || 0,
        sectionWidth: heroRect?.width || 0,
        sectionHeight: heroRect?.height || 0,
      },
      images: [...document.images].map((image) => {
        const rect = image.getBoundingClientRect();
        return {
          src: image.src,
          currentSrc: image.currentSrc,
          loading: image.loading,
          fetchPriority: image.fetchPriority,
          top: rect.top + scrollY,
          renderedWidth: rect.width,
          renderedHeight: rect.height,
        };
      }),
      preloads: [...document.querySelectorAll('link[rel="preload"][as="image"]')].map((link) => link.href),
    };
  });

  const pageHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  const scrollStep = Math.max(500, Math.floor(profile.viewport.height * 0.75));
  for (let y = profile.viewport.height; y < pageHeight; y += scrollStep) {
    await page.evaluate((nextY) => window.scrollTo(0, nextY), y);
    await page.waitForTimeout(180);
  }
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(1500);
  const finalAudit = await page.evaluate(() => window.__homepageImageAudit);

  const completed = [...requests.values()].filter((request) => request.finishedAt && request.finishedAt >= startedAt);
  const initialRequests = completed.filter((request) => request.finishedAt <= initialCutoff);
  const imageRequests = completed.filter((request) => request.type === "Image" || request.mimeType?.startsWith("image/"));
  const initialImages = initialRequests.filter((request) => request.type === "Image" || request.mimeType?.startsWith("image/"));
  const initialTotal = initialRequests.reduce((total, request) => total + (request.encodedDataLength || 0), 0);
  const initialImageTotal = initialImages.reduce((total, request) => total + (request.encodedDataLength || 0), 0);
  const fullImageTotal = imageRequests.reduce((total, request) => total + (request.encodedDataLength || 0), 0);
  const initialRequestedPaths = new Set(initialImages.map((request) => localPathname(request.url)).filter(Boolean));
  const failures = [];

  const unexpectedHeroPaths = profile.name === "mobile" ? initialDom.hero.desktopSources : initialDom.hero.mobileSources;
  const downloadedWrongHero = unexpectedHeroPaths.filter((source) => initialRequestedPaths.has(source));
  if (downloadedWrongHero.length) failures.push(`tải sai hero theo breakpoint: ${downloadedWrongHero.join(", ")}`);

  const unusedPreloads = initialDom.preloads.filter((href) => !imageRequests.some((request) => request.url === href));
  if (unusedPreloads.length) failures.push(`image preload không được dùng: ${unusedPreloads.join(", ")}`);

  const failedImages = imageRequests.filter((request) => (request.status || 0) >= 400);
  if (failedImages.length) failures.push(`image HTTP lỗi: ${failedImages.map((request) => `${request.status} ${request.url}`).join(", ")}`);

  if (initialDom.hero.loading === "lazy") failures.push(`hero/LCP image bị lazy-load: ${initialDom.hero.currentSrc}`);
  if (initialDom.hero.fetchPriority !== "high") failures.push(`hero ban đầu không có fetchpriority=high: ${initialDom.hero.currentSrc}`);
  if (
    initialDom.hero.width <= 0 ||
    initialDom.hero.height <= 0 ||
    initialDom.hero.naturalWidth <= 0 ||
    initialDom.hero.naturalHeight <= 0 ||
    initialDom.hero.renderedWidth <= 0 ||
    initialDom.hero.renderedHeight <= 0 ||
    initialDom.hero.sectionWidth <= 0 ||
    initialDom.hero.sectionHeight <= 0
  ) {
    failures.push(`hero thiếu kích thước/aspect ratio ổn định: ${JSON.stringify(initialDom.hero)}`);
  }

  const eagerBelowFold = initialDom.images.filter(
    (image) => image.loading !== "lazy" && image.top > profile.viewport.height * 1.5,
  );
  if (eagerBelowFold.length) {
    failures.push(`ảnh dưới fold tải eager: ${eagerBelowFold.map((image) => image.currentSrc || image.src).join(", ")}`);
  }

  const avoidableLargeRasters = imageRequests.filter(
    (request) => (request.encodedDataLength || 0) > 250 * 1024 && hasWebpDerivative(request.url),
  );
  if (avoidableLargeRasters.length) {
    failures.push(
      `PNG/JPEG lớn có WebP tương ứng: ${avoidableLargeRasters.map((request) => `${formatMiB(request.encodedDataLength || 0)} ${request.url}`).join(", ")}`,
    );
  }

  if (initialTotal > profile.totalBudget) {
    failures.push(`initial total ${formatMiB(initialTotal)} vượt budget ${formatMiB(profile.totalBudget)}`);
  }
  if (initialImageTotal > profile.imageBudget) {
    failures.push(`initial images ${formatMiB(initialImageTotal)} vượt budget ${formatMiB(profile.imageBudget)}`);
  }

  const relevantConsoleErrors = consoleErrors.filter(({ text, url }) =>
    /hydration|next\/image|uncaught|image (?:failed|error)/i.test(`${text} ${url}`),
  );
  if (pageErrors.length || relevantConsoleErrors.length) {
    failures.push(`console/runtime error: ${[...pageErrors, ...relevantConsoleErrors.map(({ text, url }) => `${text} ${url}`)].join(" | ")}`);
  }

  const result = {
    profile: profile.name,
    initialTotal,
    initialImageTotal,
    initialImageRequests: initialImages.length,
    fullImageTotal,
    fullImageRequests: imageRequests.length,
    lcp: initialDom.audit?.lcp || null,
    initialCls: initialDom.audit?.cls || 0,
    fullScrollCls: finalAudit?.cls || 0,
    hero: initialDom.hero,
    imagePreloads: initialDom.preloads,
    largestInitialImages: initialImages
      .toSorted((a, b) => (b.encodedDataLength || 0) - (a.encodedDataLength || 0))
      .slice(0, 10)
      .map((request) => ({ url: request.url, bytes: request.encodedDataLength || 0 })),
    failures,
  };

  await context.close();
  return result;
}

const browser = await chromium.launch({ headless: true });
let results;
try {
  results = [];
  for (const profile of profiles) results.push(await auditProfile(browser, profile));
} finally {
  await browser.close();
}

if (reportPath) fs.writeFileSync(reportPath, `${JSON.stringify(results, null, 2)}\n`);
for (const result of results) {
  console.log(
    `${result.profile}: initial ${formatMiB(result.initialTotal)}, images ${formatMiB(result.initialImageTotal)} (${result.initialImageRequests} requests), full-scroll images ${formatMiB(result.fullImageTotal)} (${result.fullImageRequests} requests), initial CLS ${result.initialCls.toFixed(4)}`,
  );
  for (const failure of result.failures) console.error(`- ${result.profile}: ${failure}`);
}

if (results.some((result) => result.failures.length)) process.exitCode = 1;
else console.log("Homepage image performance validation pass.");
