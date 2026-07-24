import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import {
  auditProductPage,
  auditSchema,
  directRequest,
  headingHierarchyErrors,
} from "./lib/product-page-audit.mjs";

const routePath = "/go-ghep-cao-su/";
const canonicalUrl = "https://mdftungphat.com/go-ghep-cao-su/";
const baselineWords = 416;
const expectedTitle = "Gỗ ghép cao su tại TP.HCM: quy cách và báo giá | Tùng Phát";
const expectedDescription = "Gỗ ghép cao su cho mặt bàn, kệ và chi tiết CNC: cách xác nhận bề mặt, quy cách, môi trường và dữ liệu cần gửi để Tùng Phát báo giá.";
const requiredLinks = ["/go-ghep/", "/go-ghep-tram/", "/cat-cnc-go/"];
const requiredHeadingPatterns = [
  /Gỗ ghép cao su là gì\?/iu,
  /Khi nào nên cân nhắc gỗ ghép cao su\?/iu,
  /Tiêu chí cần xác định trước khi mua/iu,
  /Phân hạng và bề mặt cần hiểu thế nào\?/iu,
  /Kiểm tra bề mặt, cạnh và mối ghép/iu,
  /Chọn quy cách theo thiết kế/iu,
  /Ứng dụng và giới hạn sử dụng/iu,
  /Gia công CNC gỗ ghép cao su/iu,
  /Checklist kiểm tra hàng và báo giá/iu,
];
const prohibitedSchemaKeys = new Set([
  "offer",
  "offers",
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
const protectedFiles = {
  "content/products/go-ghep.md": "bfea5e6e4af0b456171e4a3981377f147118ecef658320497380a671be40657f",
  "content/products/go-ghep-tram.md": "5c14549d5640d455d88282def23d8bec495b6b2b0a53b93f3bfbe8a03f37c5be",
  "content/products/van-mdf.md": "81b7bf94bb09de778056d4946d2b17dd3b48365c099b0d5264a0a03023a992fa",
  "content/products/mdf-chong-am.md": "dbbf760a92d28ef04c364e703911419a0b7d6d036a44a1aa52e160bc27b3092a",
  "content/products/van-go-cong-nghiep.md": "6b38d451f730761caec9c8d07b955d1c6191857f9c5932330dff0f936a32126d",
  "components/Header.tsx": "50f271d5649448492e2563a4945c5b85317857ae668607885a27db6462e2ce09",
  "components/Footer.tsx": "e1b5157eba8ca2655670b9b5967ec5836d82c8484f2045ddd591d142eeaa52bf",
};
const expectedCtas = [
  { href: "https://zalo.me/0909259160", event: "click_zalo", location: "go-ghep-cao-su_hero", target: "_blank" },
  { href: "tel:+84909259160", event: "click_phone", location: "go-ghep-cao-su_hero", target: "" },
  { href: "https://zalo.me/0909259160", event: "click_zalo", location: "go-ghep-cao-su_specs", target: "_blank" },
  { href: "https://zalo.me/0909259160", event: "click_zalo", location: "go-ghep-cao-su_specs", target: "_blank" },
];
const forbiddenClaimPatterns = [
  /tốt nhất/iu,
  /(?:số|top)\s*1/iu,
  /rẻ nhất/iu,
  /luôn có sẵn/iu,
  /giao ngay/iu,
  /không cong vênh/iu,
  /không co ngót/iu,
  /chống nước/iu,
  /bền như gỗ nguyên khối/iu,
  /grade\s*A{1,2}/iu,
  /chuẩn xuất khẩu/iu,
];
const placeholderPatterns = [/\[cần cập nhật\]/iu, /lorem ipsum/iu, /\bTODO\b/u, /đang cập nhật nội dung/iu];
const fabricatedSpecPatterns = [
  /\b(?:AA|AB|AC|BC)\b/u,
  /\bFSC\b/u,
  /finger[ -]?joint/iu,
  /\b(?:MOQ|SKU)\b/u,
  /\b\d+(?:[.,]\d+)?\s*(?:mm|cm|m)\b/iu,
  /\b\d+(?:[.,]\d+)?\s*%\s*(?:độ ẩm|ẩm)/iu,
  /\bkeo\s+(?:pva|pu|e\d|melamine|urea|phenol)/iu,
];
const nonexistentWoodRoute = /^\/(?:go-ghep-(?!cao-su(?:\/|$)|tram(?:\/|$))|go-(?:thong|xoan|keo|soi)(?:\/|$))/iu;

function hasAffirmativeClaim(text, pattern) {
  return text.split(/[.!?;\n]/u).some((sentence) => {
    const match = pattern.exec(sentence);
    pattern.lastIndex = 0;
    if (!match) return false;
    const before = sentence.slice(0, match.index);
    return !/(?:không|chưa|không thể|không được|không nên|không mặc định|không đồng nghĩa|không khẳng định)[^.!?;]{0,80}$/iu.test(before);
  });
}

function schemaNodes(value, nodes = []) {
  if (!value || typeof value !== "object") return nodes;
  if (Array.isArray(value)) {
    for (const item of value) schemaNodes(item, nodes);
    return nodes;
  }
  nodes.push(value);
  for (const child of Object.values(value)) schemaNodes(child, nodes);
  return nodes;
}

const runtimeValue = process.env.GO_GHEP_CAO_SU_CHECK_ORIGIN ?? process.argv[2];
if (!runtimeValue) {
  console.error("Thiếu GO_GHEP_CAO_SU_CHECK_ORIGIN hoặc origin ở đối số đầu tiên.");
  process.exit(1);
}

let origin;
try {
  origin = new URL(runtimeValue);
} catch {
  console.error(`Origin không hợp lệ: ${runtimeValue}`);
  process.exit(1);
}

const screenshotDirectory = process.env.GO_GHEP_CAO_SU_SCREENSHOT_DIR
  ? path.resolve(process.env.GO_GHEP_CAO_SU_SCREENSHOT_DIR)
  : null;
const auditOnly = process.env.GO_GHEP_CAO_SU_AUDIT_ONLY === "1";
const errors = [];
const check = (condition, message) => {
  if (!condition) errors.push(message);
};

const { direct, pageUrl, results } = await auditProductPage({
  origin,
  routePath,
  screenshotDirectory,
  screenshotPrefix: "go-ghep-cao-su",
});
const desktop = results.desktop;
const mobile = results.mobile;
const schemaAudit = desktop.schemas.reduce(
  (result, schema) => auditSchema(schema, prohibitedSchemaKeys, result),
  { types: [], prohibitedKeys: [] },
);
const schemaTypes = [...new Set(schemaAudit.types)];
const productNodes = desktop.schemas.flatMap((schema) => schemaNodes(schema)).filter((node) => node["@type"] === "Product");

console.log(JSON.stringify({
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
  uniqueInternalTargets: [...new Set(desktop.internalLinks.map((link) => link.pathname))],
  faqCount: desktop.faqCount,
  schemaTypes,
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
}, null, 2));
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
for (const pattern of requiredHeadingPatterns) {
  check(desktop.headings.some((heading) => pattern.test(heading.text)), `Thiếu heading nội dung khớp ${pattern}.`);
}

check(desktop.mainWords > baselineWords, `Main content phải sâu hơn baseline ${baselineWords}; nhận ${desktop.mainWords}.`);
check(desktop.mainWords >= 1400, `Main content cần tối thiểu 1.400 từ; nhận ${desktop.mainWords}.`);
check(desktop.mainWords <= 2600, `Main content vượt 2.600 từ; nhận ${desktop.mainWords}.`);
check(desktop.tables.length >= 3, `Cần ít nhất 3 bảng semantic; nhận ${desktop.tables.length}.`);
for (const [index, table] of desktop.tables.entries()) {
  check(table.headers >= 2, `Bảng ${index + 1} thiếu header semantic <th>.`);
  check(table.rows >= 1, `Bảng ${index + 1} không có dữ liệu trong <tbody>.`);
}
check(desktop.faqCount === 2, `FAQ hiển thị phải giữ đúng 2 câu; nhận ${desktop.faqCount}.`);
for (const pattern of placeholderPatterns) check(!pattern.test(desktop.mainText), `Phát hiện placeholder: ${pattern}.`);
for (const pattern of forbiddenClaimPatterns) check(!hasAffirmativeClaim(desktop.mainText, pattern), `Phát hiện affirmative forbidden claim: ${pattern}.`);
for (const pattern of fabricatedSpecPatterns) check(!pattern.test(desktop.mainText), `Phát hiện dữ liệu chưa xác minh: ${pattern}.`);
check(!/\b\d[\d.,]*\s*(?:đ|vnđ|vnd)\b/iu.test(desktop.mainText), "Phát hiện giá tiền trong main content.");

const contentPaths = new Set(desktop.internalLinks.map((link) => link.pathname));
for (const requiredPath of requiredLinks) check(contentPaths.has(requiredPath), `Thiếu internal link tới ${requiredPath}.`);
const uniqueInternalPaths = [...contentPaths];
for (const pathname of uniqueInternalPaths) {
  if (pathname !== "/") check(pathname.endsWith("/"), `Internal link thiếu trailing slash: ${pathname}.`);
  check(!nonexistentWoodRoute.test(pathname), `Không được link tới route loại gỗ chưa tồn tại: ${pathname}.`);
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
  check(schemaTypes.includes(requiredType), `Thiếu schema ${requiredType}.`);
}
check(!schemaTypes.includes("CollectionPage"), "Product landing không được đổi thành CollectionPage.");
check(!schemaTypes.includes("Offer"), "Không được có Offer schema khi chưa có dữ liệu xác minh.");
check(schemaAudit.prohibitedKeys.length === 0, `Schema chứa field chưa xác minh: ${schemaAudit.prohibitedKeys.join(", ")}.`);
check(productNodes.length === 1, `Cần đúng một Product node; nhận ${productNodes.length}.`);
check(productNodes.every((node) => !("brand" in node)), "Product schema không được thêm brand chưa xác minh.");

check(desktop.ctas.length === expectedCtas.length, `CTA count thay đổi: baseline ${expectedCtas.length}, nhận ${desktop.ctas.length}.`);
const unmatchedCtas = [...desktop.ctas];
for (const expected of expectedCtas) {
  const index = unmatchedCtas.findIndex((cta) => cta.href === expected.href
    && cta.event === expected.event
    && cta.location === expected.location
    && cta.target === expected.target);
  check(index >= 0, `CTA bị thay đổi: ${JSON.stringify(expected)}.`);
  if (index >= 0) unmatchedCtas.splice(index, 1);
}
check(desktop.emailLinks.length === 0, `Email CTA thay đổi; nhận ${desktop.emailLinks.join(", ")}.`);

for (const [file, expectedHash] of Object.entries(protectedFiles)) {
  const actualHash = createHash("sha256").update(readFileSync(file)).digest("hex");
  check(actualHash === expectedHash, `${file} thay đổi byte-for-byte: ${actualHash}.`);
}

if (errors.length > 0) {
  console.error(`Gỗ ghép cao su page validation failed (${errors.length}):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Gỗ ghép cao su page validation pass.");
