import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import {
  auditProductPage,
  fileSha256,
  summarizeProductAudit,
  validateProductPageAudit,
} from "./lib/product-page-audit.mjs";

const routePath = "/go-ghep-tram/";
const canonicalUrl = "https://mdftungphat.com/go-ghep-tram/";
const baselineWords = 414;
const expectedTitle = "Gỗ ghép tràm tại TP.HCM: kiểm tra quy cách | Tùng Phát";
const expectedDescription = "Tìm hiểu cách chọn gỗ ghép tràm theo phân hạng, bề mặt và quy cách. Liên hệ Tùng Phát để kiểm tra lô hàng và báo giá thực tế tại TP.HCM.";
const requiredLinks = ["/go-ghep/", "/go-ghep-cao-su/", "/cat-cnc-go/"];
const requiredHeadingPatterns = [
  /không phải một mã hàng duy nhất/iu,
  /Khi nào nên đưa gỗ ghép tràm vào phương án/iu,
  /thông tin cần chốt trước khi hỏi mua/iu,
  /phân hạng/iu,
  /mặt, cạnh và đường ghép/iu,
  /bản vẽ.*quy cách/iu,
  /Ứng dụng có điều kiện/iu,
  /cắt và CNC/iu,
  /Checklist gửi yêu cầu/iu,
];
const prohibitedSchemaKeys = new Set([
  "offer", "offers", "price", "pricecurrency", "availability", "sku", "mpn",
  "gtin", "gtin8", "gtin12", "gtin13", "gtin14", "aggregaterating", "review", "certification",
]);
const protectedFiles = {
  "content/products/go-ghep.md": "bfea5e6e4af0b456171e4a3981377f147118ecef658320497380a671be40657f",
  "content/products/go-ghep-cao-su.md": "9b76359a46276cceaae52ffbfb46e1db2b360d2524ea5c212a99664281a789f2",
  "content/products/van-mdf.md": "81b7bf94bb09de778056d4946d2b17dd3b48365c099b0d5264a0a03023a992fa",
  "content/products/mdf-chong-am.md": "dbbf760a92d28ef04c364e703911419a0b7d6d036a44a1aa52e160bc27b3092a",
  "content/products/van-go-cong-nghiep.md": "6b38d451f730761caec9c8d07b955d1c6191857f9c5932330dff0f936a32126d",
  "components/Header.tsx": "50f271d5649448492e2563a4945c5b85317857ae668607885a27db6462e2ce09",
  "components/Footer.tsx": "e1b5157eba8ca2655670b9b5967ec5836d82c8484f2045ddd591d142eeaa52bf",
};
const expectedCtas = [
  { href: "https://zalo.me/0909259160", event: "click_zalo", location: "go-ghep-tram_hero", target: "_blank" },
  { href: "tel:+84909259160", event: "click_phone", location: "go-ghep-tram_hero", target: "" },
  { href: "https://zalo.me/0909259160", event: "click_zalo", location: "go-ghep-tram_specs", target: "_blank" },
  { href: "https://zalo.me/0909259160", event: "click_zalo", location: "go-ghep-tram_specs", target: "_blank" },
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
  /chống mối mọt tuyệt đối/iu,
  /bền như gỗ nguyên khối/iu,
  /grade\s*A{1,2}/iu,
  /chuẩn xuất khẩu/iu,
];
const fabricatedSpecPatterns = [
  /\b(?:AA|AB|AC|BC)\b/u,
  /\bFSC\b/u,
  /finger[ -]?joint/iu,
  /\b(?:MOQ|SKU)\b/u,
  /\b\d+(?:[.,]\d+)?\s*(?:mm|cm|m)\b/iu,
  /\b\d+(?:[.,]\d+)?\s*%\s*(?:độ ẩm|ẩm)/iu,
  /\bkeo\s+(?:pva|pu|e\d|melamine|urea|phenol)/iu,
];
const placeholderPatterns = [/\[cần cập nhật\]/iu, /lorem ipsum/iu, /\bTODO\b/u, /đang cập nhật nội dung/iu];
const nonexistentWoodRoute = /^\/(?:go-ghep-(?!cao-su(?:\/|$)|tram(?:\/|$))|go-(?:thong|xoan|keo|soi)(?:\/|$))/iu;

function markdownBody(file) {
  const source = fs.readFileSync(file, "utf8");
  const end = source.indexOf("\n---", 4);
  return end >= 0 ? source.slice(end + 4).trim() : source;
}

function normalizeWords(value) {
  return value.toLocaleLowerCase("vi").normalize("NFC").replace(/[^\p{L}\p{N}]+/gu, " ").trim().split(/\s+/u).filter(Boolean);
}

