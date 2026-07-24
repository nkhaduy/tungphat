import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { chromium } from "@playwright/test";

const canonicalUrl = "https://mdftungphat.com/van-mdf/";
const routePath = "/van-mdf/";
const baselineWords = 435;
const requiredContentLinks = [
  "/san-pham/",
  "/mdf-chong-am/",
  "/van-go-cong-nghiep/",
  "/gia-cong-cnc-mdf/",
  "/lien-he/",
];
const forbiddenClaims = [
  /rẻ nhất/iu,
  /số 1/iu,
  /tốt nhất/iu,
  /luôn có sẵn/iu,
  /chống nước tuyệt đối/iu,
];
const prohibitedSchemaKeys = new Set([
  "price",
  "pricecurrency",
  "availability",
  "aggregaterating",
  "review",
  "sku",
]);

const runtimeOrigin = process.env.VAN_MDF_CHECK_ORIGIN ?? process.argv[2];
if (!runtimeOrigin) {
  console.error(
    "Thiếu VAN_MDF_CHECK_ORIGIN. Hãy chạy trên production-like runtime, ví dụ VAN_MDF_CHECK_ORIGIN=http://127.0.0.1:4173 npm run validate:van-mdf.",
  );
  process.exit(1);
}

let origin;
try {
  origin = new URL(runtimeOrigin);
} catch {
  console.error(`VAN_MDF_CHECK_ORIGIN không hợp lệ: ${runtimeOrigin}`);
  process.exit(1);
}

const errors = [];
const screenshotDirectory = process.env.VAN_MDF_SCREENSHOT_DIR
  ? path.resolve(process.env.VAN_MDF_SCREENSHOT_DIR)
  : null;

function check(condition, message) {
  if (!condition) errors.push(message);
}

function schemaAudit(value, audit = { types: [], prohibitedKeys: [] }) {
  if (!value || typeof value !== "object") return audit;
  if (Array.isArray(value)) {
    for (const item of value) schemaAudit(item, audit);
    return audit;
  }

  if (typeof value["@type"] === "string") audit.types.push(value["@type"]);
  for (const [key, child] of Object.entries(value)) {
    if (prohibitedSchemaKeys.has(key.toLowerCase())) audit.prohibitedKeys.push(key);
    schemaAudit(child, audit);
  }
  return audit;
}

async function directRequest(url) {
  const response = await fetch(url, { redirect: "manual", headers: { Accept: "text/html" } });
  return {
    status: response.status,
    location: response.headers.get("location"),
    response,
  };
}

