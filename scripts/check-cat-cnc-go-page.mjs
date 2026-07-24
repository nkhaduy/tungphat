import path from "node:path";
import process from "node:process";
import {
  auditIncomingLinks,
  auditPageContentSnapshots,
  auditServicePage,
  directoryManifestSha256,
  fileSha256,
  similarityEvidence,
  summarizeServiceAudit,
  validateServicePageAudit,
} from "./lib/service-page-audit.mjs";

const routePath = "/cat-cnc-go/";
const canonicalUrl = "https://mdftungphat.com/cat-cnc-go/";
const baselineWords = 408;
const expectedTitle = "Cắt CNC gỗ theo file, bản vẽ tại TP.HCM | Tùng Phát";
const expectedDescription = "Gửi yêu cầu cắt CNC gỗ theo file, bản vẽ hoặc kích thước. Tùng Phát kiểm tra vật liệu, chi tiết, số lượng và khả năng gia công trước khi báo giá.";
const requiredLinks = [
  "/gia-cong-cnc/",
  "/gia-cong-cnc-mdf/",
  "/go-ghep/",
  "/go-ghep-cao-su/",
  "/go-ghep-tram/",
  "/van-mdf/",
  "/van-go-cong-nghiep/",
  "/lien-he/",
];
const requiredHeadingPatterns = [
  /Dịch vụ cắt và gia công CNC gỗ/iu,
  /yêu cầu nào có thể gửi để kiểm tra/iu,
  /Thông tin cần có trong file hoặc bản vẽ/iu,
  /Checklist trước khi gửi yêu cầu/iu,
  /Quy trình kiểm tra yêu cầu trước báo giá/iu,
  /yếu tố ảnh hưởng tới phương án gia công/iu,
  /Vật liệu có thể gửi để kiểm tra/iu,
  /Giới hạn cần xác nhận riêng/iu,
  /Hình ảnh và bằng chứng hiện có/iu,
  /Chọn đúng trang theo nhu cầu/iu,
  /Gửi thông tin để Tùng Phát kiểm tra yêu cầu/iu,
];
const prohibitedSchemaKeys = new Set([
  "offer", "offers", "price", "pricecurrency", "availability", "aggregaterating",
  "review", "certification", "award", "serviceoutput",
]);
const protectedFiles = {
  "content/pages/cat-cnc-go.md": "ac683fbccf7e78c0c8c15b9d4b2ed38305dc8dfe221e3e7ce4afaa8d9ce3cee7",
  "components/content/ServiceLanding.tsx": "fe7dcf735683435eece90725d1b02a8f7eac187d416716c05ac5aaa8175a5d4d",
  "components/content/MarkdownContent.tsx": "1d19ca92899e2e218c08b1ace12be9c5835896518a86f743d001f39b2067d22c",
  "app/gia-cong-cnc/page.tsx": "b4872fcbabcb4485d5f6a483a016475fc0d658e6c305902981e4c93f4bced29f",
  "content/pages/gia-cong-cnc-mdf.md": "978a4f30d54eb8fb6882af7886ea2392a81fe42ac4ddc5345f0a3ce1198fac03",
  "content/products/van-mdf.md": "81b7bf94bb09de778056d4946d2b17dd3b48365c099b0d5264a0a03023a992fa",
  "content/products/mdf-chong-am.md": "dbbf760a92d28ef04c364e703911419a0b7d6d036a44a1aa52e160bc27b3092a",
  "content/products/van-go-cong-nghiep.md": "6b38d451f730761caec9c8d07b955d1c6191857f9c5932330dff0f936a32126d",
  "content/products/go-ghep.md": "bfea5e6e4af0b456171e4a3981377f147118ecef658320497380a671be40657f",
  "content/products/go-ghep-cao-su.md": "9b76359a46276cceaae52ffbfb46e1db2b360d2524ea5c212a99664281a789f2",
  "content/products/go-ghep-tram.md": "5c14549d5640d455d88282def23d8bec495b6b2b0a53b93f3bfbe8a03f37c5be",
  "components/Header.tsx": "50f271d5649448492e2563a4945c5b85317857ae668607885a27db6462e2ce09",
  "components/Footer.tsx": "e1b5157eba8ca2655670b9b5967ec5836d82c8484f2045ddd591d142eeaa52bf",
};
const quoteAppBaseline = {
  hash: "cfc8239b063d49cc8f1b15654b5994fe106eeea4602dfac041958c95a0f2fc8b",
  files: 14252,
};
const expectedCtas = [
  { href: "https://zalo.me/0909259160", event: "click_zalo", location: "cat-cnc-go_hero", target: "_blank" },
  { href: "tel:+84909259160", event: "click_phone", location: "cat-cnc-go_hero", target: "" },
  { href: "https://zalo.me/0909259160", event: "click_zalo", location: "cat-cnc-go_checklist", target: "_blank" },
  { href: "https://zalo.me/0909259160", event: "click_zalo", location: "cat-cnc-go_checklist", target: "_blank" },
];
const forbiddenClaimPatterns = [
  /chính xác tuyệt đối/iu,
  /dung sai bằng 0/iu,
  /nhận mọi file/iu,
  /nhận mọi vật liệu/iu,
  /làm được mọi thiết kế/iu,
  /nhanh nhất/iu,
  /rẻ nhất/iu,
  /luôn có sẵn/iu,
  /giao ngay/iu,
];
const fabricatedSpecPatterns = [
  /(?:dung sai|sai số)\s*(?:±|\+\/-)?\s*\d/iu,
  /\b\d+(?:[.,]\d+)?\s*(?:mm|cm|m)\b/iu,
  /\b\d+(?:[.,]\d+)?\s*(?:phút|giờ|ngày|tuần)\b/iu,
  /\b(?:khổ máy|công suất|lead time|MOQ)\b/iu,
  /\b(?:Homag|Biesse|SCM|Anderson|Weeke)\b/iu,
];
const unverifiedFormatPatterns = [/(?:^|[\s(])(?:DXF|DWG|AI|CDR|PDF)(?=$|[\s),.;:])/u];
const placeholderPatterns = [/\[cần cập nhật\]/iu, /lorem ipsum/iu, /\bTODO\b/u, /đang cập nhật nội dung/iu];

