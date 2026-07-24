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

const routePath = "/go-ghep/";
const canonicalUrl = "https://mdftungphat.com/go-ghep/";
const baselineWords = 488;
const requiredLinks = ["/go-ghep-cao-su/", "/go-ghep-tram/", "/cat-cnc-go/"];
const requiredHeadingPatterns = [
  /Gỗ ghép là gì\?/iu,
  /Vai trò của trang gỗ ghép/iu,
  /Tiêu chí cần xác định khi chọn gỗ ghép/iu,
  /Các hướng sản phẩm hiện có/iu,
  /Chọn quy cách theo thiết kế/iu,
  /Ứng dụng và giới hạn sử dụng/iu,
  /Kiểm tra chất lượng và bề mặt/iu,
  /Gia công CNC gỗ ghép/iu,
  /Checklist trước khi kiểm tra hàng và báo giá/iu,
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
const protectedContent = {
  "content/products/go-ghep-cao-su.md": "9b76359a46276cceaae52ffbfb46e1db2b360d2524ea5c212a99664281a789f2",
  "content/products/go-ghep-tram.md": "5c14549d5640d455d88282def23d8bec495b6b2b0a53b93f3bfbe8a03f37c5be",
  "content/products/van-mdf.md": "81b7bf94bb09de778056d4946d2b17dd3b48365c099b0d5264a0a03023a992fa",
  "content/products/mdf-chong-am.md": "dbbf760a92d28ef04c364e703911419a0b7d6d036a44a1aa52e160bc27b3092a",
  "content/products/van-go-cong-nghiep.md": "6b38d451f730761caec9c8d07b955d1c6191857f9c5932330dff0f936a32126d",
};
const expectedCtas = [
  { href: "https://zalo.me/0909259160", event: "click_zalo", location: "go-ghep_hero", target: "_blank" },
  { href: "tel:+84909259160", event: "click_phone", location: "go-ghep_hero", target: "" },
  { href: "https://zalo.me/0909259160", event: "click_zalo", location: "go-ghep_specs", target: "_blank" },
  { href: "https://zalo.me/0909259160", event: "click_zalo", location: "go-ghep_specs", target: "_blank" },
];
const claimPatterns = [
  /tốt nhất/iu,
  /(?:số|top)\s*1/iu,
  /rẻ nhất/iu,
  /luôn có sẵn/iu,
  /giao ngay/iu,
  /không cong vênh/iu,
  /không co ngót/iu,
  /chống nước/iu,
  /bền như gỗ nguyên khối/iu,
];
const placeholderPatterns = [/\[cần cập nhật\]/iu, /lorem ipsum/iu, /\bTODO\b/u, /đang cập nhật nội dung/iu];
const unverifiedSpecPatterns = [
  /\bgrade\s*(?:AA|A|B|C)\b/iu,
  /\b(?:AA|AB|AC|BB|BC|CC)\s*(?:grade|class|loại)\b/iu,
  /\bFSC\b/u,
  /formaldehyde\s*(?:class|level|E\d)/iu,
  /finger[ -]?joint/iu,
  /\b(?:MOQ|SKU)\b/u,
];
const nonexistentWoodRoute = /^\/(?:go-ghep-(?!cao-su(?:\/|$)|tram(?:\/|$))|go-(?:thong|xoan|keo|soi)(?:\/|$))/iu;

function hasAffirmativeClaim(text, pattern) {
  return text.split(/[.!?;\n]/u).some((sentence) => {
    const match = pattern.exec(sentence);
    pattern.lastIndex = 0;
    if (!match) return false;
    const before = sentence.slice(0, match.index);
    return !/(?:không|chưa|không thể|không được|không nên|không mặc định|không khẳng định)[^.!?;]{0,60}$/iu.test(before);
  });
}

const runtimeValue = process.env.GO_GHEP_CHECK_ORIGIN ?? process.argv[2];
if (!runtimeValue) {
  console.error("Thiếu GO_GHEP_CHECK_ORIGIN hoặc origin ở đối số đầu tiên.");
  process.exit(1);
}

let origin;
try {
  origin = new URL(runtimeValue);
} catch {
  console.error(`Origin không hợp lệ: ${runtimeValue}`);
  process.exit(1);
}

const screenshotDirectory = process.env.GO_GHEP_SCREENSHOT_DIR
  ? path.resolve(process.env.GO_GHEP_SCREENSHOT_DIR)
  : null;
const auditOnly = process.env.GO_GHEP_AUDIT_ONLY === "1";
const errors = [];
const check = (condition, message) => {
  if (!condition) errors.push(message);
};

const { direct, pageUrl, results } = await auditProductPage({
  origin,
  routePath,
  screenshotDirectory,
  screenshotPrefix: "go-ghep",
});
const desktop = results.desktop;
const mobile = results.mobile;
const schemaAudit = desktop.schemas.reduce(
  (result, schema) => auditSchema(schema, prohibitedSchemaKeys, result),
  { types: [], prohibitedKeys: [] },
);
const schemaTypes = [...new Set(schemaAudit.types)];

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
  check(table.containerWidth <= mobile.viewportWidth + 1, `Mobile: vùng chứa bảng ${index + 1} vượt viewport.`);
  const needsLocalScroll = table.scrollWidth > table.clientWidth + 1 || table.width > table.containerClientWidth + 1;
  if (needsLocalScroll) {
    check(
      table.containerOverflowX === "auto" || table.containerOverflowX === "scroll",
      `Mobile: bảng ${index + 1} cần scroll cục bộ; overflow-x=${table.containerOverflowX}.`,
    );
  }
}