const pageUrl = new URL(routePath, origin);
const direct = await directRequest(pageUrl);
check(direct.status === 200, `${routePath} phải trả HTTP 200 trực tiếp; nhận ${direct.status}.`);
check(!direct.location, `${routePath} không được redirect; Location=${direct.location ?? "-"}.`);

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

    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => pageErrors.push(error.message));
    await page.addInitScript(() => {
      window.__vanMdfVitals = { cls: 0 };
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) window.__vanMdfVitals.cls += entry.value || 0;
        }
      }).observe({ type: "layout-shift", buffered: true });
    });

    const navigation = await page.goto(pageUrl.href, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(250);

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

      return {
        title: document.title,
        description: document.querySelector('meta[name="description"]')?.getAttribute("content") ?? "",
        canonical: document.querySelector('link[rel="canonical"]')?.getAttribute("href") ?? "",
        robots: document.querySelector('meta[name="robots"]')?.getAttribute("content") ?? "",
        headings: [...(main?.querySelectorAll("h1, h2, h3, h4, h5, h6") ?? [])].map((heading) => ({
          level: Number(heading.tagName.slice(1)),
          text: (heading.textContent ?? "").replace(/\s+/gu, " ").trim(),
        })),
        mainWords: mainText ? mainText.split(/\s+/u).length : 0,
        mainText,
        internalLinks,
        tables,
        images: [...(main?.querySelectorAll("img") ?? [])].map((image) => ({
          alt: image.alt,
          src: image.currentSrc || image.src,
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
        })),
        pageWidth: document.documentElement.scrollWidth,
        viewportWidth: document.documentElement.clientWidth,
        bodyWidth: document.body.scrollWidth,
        pageHeight: document.documentElement.scrollHeight,
        cls: window.__vanMdfVitals?.cls ?? 0,
      };
    });

    metrics.consoleErrors = consoleErrors;
    metrics.pageErrors = pageErrors;
    results[viewportName] = metrics;

    check(navigation?.status() === 200, `${viewportName}: navigation phải trả HTTP 200.`);
    check(consoleErrors.length === 0, `${viewportName}: console errors: ${consoleErrors.join(" | ") || "-"}.`);
    check(pageErrors.length === 0, `${viewportName}: page errors: ${pageErrors.join(" | ") || "-"}.`);
    check(metrics.cls < 0.1, `${viewportName}: CLS ${metrics.cls.toFixed(4)} vượt 0.1.`);
    for (const image of metrics.images) {
      check(
        image.complete && image.naturalWidth > 0 && image.naturalHeight > 0,
        `${viewportName}: ảnh hỏng hoặc chưa tải: ${image.src} (${image.alt || "không alt"}).`,
      );
      check(image.renderedWidth > 0 && image.renderedHeight > 0, `${viewportName}: ảnh không có kích thước render: ${image.src}.`);
    }

    if (viewportName === "mobile") {
      check(
        metrics.pageWidth <= metrics.viewportWidth + 1 && metrics.bodyWidth <= metrics.viewportWidth + 1,
        `Mobile overflow: document=${metrics.pageWidth}px, body=${metrics.bodyWidth}px, viewport=${metrics.viewportWidth}px.`,
      );
      for (const [index, table] of metrics.tables.entries()) {
        check(table.width <= metrics.viewportWidth + 1, `Mobile: bảng ${index + 1} rộng ${table.width}px vượt viewport.`);
        check(table.containerWidth <= metrics.viewportWidth + 1, `Mobile: vùng chứa bảng ${index + 1} rộng ${table.containerWidth}px vượt viewport.`);
        check(
          table.containerScrollWidth >= table.width - 1,
          `Mobile: vùng chứa bảng ${index + 1} không chứa đủ chiều rộng bảng ${table.width}px.`,
        );
        const needsLocalScroll = table.scrollWidth > table.clientWidth + 1 || table.width > table.containerClientWidth + 1;
        if (needsLocalScroll) {
          check(
            table.containerOverflowX === "auto" || table.containerOverflowX === "scroll",
            `Mobile: bảng ${index + 1} vượt vùng chứa nhưng không có scroll cục bộ; overflow-x=${table.containerOverflowX}.`,
          );
        }
      }
    }

    if (screenshotDirectory) {
      await page.screenshot({
        path: path.join(screenshotDirectory, `van-mdf-${viewportName}.png`),
        fullPage: true,
        animations: "disabled",
      });
      await page.locator("header").screenshot({
        path: path.join(screenshotDirectory, `van-mdf-${viewportName}-header.png`),
        animations: "disabled",
      });
      await page.locator("main > section").first().screenshot({
        path: path.join(screenshotDirectory, `van-mdf-${viewportName}-hero.png`),
        animations: "disabled",
      });
      await page.locator("footer").screenshot({
        path: path.join(screenshotDirectory, `van-mdf-${viewportName}-footer.png`),
        animations: "disabled",
      });
    }

    await page.close();
  }
} finally {
  await browser.close();
}

const desktop = results.desktop;
check(desktop.canonical === canonicalUrl, `Canonical phải là ${canonicalUrl}; nhận ${desktop.canonical || "-"}.`);
check(/(?:^|,\s*)index(?:\s*,|$)/iu.test(desktop.robots), `Robots phải chứa index; nhận ${desktop.robots || "-"}.`);
check(/(?:^|,\s*)follow(?:\s*,|$)/iu.test(desktop.robots), `Robots phải chứa follow; nhận ${desktop.robots || "-"}.`);
check(!/noindex/iu.test(desktop.robots), `Robots không được chứa noindex; nhận ${desktop.robots}.`);
check(desktop.title === "Ván MDF tại TP.HCM: độ dày, ứng dụng, báo giá | Tùng Phát", "Title /van-mdf/ đã thay đổi ngoài yêu cầu.");
check(
  desktop.description === "Tìm hiểu ván MDF, độ dày, bề mặt và dữ liệu cần gửi khi đặt hàng. Tùng Phát kiểm tra mã vật liệu, quy cách và báo giá thực tế tại TP.HCM.",
  "Meta description /van-mdf/ đã thay đổi ngoài yêu cầu.",
);

const h1 = desktop.headings.filter((heading) => heading.level === 1);
check(h1.length === 1, `Cần đúng một H1; nhận ${h1.length}.`);
for (let index = 1; index < desktop.headings.length; index += 1) {
  const previous = desktop.headings[index - 1];
  const current = desktop.headings[index];
  check(
    current.level - previous.level <= 1,
    `Heading level bị nhảy từ H${previous.level} "${previous.text}" sang H${current.level} "${current.text}".`,
  );
}

const requiredHeadings = [
  "MDF là vật liệu gì?",
  "Những tiêu chí cần xác định khi chọn MDF",
  "MDF phù hợp với những hạng mục nào?",
  "MDF thường và MDF chống ẩm khác nhau thế nào?",
  "Chọn độ dày MDF theo nhu cầu sử dụng",
  "Tùng Phát hỗ trợ gia công CNC MDF như thế nào?",
  "Chuẩn bị thông tin để kiểm tra hàng và báo giá",
];
for (const heading of requiredHeadings) {
  check(desktop.headings.some((item) => item.text === heading), `Thiếu heading nội dung: ${heading}.`);
}

