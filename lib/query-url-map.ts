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

function normalizeUrl(value: string) {
  const [path, hash] = value.split("#");
  const normalizedPath = path === "/" ? "/" : `/${path.replace(/^\/+|\/+$/gu, "")}/`;
  return hash ? `${normalizedPath}#${hash}` : normalizedPath;
}

export function buildQueryUrlMap(queries: QueryInput[]): QueryUrlMapEntry[] {
  return queries.map((query) => {
    const isBrandPlaceholder = query.intent === "brand-material";
    const isReferenceComparison = referenceComparisons.includes(query.query);
    const targetUrl = isBrandPlaceholder || isReferenceComparison ? (isReferenceComparison ? "/tham-chieu-vat-lieu/" : "/san-pham/") : normalizeUrl(query.idealLandingUrl);
    const currentStatus = isBrandPlaceholder
      ? "SHOULD_NOT_TARGET"
      : isReferenceComparison
        ? "COVERED"
        : query.intent === "comparison" || query.query.includes("báo giá") || query.query.includes("giá")
          ? "PARTIAL"
          : "COVERED";
    const coverage = isReferenceComparison ? "comparison-table" : currentStatus === "SHOULD_NOT_TARGET" ? "placeholder-or-unverified-catalogue" : currentStatus === "PARTIAL" ? "answer-with-verification-caveat" : "direct-answer-and-related-links";
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
