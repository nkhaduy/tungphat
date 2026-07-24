import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { chromium } from "@playwright/test";
import {
  auditProductPage,
  directRequest,
  fileSha256,
  hasAffirmativeClaim,
  headingHierarchyErrors,
  schemaNodes,
  summarizeProductAudit,
} from "./product-page-audit.mjs";

export { directRequest, fileSha256, hasAffirmativeClaim };

export async function auditServicePage(options) {
  return auditProductPage(options);
}

export function summarizeServiceAudit({ direct, results, prohibitedSchemaKeys }) {
  return summarizeProductAudit({ direct, results, prohibitedSchemaKeys });
}

export async function auditIncomingLinks({ origin, targetPath }) {
  const sitemapResponse = await fetch(new URL("/sitemap.xml", origin));
  const sitemap = await sitemapResponse.text();
  const routes = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/gu)]
    .map((match) => new URL(match[1]).pathname)
    .filter((route, index, values) => values.indexOf(route) === index)
    .sort();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const incoming = [];

  try {
    for (const route of routes) {
      const response = await page.goto(new URL(route, origin).href, { waitUntil: "domcontentloaded" });
      if (!response || response.status() >= 400) continue;
      const links = await page.evaluate((expectedPath) => {
        return [...document.querySelectorAll("a[href]")].flatMap((anchor) => {
          let url;
          try {
            url = new URL(anchor.getAttribute("href") ?? "", window.location.href);
          } catch {
            return [];
          }
          if (url.origin !== window.location.origin || url.pathname !== expectedPath) return [];
          let position = "other";
          if (anchor.closest('nav[aria-label="Breadcrumb"]')) position = "breadcrumb";
          else if (anchor.closest("header")) position = "navigation";
          else if (anchor.closest("footer")) position = "footer";
          else if (anchor.closest("main")) position = "body content";
          return [{
            anchor: (anchor.textContent ?? "").replace(/\s+/gu, " ").trim(),
            href: anchor.getAttribute("href") ?? "",
            position,
          }];
        });
      }, targetPath);
      for (const link of links) incoming.push({ source: route, ...link });
    }
  } finally {
    await browser.close();
  }

  const direct = await directRequest(new URL(targetPath, origin));
  return {
    routesCrawled: routes.length,
    occurrences: incoming.length,
    uniqueSources: [...new Set(incoming.map((item) => item.source))].length,
    bodyContentSources: [...new Set(incoming.filter((item) => item.position === "body content").map((item) => item.source))],
    targetStatus: direct.status,
    targetLocation: direct.location,
    incoming,
  };
}

export async function auditPageContentSnapshots({ origin, paths }) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const snapshots = {};

  try {
    for (const route of paths) {
      const response = await page.goto(new URL(route, origin).href, { waitUntil: "networkidle" });
      if (!response || response.status() !== 200) {
        snapshots[route] = { status: response?.status() ?? 0, mainText: "", headings: [], paragraphs: [], tableRows: [], faq: [] };
        continue;
      }
      snapshots[route] = await page.evaluate(() => {
        const main = document.querySelector("main");
        const content = main?.querySelector(".prose") ?? main;
        const clean = (value) => (value ?? "").replace(/\s+/gu, " ").trim();
        return {
          status: 200,
          mainText: clean(content?.innerText),
          headings: [...(content?.querySelectorAll("h1, h2, h3, h4, h5, h6") ?? [])].map((heading) => clean(heading.textContent)),
          paragraphs: [...(content?.querySelectorAll("p") ?? [])].map((paragraph) => clean(paragraph.textContent)).filter(Boolean),
          tableRows: [...(content?.querySelectorAll("tbody tr") ?? [])].map((row) => clean(row.textContent)).filter(Boolean),
          faq: [...(main?.querySelectorAll("details summary") ?? [])].map((summary) => clean(summary.textContent)).filter(Boolean),
        };
      });
    }
  } finally {
    await browser.close();
  }
  return snapshots;
}

function normalizedWords(value) {
  return value.toLocaleLowerCase("vi").normalize("NFC").replace(/[^\p{L}\p{N}]+/gu, " ").trim().split(/\s+/u).filter(Boolean);
}

function shingles(words, size) {
  return new Set(words.slice(0, Math.max(0, words.length - size + 1)).map((_, index) => words.slice(index, index + size).join(" ")));
}

