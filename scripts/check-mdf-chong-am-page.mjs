import path from "node:path";
import process from "node:process";
import {
  auditProductPage,
  auditSchema,
  directRequest,
  headingHierarchyErrors,
} from "./lib/product-page-audit.mjs";

const canonicalUrl = "https://mdftungphat.com/mdf-chong-am/";
const routePath = "/mdf-chong-am/";
const baselineWords = 435;
const requiredLinks = ["/van-mdf/", "/gia-cong-cnc-mdf/"];
const requiredHeadingPatterns = [
  /MDF chống ẩm là gì\?/iu,
  /Chống ẩm khác chống nước thế nào\?/iu,
  /Tiêu chí.*chọn MDF chống ẩm/iu,
  /Ứng dụng phù hợp và giới hạn sử dụng/iu,
  /MDF thường và MDF chống ẩm/iu,
  /Chọn độ dày theo thiết kế/iu,
  /Bề mặt và xử lý cạnh/iu,
  /Gia công CNC MDF chống ẩm/iu,
  /Checklist.*kiểm tra hàng và báo giá/iu,
];
const forbiddenClaims = [
  /chống nước tuyệt đối/iu,
  /ngâm nước không hư/iu,
  /bền tuyệt đối/iu,
  /dùng được mọi môi trường/iu,
  /rẻ nhất/iu,
  /số 1/iu,
  /tốt nhất/iu,
  /luôn có sẵn/iu,
  /giao ngay/iu,
];
const prohibitedSchemaKeys = new Set([
  "price",
  "pricecurrency",
  "availability",
  "sku",
  "mpn",
  "gtin",
  "gtin8",
  "gtin12",
  "gtin13",
  "gtin14",
  "aggregaterating",
  "review",
  "certification",
]);
const expectedCtas = [
  {
    href: "https://zalo.me/0909259160",
    event: "click_zalo",
    location: "mdf-chong-am_hero",
    target: "_blank",
  },
  {
    href: "tel:+84909259160",
    event: "click_phone",
    location: "mdf-chong-am_hero",
    target: "",
  },
  {
    href: "https://zalo.me/0909259160",
    event: "click_zalo",
    location: "mdf-chong-am_specs",
    target: "_blank",
  },
  {
    href: "https://zalo.me/0909259160",
    event: "click_zalo",
    location: "mdf-chong-am_specs",
    target: "_blank",
  },
];

const runtimeValue = process.env.MDF_CHONG_AM_CHECK_ORIGIN ?? process.argv[2];
if (!runtimeValue) {
  console.error("Thiếu MDF_CHONG_AM_CHECK_ORIGIN hoặc origin ở đối số đầu tiên.");
  process.exit(1);
}

let origin;
try {
  origin = new URL(runtimeValue);
} catch {
  console.error(`Origin không hợp lệ: ${runtimeValue}`);
  process.exit(1);
}

const auditOnly = process.env.MDF_CHONG_AM_AUDIT_ONLY === "1";
const screenshotDirectory = process.env.MDF_CHONG_AM_SCREENSHOT_DIR
  ? path.resolve(process.env.MDF_CHONG_AM_SCREENSHOT_DIR)
  : null;
const errors = [];
const check = (condition, message) => {
  if (!condition) errors.push(message);
};

const { direct, pageUrl, results } = await auditProductPage({
  origin,
  routePath,
  screenshotDirectory,
  screenshotPrefix: "mdf-chong-am",
});
const desktop = results.desktop;
const mobile = results.mobile;

const schemaAudit = desktop.schemas.reduce(
  (result, schema) => auditSchema(schema, prohibitedSchemaKeys, result),
  { types: [], prohibitedKeys: [] },
);
const summary = {
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
  images: desktop.images,
  internalLinks: desktop.internalLinks,
  faqCount: desktop.faqCount,
  schemaTypes: [...new Set(schemaAudit.types)],
  prohibitedSchemaKeys: schemaAudit.prohibitedKeys,
  ctas: desktop.ctas,
  emailLinks: desktop.emailLinks,
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
    pageWidth: mobile.pageWidth,
    bodyWidth: mobile.bodyWidth,
    viewportWidth: mobile.viewportWidth,
    pageHeight: mobile.pageHeight,
    cls: mobile.cls,
    consoleErrors: mobile.consoleErrors,
    pageErrors: mobile.pageErrors,
    failedRequests: mobile.failedRequests,
    errorResponses: mobile.errorResponses,
  },
};

console.log(JSON.stringify(summary, null, 2));
if (auditOnly) process.exit(0);

check(direct.status === 200, `${routePath} phải trả HTTP 200 trực tiếp; nhận ${direct.status}.`);
check(!direct.location, `${routePath} không được redirect; Location=${direct.location ?? "-"}.`);
for (const [viewportName, metrics] of Object.entries(results)) {
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
  check(table.width <= mobile.viewportWidth + 1, `Mobile: bảng ${index + 1} rộng ${table.width}px vượt viewport.`);
  check(table.containerWidth <= mobile.viewportWidth + 1, `Mobile: vùng chứa bảng ${index + 1} rộng ${table.containerWidth}px vượt viewport.`);
  const needsLocalScroll = table.scrollWidth > table.clientWidth + 1 || table.width > table.containerClientWidth + 1;
  if (needsLocalScroll) {
    check(
      table.containerOverflowX === "auto" || table.containerOverflowX === "scroll",
      `Mobile: bảng ${index + 1} cần scroll cục bộ; overflow-x=${table.containerOverflowX}.`,
    );
  }
}