function shingles(words, size) {
  return new Set(words.slice(0, Math.max(0, words.length - size + 1)).map((_, index) => words.slice(index, index + size).join(" ")));
}

function similarityEvidence(left, right) {
  const leftWords = normalizeWords(left);
  const rightWords = normalizeWords(right);
  const leftShingles = shingles(leftWords, 5);
  const rightShingles = shingles(rightWords, 5);
  const shared = [...leftShingles].filter((value) => rightShingles.has(value));
  const union = new Set([...leftShingles, ...rightShingles]);
  const paragraphs = (value) => value.split(/\n\s*\n/u).map((item) => normalizeWords(item).join(" ")).filter((item) => item.split(" ").length >= 20);
  const rightParagraphs = new Set(paragraphs(right));
  const exactLongParagraphs = paragraphs(left).filter((item) => rightParagraphs.has(item));
  const tableRows = (value) => value.split("\n").map((item) => item.trim()).filter((item, index, lines) => /^\|.+\|$/u.test(item) && !/^\|\s*[-:]/u.test(item) && !/^\|\s*[-:]/u.test(lines[index + 1] ?? ""));
  const rightRows = new Set(tableRows(right));
  const sharedTableRows = tableRows(left).filter((item) => rightRows.has(item));
  const headings = (value) => value.split("\n").filter((line) => /^#{2,3}\s/u.test(line)).map((line) => line.replace(/^#{2,3}\s+/u, "").trim());
  return {
    fiveGramJaccard: union.size ? shared.length / union.size : 0,
    sharedFiveGrams: shared.length,
    exactLongParagraphs,
    sharedTableRows,
    sameHeadingSequence: JSON.stringify(headings(left)) === JSON.stringify(headings(right)),
  };
}

const runtimeValue = process.env.GO_GHEP_TRAM_CHECK_ORIGIN ?? process.argv[2];
if (!runtimeValue) {
  console.error("Thiếu GO_GHEP_TRAM_CHECK_ORIGIN hoặc origin ở đối số đầu tiên.");
  process.exit(1);
}

let origin;
try {
  origin = new URL(runtimeValue);
} catch {
  console.error(`Origin không hợp lệ: ${runtimeValue}`);
  process.exit(1);
}

const screenshotDirectory = process.env.GO_GHEP_TRAM_SCREENSHOT_DIR
  ? path.resolve(process.env.GO_GHEP_TRAM_SCREENSHOT_DIR)
  : null;
const auditOnly = process.env.GO_GHEP_TRAM_AUDIT_ONLY === "1";

const audit = await auditProductPage({ origin, routePath, screenshotDirectory, screenshotPrefix: "go-ghep-tram" });
const report = summarizeProductAudit({ direct: audit.direct, results: audit.results, prohibitedSchemaKeys });
const similarity = similarityEvidence(markdownBody("content/products/go-ghep-tram.md"), markdownBody("content/products/go-ghep-cao-su.md"));

console.log(JSON.stringify({ ...report, similarity }, null, 2));
if (auditOnly) process.exit(0);

const errors = await validateProductPageAudit({
  audit,
  report,
  origin,
  routePath,
  canonicalUrl,
  expectedTitle,
  expectedDescription,
  baselineWords,
  minWords: 1500,
  maxWords: 3000,
  minTables: 3,
  expectedFaqCount: 2,
  requiredLinks,
  requiredHeadingPatterns,
  expectedCtas,
  forbiddenClaimPatterns,
  fabricatedSpecPatterns,
  placeholderPatterns,
  nonexistentRoutePattern: nonexistentWoodRoute,
});
const check = (condition, message) => {
  if (!condition) errors.push(message);
};
check(!similarity.sameHeadingSequence, "Trình tự heading trùng hoàn toàn với trang cao su.");
check(similarity.exactLongParagraphs.length === 0, `Có đoạn dài trùng nguyên văn với trang cao su: ${similarity.exactLongParagraphs.length}.`);
check(similarity.sharedTableRows.length <= 2, `Có quá nhiều dòng bảng trùng nguyên văn với trang cao su: ${similarity.sharedTableRows.length}.`);
check(similarity.fiveGramJaccard < 0.35, `Similarity 5-gram quá cao (${similarity.fiveGramJaccard.toFixed(4)}); cần đọc lại dấu hiệu clone.`);

for (const [file, expectedHash] of Object.entries(protectedFiles)) check(fileSha256(file) === expectedHash, `${file} thay đổi byte-for-byte ngoài phạm vi.`);

if (errors.length > 0) {
  console.error(`Gỗ ghép tràm page validation failed (${errors.length}):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Gỗ ghép tràm page validation pass.");