check(desktop.title === "Gỗ ghép: cách chọn cao su, tràm theo nhu cầu | Tùng Phát", `Title không đúng hub intent: ${desktop.title}.`);
check(
  desktop.description === "Hướng dẫn hiểu gỗ ghép, chọn giữa hướng cao su và tràm, kiểm tra bề mặt, kết cấu, quy cách, file CNC và thông tin cần gửi để nhận báo giá.",
  "Meta description đã thay đổi ngoài nội dung được duyệt.",
);
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

check(desktop.tables.length >= 3, `Cần ít nhất 3 bảng semantic; nhận ${desktop.tables.length}.`);
for (const [index, table] of desktop.tables.entries()) {
  check(table.headers >= 2, `Bảng ${index + 1} thiếu header semantic <th>.`);
  check(table.rows >= 1, `Bảng ${index + 1} không có dữ liệu trong <tbody>.`);
}
check(desktop.mainWords > baselineWords, `Main content phải sâu hơn baseline ${baselineWords}; nhận ${desktop.mainWords}.`);
check(desktop.mainWords >= 1200, `Main content cần tối thiểu 1.200 từ; nhận ${desktop.mainWords}.`);
check(desktop.mainWords <= 2300, `Main content vượt 2.300 từ; nhận ${desktop.mainWords}.`);
check(desktop.faqCount === 2, `FAQ hiển thị phải giữ đúng 2 câu; nhận ${desktop.faqCount}.`);
for (const pattern of placeholderPatterns) check(!pattern.test(desktop.mainText), `Phát hiện placeholder: ${pattern}.`);
for (const pattern of claimPatterns) check(!hasAffirmativeClaim(desktop.mainText, pattern), `Phát hiện forbidden claim: ${pattern}.`);
for (const pattern of unverifiedSpecPatterns) check(!pattern.test(desktop.mainText), `Phát hiện dữ liệu chưa xác minh: ${pattern}.`);
check(!/\b\d[\d.,]*\s*(?:đ|vnđ|vnd)\b/iu.test(desktop.mainText), "Phát hiện giá tiền trong main content.");

const contentPaths = new Set(desktop.internalLinks.map((link) => link.pathname));
for (const requiredPath of requiredLinks) check(contentPaths.has(requiredPath), `Thiếu internal link tới ${requiredPath}.`);
const uniqueInternalPaths = [...new Set(desktop.internalLinks.map((link) => link.pathname))];
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

for (const requiredType of ["BreadcrumbList", "CollectionPage", "FAQPage"]) {
  check(schemaTypes.includes(requiredType), `Thiếu schema ${requiredType}.`);
}
check(!schemaTypes.includes("Product"), "Category hub không được xuất Product schema.");
check(!schemaTypes.includes("Offer"), "Không được có Offer schema khi chưa có dữ liệu xác minh.");
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

for (const [file, expectedHash] of Object.entries(protectedContent)) {
  const actualHash = createHash("sha256").update(readFileSync(file)).digest("hex");
  check(actualHash === expectedHash, `${file} thay đổi byte-for-byte: ${actualHash}.`);
}

if (errors.length > 0) {
  console.error(`Gỗ ghép page validation failed (${errors.length}):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Gỗ ghép page validation pass.");