const runtimeValue = process.env.CAT_CNC_GO_CHECK_ORIGIN ?? process.argv[2];
if (!runtimeValue) {
  console.error("Thiếu CAT_CNC_GO_CHECK_ORIGIN hoặc origin ở đối số đầu tiên.");
  process.exit(1);
}

let origin;
try {
  origin = new URL(runtimeValue);
} catch {
  console.error(`Origin không hợp lệ: ${runtimeValue}`);
  process.exit(1);
}

const screenshotDirectory = process.env.CAT_CNC_GO_SCREENSHOT_DIR
  ? path.resolve(process.env.CAT_CNC_GO_SCREENSHOT_DIR)
  : null;
const auditOnly = process.env.CAT_CNC_GO_AUDIT_ONLY === "1";

const audit = await auditServicePage({ origin, routePath, screenshotDirectory, screenshotPrefix: "cat-cnc-go" });
const report = summarizeServiceAudit({ direct: audit.direct, results: audit.results, prohibitedSchemaKeys });
const incoming = await auditIncomingLinks({ origin, targetPath: routePath });
const snapshots = await auditPageContentSnapshots({ origin, paths: [routePath, "/gia-cong-cnc/", "/gia-cong-cnc-mdf/"] });
const similarity = {
  serviceHub: similarityEvidence(snapshots[routePath], snapshots["/gia-cong-cnc/"]),
  cncMdf: similarityEvidence(snapshots[routePath], snapshots["/gia-cong-cnc-mdf/"]),
};
const quoteApp = directoryManifestSha256("quote-app");
const schemaUrls = [];
const collectSchemaUrls = (value) => {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    for (const item of value) collectSchemaUrls(item);
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    if (["url", "@id", "item"].includes(key) && typeof child === "string" && child.startsWith("https://mdftungphat.com")) schemaUrls.push(child);
    collectSchemaUrls(child);
  }
};
for (const schema of audit.results.desktop.schemas) collectSchemaUrls(schema);

console.log(JSON.stringify({ ...report, incoming, similarity, quoteApp, schemaUrls: [...new Set(schemaUrls)].sort() }, null, 2));
if (auditOnly) process.exit(0);

const errors = await validateServicePageAudit({
  audit,
  report,
  origin,
  routePath,
  canonicalUrl,
  expectedTitle,
  expectedDescription,
  baselineWords,
  minWords: 1800,
  maxWords: 3500,
  minTables: 4,
  expectedFaqCount: 2,
  requiredLinks,
  requiredHeadingPatterns,
  expectedCtas,
  forbiddenClaimPatterns,
  fabricatedSpecPatterns,
  unverifiedFormatPatterns,
  placeholderPatterns,
});
const check = (condition, message) => {
  if (!condition) errors.push(message);
};

check(incoming.targetStatus === 200 && !incoming.targetLocation, "Incoming-link target phải trả 200 trực tiếp.");
check(incoming.occurrences > 0, "Không tìm thấy incoming internal link tới /cat-cnc-go/.");
check(incoming.uniqueSources > 0, "/cat-cnc-go/ vẫn orphan trong sitemap graph.");
check(incoming.bodyContentSources.length > 0, "Incoming links chỉ đến từ utility/navigation, chưa có body-content source.");
check(!audit.results.desktop.images[0]?.alt.includes("Tùng Phát"), "Alt ảnh không được gọi đây là ảnh tại Tùng Phát khi chưa có proof.");
check(/ảnh minh họa/iu.test(audit.results.desktop.images[0]?.alt ?? ""), "Alt ảnh phải nói rõ đây là ảnh minh họa.");

for (const [label, evidence] of Object.entries(similarity)) {
  check(!evidence.sameHeadingSequence, `Heading sequence trùng hoàn toàn với ${label}.`);
  check(evidence.exactLongParagraphs.length === 0, `Có đoạn dài trùng nguyên văn với ${label}: ${evidence.exactLongParagraphs.length}.`);
  check(evidence.sharedTableRows.length <= 2, `Có quá nhiều dòng bảng trùng với ${label}: ${evidence.sharedTableRows.length}.`);
  check(evidence.sharedFaq.length === 0, `FAQ trùng nguyên văn với ${label}: ${evidence.sharedFaq.length}.`);
  check(evidence.fiveGramJaccard < 0.35, `Similarity 5-gram với ${label} quá cao (${evidence.fiveGramJaccard.toFixed(4)}).`);
}

for (const [file, expectedHash] of Object.entries(protectedFiles)) {
  check(fileSha256(file) === expectedHash, `${file} thay đổi byte-for-byte ngoài phạm vi được duyệt.`);
}
check(quoteApp.hash === quoteAppBaseline.hash, `quote-app manifest drift: ${quoteApp.hash}.`);
check(quoteApp.files === quoteAppBaseline.files, `quote-app file count drift: ${quoteApp.files}.`);

if (errors.length > 0) {
  console.error(`Cắt CNC gỗ page validation failed (${errors.length}):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Cắt CNC gỗ page validation pass.");
