import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { chromium } from "@playwright/test";

export async function directRequest(url) {
  const response = await fetch(url, {
    redirect: "manual",
    headers: { Accept: "text/html" },
  });
  return {
    status: response.status,
    location: response.headers.get("location"),
    response,
  };
}

export function auditSchema(value, prohibitedKeys, audit = { types: [], prohibitedKeys: [] }) {
  if (!value || typeof value !== "object") return audit;
  if (Array.isArray(value)) {
    for (const item of value) auditSchema(item, prohibitedKeys, audit);
    return audit;
  }

  const type = value["@type"];
  if (typeof type === "string") audit.types.push(type);
  if (Array.isArray(type)) audit.types.push(...type.filter((item) => typeof item === "string"));

  for (const [key, child] of Object.entries(value)) {
    if (prohibitedKeys.has(key.toLowerCase())) audit.prohibitedKeys.push(key);
    auditSchema(child, prohibitedKeys, audit);
  }
  return audit;
}

export function headingHierarchyErrors(headings) {
  const errors = [];
  for (let index = 1; index < headings.length; index += 1) {
    const previous = headings[index - 1];
    const current = headings[index];
    if (current.level - previous.level > 1) {
      errors.push(`Heading level nhảy từ H${previous.level} "${previous.text}" sang H${current.level} "${current.text}".`);
    }
  }
  return errors;
}

export function hasAffirmativeClaim(text, pattern) {
  return text.split(/[.!?;\n]/u).some((sentence) => {
    const match = pattern.exec(sentence);
    pattern.lastIndex = 0;
    if (!match) return false;
    const before = sentence.slice(0, match.index);
    return !/(?:không|chưa|không thể|không được|không nên|không mặc định|không đồng nghĩa|không khẳng định)[^.!?;]{0,100}$/iu.test(before);
  });
}

export function schemaNodes(value, nodes = []) {
  if (!value || typeof value !== "object") return nodes;
  if (Array.isArray(value)) {
    for (const item of value) schemaNodes(item, nodes);
    return nodes;
  }
  nodes.push(value);
  for (const child of Object.values(value)) schemaNodes(child, nodes);
  return nodes;
}