check(desktop.tables.length >= 3, `Cần ít nhất 3 bảng semantic; nhận ${desktop.tables.length}.`);
for (const [index, table] of desktop.tables.entries()) {
  check(table.headers >= 2, `Bảng ${index + 1} thiếu header semantic <th>.`);
  check(table.rows >= 1, `Bảng ${index + 1} không có dữ liệu trong <tbody>.`);
}

check(desktop.mainWords > baselineWords, `Main content phải sâu hơn baseline ${baselineWords} từ; nhận ${desktop.mainWords}.`);
check(desktop.mainWords >= 900, `Main content cần tối thiểu 900 từ; nhận ${desktop.mainWords}.`);
check(desktop.mainWords <= 1800, `Main content vượt 1.800 từ và cần biên tập lại; nhận ${desktop.mainWords}.`);
check(!desktop.mainText.includes("[cần cập nhật]"), "Không được có placeholder [cần cập nhật].");
for (const pattern of forbiddenClaims) {
  check(!pattern.test(desktop.mainText), `Phát hiện forbidden claim: ${pattern}.`);
}
check(!/\b\d[\d.,]*\s*(?:đ|vnđ|vnd)\b/iu.test(desktop.mainText), "Phát hiện giá tiền trong main content.");

const contentPaths = new Set(desktop.internalLinks.map((link) => link.pathname));
for (const requiredPath of requiredContentLinks) {
  check(contentPaths.has(requiredPath), `Thiếu internal link có ngữ cảnh tới ${requiredPath}.`);
}

const linkChecks = [];
for (const link of desktop.internalLinks) {
  if (link.pathname !== "/") check(link.pathname.endsWith("/"), `Internal link thiếu trailing slash: ${link.href}.`);
  const url = new URL(link.pathname, origin);
  const result = await directRequest(url);
  linkChecks.push({ pathname: link.pathname, status: result.status, location: result.location });
  check(result.status === 200, `Internal link ${link.pathname} phải trả 200; nhận ${result.status}.`);
  check(!result.location, `Internal link ${link.pathname} redirect tới ${result.location}.`);
}

for (const image of desktop.images) {
  const imageUrl = new URL(image.src, pageUrl);
  const response = await fetch(imageUrl, { redirect: "manual" });
  check(response.status === 200, `Ảnh ${imageUrl.pathname} phải trả 200; nhận ${response.status}.`);
  check(!response.headers.get("location"), `Ảnh ${imageUrl.pathname} không được redirect.`);
}

const audit = desktop.schemas.reduce((result, schema) => schemaAudit(schema, result), { types: [], prohibitedKeys: [] });
for (const requiredType of ["BreadcrumbList", "Product", "FAQPage"]) {
  check(audit.types.includes(requiredType), `Thiếu schema ${requiredType}.`);
}
check(!audit.types.includes("Offer"), "Không được có Offer schema khi chưa có dữ liệu xác minh.");
check(audit.prohibitedKeys.length === 0, `Schema chứa field thương mại chưa xác minh: ${audit.prohibitedKeys.join(", ")}.`);

const expectedCtas = [
  { href: "https://zalo.me/0909259160", event: "click_zalo", location: "van-mdf_hero" },
  { href: "tel:+84909259160", event: "click_phone", location: "van-mdf_hero" },
  { href: "https://zalo.me/0909259160", event: "click_zalo", location: "van-mdf_specs" },
  { href: "https://zalo.me/0909259160", event: "click_zalo", location: "van-mdf_specs" },
];
check(desktop.ctas.length === expectedCtas.length, `CTA count thay đổi: baseline ${expectedCtas.length}, nhận ${desktop.ctas.length}.`);
for (const expected of expectedCtas) {
  const index = desktop.ctas.findIndex((cta) =>
    cta.href === expected.href && cta.event === expected.event && cta.location === expected.location
  );
  check(index >= 0, `Thiếu CTA ${expected.event} ${expected.location} ${expected.href}.`);
  if (index >= 0) desktop.ctas.splice(index, 1);
}

if (errors.length > 0) {
  console.error(`Validator /van-mdf/ thất bại (${errors.length} lỗi):\n- ${errors.join("\n- ")}`);
  process.exit(1);
}

console.log(
  `Validator /van-mdf/ pass: HTTP 200 trực tiếp; ${h1.length} H1; ${desktop.headings.length - h1.length} H2-H6; ${desktop.mainWords} từ main; ${desktop.tables.length} bảng; ${desktop.images.length} ảnh; ${desktop.internalLinks.length} internal links; mobile overflow 0; CLS desktop=${results.desktop.cls.toFixed(4)}, mobile=${results.mobile.cls.toFixed(4)}.`,
);
console.log(`Internal links trực tiếp: ${linkChecks.map((item) => `${item.pathname}=${item.status}`).join(", ")}.`);
console.log(`Schema types: ${[...new Set(audit.types)].join(", ")}; prohibited commercial fields=0; console/runtime errors=0.`);
