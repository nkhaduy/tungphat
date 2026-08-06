export type ThanhThuySearchItem = {
  slug: string;
  code: string;
  name: string;
  categorySlug: string;
  categoryName: string;
  seriesName?: string;
  color?: string;
  pattern?: string;
  image: string;
  imageAlt: string;
  seoStatus: string;
};

const categoryDemand: Record<string, number> = {
  melamine: 500,
  laminate: 380,
  acrylic: 300,
  veneer: 240,
  "pvc-film": 180,
  "chi-nep-nhua": 120,
};

export function normalizeThanhThuySearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLocaleLowerCase("vi")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function normalizedCode(value: string): string {
  return normalizeThanhThuySearch(value).replace(/\s+/g, "");
}

export function getThanhThuyMerchandisingScore(
  item: ThanhThuySearchItem,
): number {
  const intent = normalizeThanhThuySearch(
    `${item.categoryName} ${item.seriesName || ""} ${item.pattern || ""}`,
  );
  let score = categoryDemand[item.categorySlug] ?? 0;
  if (intent.includes("van go")) score += 80;
  else if (intent.includes("don sac")) score += 70;
  else if (intent.includes("van da")) score += 60;
  else if (intent.includes("van vai")) score += 50;
  if (item.seoStatus === "READY_TO_INDEX") score += 40;
  if (item.image) score += 20;
  if (item.code) score += 15;
  if (item.seriesName || item.pattern || item.color) score += 10;
  return score;
}

export function searchThanhThuyItems<T extends ThanhThuySearchItem>(
  items: readonly T[],
  query: string,
  category: string,
): T[] {
  const needle = normalizeThanhThuySearch(query);
  const codeNeedle = normalizedCode(query);

  return items
    .filter((item) => {
      if (category && item.categorySlug !== category) return false;
      if (!needle) return true;
      if (normalizedCode(item.code).includes(codeNeedle)) return true;
      return normalizeThanhThuySearch(
        [
          item.name,
          item.code,
          item.categoryName,
          item.seriesName,
          item.color,
          item.pattern,
        ]
          .filter(Boolean)
          .join(" "),
      ).includes(needle);
    })
    .sort((left, right) => {
      const leftCode = normalizedCode(left.code);
      const rightCode = normalizedCode(right.code);
      const leftName = normalizeThanhThuySearch(left.name);
      const rightName = normalizeThanhThuySearch(right.name);
      const searchScore = (itemCode: string, itemName: string) => {
        if (!needle) return 0;
        if (itemCode === codeNeedle) return 100_000;
        if (itemName === needle) return 90_000;
        if (itemCode.startsWith(codeNeedle)) return 80_000;
        return 0;
      };
      const scoreDifference =
        searchScore(rightCode, rightName) +
        getThanhThuyMerchandisingScore(right) -
        searchScore(leftCode, leftName) -
        getThanhThuyMerchandisingScore(left);
      if (scoreDifference) return scoreDifference;
      return left.code.localeCompare(right.code, "vi", {
        numeric: true,
        sensitivity: "base",
      });
    });
}