export function fileSha256(file) {
  return createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

export function summarizeProductAudit({ direct, results, prohibitedSchemaKeys }) {
  const desktop = results.desktop;
  const schemaAudit = desktop.schemas.reduce(
    (result, schema) => auditSchema(schema, prohibitedSchemaKeys, result),
    { types: [], prohibitedKeys: [] },
  );
  return {
    http: direct.status,
    location: direct.location,
    title: desktop.title,
    description: desktop.description,
    canonical: desktop.canonical,
    robots: desktop.robots,
    ogUrl: desktop.ogUrl,
    mainWords: desktop.mainWords,
    headings: desktop.headings,
    tables: desktop.tables.length,
    tableDetails: desktop.tables,
    images: desktop.images,
    internalLinks: desktop.internalLinks,
    uniqueInternalTargets: [...new Set(desktop.internalLinks.map((link) => link.pathname))],
    faqCount: desktop.faqCount,
    schemaTypes: [...new Set(schemaAudit.types)],
    prohibitedSchemaKeys: [...new Set(schemaAudit.prohibitedKeys)],
    ctas: desktop.ctas,
    desktop: {
      pageWidth: desktop.pageWidth,
      viewportWidth: desktop.viewportWidth,
      pageHeight: desktop.pageHeight,
      cls: desktop.cls,
      consoleErrors: desktop.consoleErrors,
      pageErrors: desktop.pageErrors,
      failedRequests: desktop.failedRequests,
      errorResponses: desktop.errorResponses,
    },
    mobile: {
      pageWidth: results.mobile.pageWidth,
      bodyWidth: results.mobile.bodyWidth,
      viewportWidth: results.mobile.viewportWidth,
      pageHeight: results.mobile.pageHeight,
      cls: results.mobile.cls,
      consoleErrors: results.mobile.consoleErrors,
      pageErrors: results.mobile.pageErrors,
      failedRequests: results.mobile.failedRequests,
      errorResponses: results.mobile.errorResponses,
    },
    schemaAudit,
  };
}

export async function validateProductPageAudit({
  audit,
  report,
  origin,
  routePath,
  canonicalUrl,
  expectedTitle,
  expectedDescription,
  baselineWords,
  minWords,
  maxWords,
  minTables,
  expectedFaqCount,
  requiredLinks,
  requiredHeadingPatterns,
  expectedCtas,
  forbiddenClaimPatterns,
  fabricatedSpecPatterns,
  placeholderPatterns,
  nonexistentRoutePattern,
  requiredSchemaTypes = ["BreadcrumbList", "Product", "FAQPage"],
}) {
  const errors = [];
  const check = (condition, message) => {
    if (!condition) errors.push(message);
  };
  const desktop = audit.results.desktop;
  const mobile = audit.results.mobile;

  check(audit.direct.status === 200, `${routePath} phải trả HTTP 200 trực tiếp; nhận ${audit.direct.status}.`);
  check(!audit.direct.location, `${routePath} không được redirect; Location=${audit.direct.location ?? "-"}.`);
  for (const [viewportName, metrics] of Object.entries(audit.results)) {
    check(metrics.navigationStatus === 200, `${viewportName}: navigation phải trả HTTP 200.`);
    check(metrics.consoleErrors.length === 0, `${viewportName}: console errors: ${metrics.consoleErrors.join(" | ") || "-"}.`);
    check(metrics.pageErrors.length === 0, `${viewportName}: runtime errors: ${metrics.pageErrors.join(" | ") || "-"}.`);
    check(metrics.failedRequests.length === 0, `${viewportName}: request failures: ${metrics.failedRequests.join(" | ") || "-"}.`);
    check(metrics.errorResponses.length === 0, `${viewportName}: HTTP resource errors: ${metrics.errorResponses.join(" | ") || "-"}.`);
    check(metrics.cls < 0.1, `${viewportName}: CLS ${metrics.cls.toFixed(4)} vượt 0.1.`);
    for (const image of metrics.images) {
      check(image.alt.trim().length > 0, `${viewportName}: ảnh thiếu alt: ${image.src}.`);
      check(image.complete && image.naturalWidth > 0 && image.naturalHeight > 0, `${viewportName}: ảnh hỏng: ${image.src}.`);
      check(image.renderedWidth > 0 && image.renderedHeight > 0, `${viewportName}: ảnh không có kích thước render: ${image.src}.`);
    }
  }

  check(mobile.pageWidth <= mobile.viewportWidth + 1, `Mobile overflow: document=${mobile.pageWidth}px, viewport=${mobile.viewportWidth}px.`);
  check(mobile.bodyWidth <= mobile.viewportWidth + 1, `Mobile overflow: body=${mobile.bodyWidth}px, viewport=${mobile.viewportWidth}px.`);
  for (const [index, table] of mobile.tables.entries()) {
    check(table.containerWidth <= mobile.viewportWidth + 1, `Mobile: vùng chứa bảng ${index + 1} vượt viewport.`);
    const needsLocalScroll = table.scrollWidth > table.clientWidth + 1 || table.width > table.containerClientWidth + 1;
    check(!needsLocalScroll || ["auto", "scroll"].includes(table.containerOverflowX), `Mobile: bảng ${index + 1} thiếu scroll cục bộ.`);
  }

  check(desktop.title === expectedTitle, `Title không đúng intent: ${desktop.title}.`);
  check(desktop.description === expectedDescription, "Meta description không khớp nội dung được duyệt.");
  check(desktop.canonical === canonicalUrl, `Canonical phải là ${canonicalUrl}; nhận ${desktop.canonical || "-"}.`);
  check(desktop.ogUrl === canonicalUrl, `og:url phải là ${canonicalUrl}; nhận ${desktop.ogUrl || "-"}.`);
  check(/(?:^|,\s*)index(?:\s*,|$)/iu.test(desktop.robots), `Robots phải chứa index; nhận ${desktop.robots || "-"}.`);
  check(/(?:^|,\s*)follow(?:\s*,|$)/iu.test(desktop.robots), `Robots phải chứa follow; nhận ${desktop.robots || "-"}.`);
  check(!/noindex/iu.test(desktop.robots), `Robots không được chứa noindex; nhận ${desktop.robots}.`);

  const h1 = desktop.headings.filter((heading) => heading.level === 1);
  check(h1.length === 1, `Cần đúng một H1; nhận ${h1.length}.`);
  for (const error of headingHierarchyErrors(desktop.headings)) errors.push(error);
  for (const pattern of requiredHeadingPatterns) check(desktop.headings.some((heading) => pattern.test(heading.text)), `Thiếu heading khớp ${pattern}.`);
  check(desktop.mainWords > baselineWords, `Main content phải sâu hơn baseline ${baselineWords}; nhận ${desktop.mainWords}.`);
  check(desktop.mainWords >= minWords, `Main content cần tối thiểu ${minWords.toLocaleString("vi-VN")} từ; nhận ${desktop.mainWords}.`);
  check(desktop.mainWords <= maxWords, `Main content vượt ${maxWords.toLocaleString("vi-VN")} từ; nhận ${desktop.mainWords}.`);
  check(desktop.tables.length >= minTables, `Cần ít nhất ${minTables} bảng semantic; nhận ${desktop.tables.length}.`);
  for (const [index, table] of desktop.tables.entries()) {
    check(table.headers >= 2, `Bảng ${index + 1} thiếu header semantic <th>.`);
    check(table.rows >= 1, `Bảng ${index + 1} không có dữ liệu trong <tbody>.`);
  }
  check(desktop.faqCount === expectedFaqCount, `FAQ hiển thị phải giữ đúng ${expectedFaqCount} câu; nhận ${desktop.faqCount}.`);
  for (const pattern of placeholderPatterns) check(!pattern.test(desktop.mainText), `Phát hiện placeholder: ${pattern}.`);
  for (const pattern of forbiddenClaimPatterns) check(!hasAffirmativeClaim(desktop.mainText, pattern), `Phát hiện affirmative forbidden claim: ${pattern}.`);
  for (const pattern of fabricatedSpecPatterns) check(!pattern.test(desktop.mainText), `Phát hiện dữ liệu chưa xác minh: ${pattern}.`);
  check(!/\b\d[\d.,]*\s*(?:đ|vnđ|vnd)\b/iu.test(desktop.mainText), "Phát hiện giá tiền trong main content.");

  const contentPaths = new Set(desktop.internalLinks.map((link) => link.pathname));
  for (const requiredPath of requiredLinks) check(contentPaths.has(requiredPath), `Thiếu internal link tới ${requiredPath}.`);
  for (const pathname of contentPaths) {
    if (pathname !== "/") check(pathname.endsWith("/"), `Internal link thiếu trailing slash: ${pathname}.`);
    check(!nonexistentRoutePattern.test(pathname), `Không được link tới route loại gỗ chưa tồn tại: ${pathname}.`);
    nonexistentRoutePattern.lastIndex = 0;
    const response = await directRequest(new URL(pathname, origin));
    check(response.status === 200, `Internal link ${pathname} phải trả 200; nhận ${response.status}.`);
    check(!response.location, `Internal link ${pathname} redirect tới ${response.location}.`);
  }
  for (const image of desktop.images) {
    const response = await directRequest(new URL(image.src, audit.pageUrl));
    check(response.status === 200, `Ảnh ${image.src} phải trả 200; nhận ${response.status}.`);
    check(!response.location, `Ảnh ${image.src} không được redirect.`);
  }

  for (const requiredType of requiredSchemaTypes) check(report.schemaTypes.includes(requiredType), `Thiếu schema ${requiredType}.`);
  check(!report.schemaTypes.includes("CollectionPage"), "Product landing không được đổi thành CollectionPage.");
  check(!report.schemaTypes.includes("Offer"), "Không được có Offer schema khi chưa có dữ liệu xác minh.");
  check(report.prohibitedSchemaKeys.length === 0, `Schema chứa field chưa xác minh: ${report.prohibitedSchemaKeys.join(", ")}.`);
  const productNodes = desktop.schemas.flatMap((schema) => schemaNodes(schema)).filter((node) => node["@type"] === "Product");
  check(productNodes.length === 1, `Cần đúng một Product node; nhận ${productNodes.length}.`);
  check(productNodes.every((node) => !("brand" in node)), "Product schema không được thêm brand chưa xác minh.");

  check(desktop.ctas.length === expectedCtas.length, `CTA count thay đổi: baseline ${expectedCtas.length}, nhận ${desktop.ctas.length}.`);
  const unmatchedCtas = [...desktop.ctas];
  for (const expected of expectedCtas) {
    const index = unmatchedCtas.findIndex((cta) => cta.href === expected.href && cta.event === expected.event && cta.location === expected.location && cta.target === expected.target);
    check(index >= 0, `CTA bị thay đổi: ${JSON.stringify(expected)}.`);
    if (index >= 0) unmatchedCtas.splice(index, 1);
  }
  check(desktop.emailLinks.length === 0, `Email CTA thay đổi; nhận ${desktop.emailLinks.join(", ")}.`);
  return errors;
}

export async function auditProductPage({ origin, routePath, screenshotDirectory, screenshotPrefix }) {
  const pageUrl = new URL(routePath, origin);
  const direct = await directRequest(pageUrl);
  const browser = await chromium.launch({ headless: true });
  const viewports = {
    desktop: { width: 1440, height: 900 },
    mobile: { width: 390, height: 844 },
  };
  const results = {};

  try {
    if (screenshotDirectory) fs.mkdirSync(screenshotDirectory, { recursive: true });

    for (const [viewportName, viewport] of Object.entries(viewports)) {
      const page = await browser.newPage({ viewport });
      const consoleErrors = [];
      const pageErrors = [];
      const failedRequests = [];
      const errorResponses = [];

      page.on("console", (message) => {
        if (message.type() === "error") consoleErrors.push(message.text());
      });
      page.on("pageerror", (error) => pageErrors.push(error.message));
      page.on("requestfailed", (request) => {
        if (request.url().startsWith(origin.origin)) {
          failedRequests.push(`${request.method()} ${request.url()}: ${request.failure()?.errorText ?? "failed"}`);
        }
      });
      page.on("response", (response) => {
        if (response.url().startsWith(origin.origin) && response.status() >= 400) {
          errorResponses.push(`${response.status()} ${response.url()}`);
        }
      });
      await page.addInitScript(() => {
        window.__productPageVitals = { cls: 0 };
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) window.__productPageVitals.cls += entry.value || 0;
          }
        }).observe({ type: "layout-shift", buffered: true });
      });

      const navigation = await page.goto(pageUrl.href, { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(300);

      const metrics = await page.evaluate(() => {
        const main = document.querySelector("main");
        const mainText = (main?.innerText ?? "").replace(/\s+/gu, " ").trim();
        const internalLinks = [...(main?.querySelectorAll("a[href]") ?? [])]
          .map((anchor) => {
            const href = anchor.getAttribute("href") ?? "";
            if (/^(?:tel:|mailto:|sms:|javascript:|#)/iu.test(href)) return null;
            try {
              const url = new URL(href, window.location.href);
              if (url.origin !== window.location.origin) return null;
              return {
                text: (anchor.textContent ?? "").replace(/\s+/gu, " ").trim(),
                href,
                pathname: url.pathname,
              };
            } catch {
              return null;
            }
          })
          .filter(Boolean);
        const schemas = [...document.querySelectorAll('script[type="application/ld+json"]')]
          .map((script) => {
            try {
              return JSON.parse(script.textContent ?? "null");
            } catch {
              return null;
            }
          })
          .filter(Boolean);
        const tables = [...(main?.querySelectorAll("table") ?? [])].map((table) => {
          const rect = table.getBoundingClientRect();
          const container = table.parentElement;
          const containerRect = container?.getBoundingClientRect();
          return {
            headers: table.querySelectorAll("th").length,
            rows: table.querySelectorAll("tbody tr").length,
            width: rect.width,
            scrollWidth: table.scrollWidth,
            clientWidth: table.clientWidth,
            containerWidth: containerRect?.width ?? 0,
            containerScrollWidth: container?.scrollWidth ?? 0,
            containerClientWidth: container?.clientWidth ?? 0,
            containerOverflowX: container ? getComputedStyle(container).overflowX : "visible",
          };
        });
        const faqCount = document.querySelectorAll("main details").length;

        return {
          title: document.title,
          description: document.querySelector('meta[name="description"]')?.getAttribute("content") ?? "",
          canonical: document.querySelector('link[rel="canonical"]')?.getAttribute("href") ?? "",
          robots: document.querySelector('meta[name="robots"]')?.getAttribute("content") ?? "",
          ogUrl: document.querySelector('meta[property="og:url"]')?.getAttribute("content") ?? "",
          headings: [...(main?.querySelectorAll("h1, h2, h3, h4, h5, h6") ?? [])].map((heading) => ({
            level: Number(heading.tagName.slice(1)),
            text: (heading.textContent ?? "").replace(/\s+/gu, " ").trim(),
          })),
          mainWords: mainText ? mainText.split(/\s+/u).length : 0,
          mainText,
          internalLinks,
          tables,
          faqCount,
          images: [...(main?.querySelectorAll("img") ?? [])].map((image) => ({
            alt: image.alt,
            src: image.currentSrc || image.src,
            sourceSrc: image.getAttribute("src") ?? "",
            loading: image.loading,
            complete: image.complete,
            naturalWidth: image.naturalWidth,
            naturalHeight: image.naturalHeight,
            renderedWidth: image.getBoundingClientRect().width,
            renderedHeight: image.getBoundingClientRect().height,
            objectFit: getComputedStyle(image).objectFit,
          })),
          schemas,
          ctas: [...(main?.querySelectorAll("a[data-track-event]") ?? [])].map((anchor) => ({
            text: (anchor.textContent ?? "").replace(/\s+/gu, " ").trim(),
            href: anchor.getAttribute("href") ?? "",
            event: anchor.getAttribute("data-track-event") ?? "",
            location: anchor.getAttribute("data-track-location") ?? "",
            target: anchor.getAttribute("target") ?? "",
          })),
          emailLinks: [...(main?.querySelectorAll('a[href^="mailto:"]') ?? [])].map((anchor) => anchor.getAttribute("href")),
          pageWidth: document.documentElement.scrollWidth,
          viewportWidth: document.documentElement.clientWidth,
          bodyWidth: document.body.scrollWidth,
          pageHeight: document.documentElement.scrollHeight,
          cls: window.__productPageVitals?.cls ?? 0,
        };
      });

      metrics.navigationStatus = navigation?.status() ?? 0;
      metrics.consoleErrors = consoleErrors;
      metrics.pageErrors = pageErrors;
      metrics.failedRequests = failedRequests;
      metrics.errorResponses = errorResponses;
      results[viewportName] = metrics;

      if (screenshotDirectory) {
        await page.screenshot({
          path: path.join(screenshotDirectory, `${screenshotPrefix}-${viewportName}.png`),
          fullPage: true,
          animations: "disabled",
        });
        await page.locator("header").screenshot({
          path: path.join(screenshotDirectory, `${screenshotPrefix}-${viewportName}-header.png`),
          animations: "disabled",
        });
        await page.locator("main > section").first().screenshot({
          path: path.join(screenshotDirectory, `${screenshotPrefix}-${viewportName}-hero.png`),
          animations: "disabled",
        });
        await page.locator("footer").screenshot({
          path: path.join(screenshotDirectory, `${screenshotPrefix}-${viewportName}-footer.png`),
          animations: "disabled",
        });
      }

      await page.close();
    }
  } finally {
    await browser.close();
  }

  return { direct, pageUrl, results };
}
