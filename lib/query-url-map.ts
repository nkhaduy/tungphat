type QueryInput = {
  query: string;
  intent: string;
  targetEntity: string;
  idealLandingUrl: string;
  expectedAnswerElements: string[];
  priority: string;
};

export type QueryUrlMapEntry = QueryInput & {
  targetUrl: string;
  currentStatus: "COVERED" | "PARTIAL" | "GAP" | "SHOULD_NOT_TARGET";
  coverage: string;
  missingAnswerElements: string[];
  cannibalizationKey: string;
};

const referenceComparisons = ["MDF thường và MDF chống ẩm khác nhau thế nào", "MDF chống ẩm và chống nước khác nhau thế nào"];
const evidenceBackedAnswers = new Set([
  "nhận báo giá ván MDF theo số lượng",
  "báo giá MDF chống ẩm theo mã hàng",
  "báo giá gỗ ghép cao su theo tấm",
  "báo giá gỗ ghép tràm theo tấm",
  "liên hệ Tùng Phát báo giá vật liệu",
  "yếu tố ảnh hưởng báo giá ván MDF",
  "vì sao giá vật liệu phải xác nhận theo mã hàng",
  "MDF và gỗ ghép khác nhau thế nào",
  "gỗ ghép cao su và gỗ ghép tràm",
  "ván trơn và ván phủ bề mặt khác nhau gì",
  "MDF thường hay MDF chống ẩm cho nội thất bếp",
  "yếu tố ảnh hưởng giá cắt CNC",
]);

function normalizeUrl(value: string) {
  const [path, hash] = value.split("#");
  const normalizedPath = path === "/" ? "/" : `/${path.replace(/^\/+|\/+$/gu, "")}/`;
  return hash ? `${normalizedPath}#${hash}` : normalizedPath;
}

export function buildQueryUrlMap(queries: QueryInput[]): QueryUrlMapEntry[] {
  return queries.map((query) => {
    const isBrandPlaceholder = query.intent === "brand-material";
    const isReferenceComparison = referenceComparisons.includes(query.query);
    const isEvidenceBackedAnswer = evidenceBackedAnswers.has(query.query);
    const targetUrl = isBrandPlaceholder || isReferenceComparison ? (isReferenceComparison ? "/tham-chieu-vat-lieu/" : "/san-pham/") : normalizeUrl(query.idealLandingUrl);
    const currentStatus = isBrandPlaceholder
      ? "SHOULD_NOT_TARGET"
      : isReferenceComparison || isEvidenceBackedAnswer
        ? "COVERED"
        : query.intent === "comparison" || query.query.includes("báo giá") || query.query.includes("giá")
          ? "PARTIAL"
          : "COVERED";
    const coverage = isReferenceComparison ? "comparison-table" : isEvidenceBackedAnswer ? "direct-answer-with-evidence-caveat" : currentStatus === "SHOULD_NOT_TARGET" ? "placeholder-or-unverified-catalogue" : currentStatus === "PARTIAL" ? "answer-with-verification-caveat" : "direct-answer-and-related-links";
    const missingAnswerElements = currentStatus === "PARTIAL" ? query.expectedAnswerElements.filter((element) => /giá|mã|tồn kho|dung sai|định dạng/iu.test(element)) : [];
    return {
      ...query,
      targetUrl,
      currentStatus,
      coverage,
      missingAnswerElements,
      cannibalizationKey: query.targetEntity.toLocaleLowerCase("vi-VN").replace(/\s+/gu, "-")
    };
  });
}