export function similarityEvidence(left, right) {
  const leftWords = normalizedWords(left.mainText);
  const rightWords = normalizedWords(right.mainText);
  const leftShingles = shingles(leftWords, 5);
  const rightShingles = shingles(rightWords, 5);
  const sharedFiveGrams = [...leftShingles].filter((value) => rightShingles.has(value));
  const union = new Set([...leftShingles, ...rightShingles]);
  const normalizedSet = (items, minWords = 0) => new Set(items.map((item) => normalizedWords(item).join(" ")).filter((item) => item.split(" ").length >= minWords));
  const rightParagraphs = normalizedSet(right.paragraphs, 20);
  const rightRows = normalizedSet(right.tableRows);
  const rightFaq = normalizedSet(right.faq);
  return {
    fiveGramJaccard: union.size ? sharedFiveGrams.length / union.size : 0,
    sharedFiveGrams: sharedFiveGrams.length,
    exactLongParagraphs: [...normalizedSet(left.paragraphs, 20)].filter((item) => rightParagraphs.has(item)),
    sharedTableRows: [...normalizedSet(left.tableRows)].filter((item) => rightRows.has(item)),
    sharedFaq: [...normalizedSet(left.faq)].filter((item) => rightFaq.has(item)),
    sameHeadingSequence: JSON.stringify(left.headings) === JSON.stringify(right.headings),
  };
}

export function directoryManifestSha256(directory) {
  const files = [];
  const walk = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile()) files.push(full.split(path.sep).join("/"));
    }
  };
  walk(directory);
  files.sort();
  const manifest = createHash("sha256");
  for (const file of files) {
    manifest.update(`${fileSha256(file)}  ${file}\n`);
  }
  return { hash: manifest.digest("hex"), files: files.length };
}

export async function validateServicePageAudit({
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
  unverifiedFormatPatterns,
  placeholderPatterns,
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
  for (const pattern of fabricatedSpecPatterns) check(!pattern.test(desktop.mainText), `Phát hiện dữ liệu kỹ thuật chưa xác minh: ${pattern}.`);
  for (const pattern of unverifiedFormatPatterns) check(!pattern.test(desktop.mainText), `Phát hiện định dạng file chưa xác minh: ${pattern}.`);
  check(!/\b\d[\d.,]*\s*(?:đ|vnđ|vnd)\b/iu.test(desktop.mainText), "Phát hiện giá tiền trong main content.");

  const contentPaths = new Set(desktop.internalLinks.map((link) => link.pathname));
  for (const requiredPath of requiredLinks) check(contentPaths.has(requiredPath), `Thiếu internal link tới ${requiredPath}.`);
  for (const pathname of contentPaths) {
    if (pathname !== "/") check(pathname.endsWith("/"), `Internal link thiếu trailing slash: ${pathname}.`);
    const response = await directRequest(new URL(pathname, origin));
    check(response.status === 200, `Internal link ${pathname} phải trả 200; nhận ${response.status}.`);
    check(!response.location, `Internal link ${pathname} redirect tới ${response.location}.`);
  }
  for (const image of desktop.images) {
    const response = await directRequest(new URL(image.src, audit.pageUrl));
    check(response.status === 200, `Ảnh ${image.src} phải trả 200; nhận ${response.status}.`);
    check(!response.location, `Ảnh ${image.src} không được redirect.`);
  }

  check(report.schemaTypes.includes("Service"), "Thiếu schema Service.");
  check(report.schemaTypes.includes("BreadcrumbList"), "Thiếu schema BreadcrumbList.");
  check(report.schemaTypes.includes("FAQPage"), "Thiếu schema FAQPage cho FAQ hiển thị.");
  check(!report.schemaTypes.includes("Product"), "Service landing không được có Product schema.");
  check(!report.schemaTypes.includes("Offer"), "Không được có Offer schema khi chưa có dữ liệu xác minh.");
  check(report.prohibitedSchemaKeys.length === 0, `Schema chứa field chưa xác minh: ${report.prohibitedSchemaKeys.join(", ")}.`);
  const serviceNodes = desktop.schemas.flatMap((schema) => schemaNodes(schema)).filter((node) => node["@type"] === "Service");
  check(serviceNodes.length === 1, `Cần đúng một Service node; nhận ${serviceNodes.length}.`);

  check(desktop.ctas.length === expectedCtas.length, `CTA count thay đổi: baseline ${expectedCtas.length}, nhận ${desktop.ctas.length}.`);
  const unmatchedCtas = [...desktop.ctas];
  for (const expected of expectedCtas) {
    const index = unmatchedCtas.findIndex((cta) => cta.href === expected.href && cta.event === expected.event && cta.location === expected.location && cta.target === expected.target);
    check(index >= 0, `CTA bị thay đổi: ${JSON.stringify(expected)}.`);
    if (index >= 0) unmatchedCtas.splice(index, 1);
  }
  return errors;
}
