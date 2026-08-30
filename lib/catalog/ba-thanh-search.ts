type BaThanhMerchandisingRecord = {
  displayName: string;
  category: string;
  images: unknown[];
  seoStatus: string;
};

const categoryDemandWeights: Record<string, number> = {
  "van-go": 36,
  "don-sac": 32,
  "van-da": 24,
  "van-vai": 18,
};

export function getBaThanhMerchandisingScore(record: BaThanhMerchandisingRecord): number {
  return (
    (record.seoStatus === "READY_TO_INDEX" ? 100 : 0) +
    (categoryDemandWeights[record.category] ?? 0) +
    (record.images.length ? 12 : 0) +
    (record.displayName.trim() ? 8 : 0)
  );
}

export function sortBaThanhCodesByDemand<Record extends BaThanhMerchandisingRecord>(items: Record[]): Record[] {
  return [...items].sort(
    (left, right) =>
      getBaThanhMerchandisingScore(right) - getBaThanhMerchandisingScore(left) ||
      left.displayName.localeCompare(right.displayName, "vi"),
  );
}

function fold(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toUpperCase();
}

export function normalizeBaThanhSearch(value: string) {
  return fold(value).replace(/[^A-Z0-9]+/g, "");
}