check(desktop.canonical === canonicalUrl, `Canonical phải là ${canonicalUrl}; nhận ${desktop.canonical || "-"}.`);
check(desktop.ogUrl === canonicalUrl, `og:url phải giữ ${canonicalUrl}; nhận ${desktop.ogUrl || "-"}.`);
check(/(?:^|,\s*)index(?:\s*,|$)/iu.test(desktop.robots), `Robots phải chứa index; nhận ${desktop.robots || "-"}.`);
check(/(?:^|,\s*)follow(?:\s*,|$)/iu.test(desktop.robots), `Robots phải chứa follow; nhận ${desktop.robots || "-"}.`);
check(!/noindex/iu.test(desktop.robots), `Robots không được chứa noindex; nhận ${desktop.robots}.`);

const h1 = desktop.headings.filter((heading) => heading.level === 1);
check(h1.length === 1, `Cần đúng một H1; nhận ${h1.length}.`);
for (const error of headingHierarchyErrors(desktop.headings)) errors.push(error);
for (const pattern of requiredHeadingPatterns) {
  check(desktop.headings.some((heading) => pattern.test(heading.text)), `Thiếu heading nội dung khớp ${pattern}.`);
}

check(desktop.tables.length >= 2, `Cần ít nhất 2 bảng semantic; nhận ${desktop.tables.length}.`);
for (const [index, table] of desktop.tables.entries()) {
  check(table.headers >= 2, `Bảng ${index + 1} thiếu header semantic <th>.`);
  check(table.rows >= 1, `Bảng ${index + 1} không có dữ liệu trong <tbody>.`);
}
check(desktop.mainWords > baselineWords, `Main content phải sâu hơn baseline ${baselineWords} từ; nhận ${desktop.mainWords}.`);
check(desktop.mainWords >= 900, `Main content cần tối thiểu 900 từ; nhận ${desktop.mainWords}.`);
check(desktop.mainWords <= 1800, `Main content vượt 1.800 từ; nhận ${desktop.mainWords}.`);
check(!desktop.mainText.includes("[cần cập nhật]"), "Không được có placeholder [cần cập nhật].");
for (const pattern of forbiddenClaims) {
  check(!pattern.test(desktop.mainText), `Phát hiện forbidden claim: ${pattern}.`);
}
check(!/\b\d[\d.,]*\s*(?:đ|vnđ|vnd)\b/iu.test(desktop.mainText), "Phát hiện giá tiền trong main content.");

const contentPaths = new Set(desktop.internalLinks.map((link) => link.pathname));
for (const requiredPath of requiredLinks) {
  check(contentPaths.has(requiredPath), `Thiếu internal link có ngữ cảnh tới ${requiredPath}.`);
}
const uniqueInternalPaths = [...new Set(desktop.internalLinks.map((link) => link.pathname))];
for (const pathname of uniqueInternalPaths) {
  if (pathname !== "/") check(pathname.endsWith("/"), `Internal link thiếu trailing slash: ${pathname}.`);
  const response = await directRequest(new URL(pathname, origin));
  check(response.status === 200, `Internal link ${pathname} phải trả 200; nhận ${response.status}.`);
  check(!response.location, `Internal link ${pathname} redirect tới ${response.location}.`);
}
for (const image of desktop.images) {
  const response = await directRequest(new URL(image.src, pageUrl));
  check(response.status === 200, `Ảnh ${image.src} phải trả 200; nhận ${response.status}.`);
  check(!response.location, `Ảnh ${image.src} không được redirect.`);
}

for (const requiredType of ["BreadcrumbList", "Product", "FAQPage"]) {
  check(schemaAudit.types.includes(requiredType), `Thiếu schema ${requiredType}.`);
}
check(!schemaAudit.types.includes("Offer"), "Không được có Offer schema khi chưa có dữ liệu xác minh.");
check(schemaAudit.prohibitedKeys.length === 0, `Schema chứa field chưa xác minh: ${schemaAudit.prohibitedKeys.join(", ")}.`);

check(desktop.ctas.length === expectedCtas.length, `CTA count thay đổi: baseline ${expectedCtas.length}, nhận ${desktop.ctas.length}.`);
const unmatchedCtas = [...desktop.ctas];
for (const expected of expectedCtas) {
  const index = unmatchedCtas.findIndex((cta) =>
    cta.href === expected.href
      && cta.event === expected.event
      && cta.location === expected.location
      && cta.target === expected.target,
  );
  check(index >= 0, `CTA bị thay đổi: ${JSON.stringify(expected)}.`);
  if (index >= 0) unmatchedCtas.splice(index, 1);
}
check(desktop.emailLinks.length === 0, `Email CTA thay đổi; nhận ${desktop.emailLinks.join(", ")}.`);

if (errors.length > 0) {
  console.error(`MDF chống ẩm page validation failed (${errors.length}):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("MDF chống ẩm page validation pass.");
