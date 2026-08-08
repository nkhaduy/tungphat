import type { CatalogSearchEntry } from "./core/types";
import { normalizeCatalogSearch } from "./core/search";

const catalogueLabels: Record<string, string> = {
  "don-sac": "Đơn sắc",
  "van-go": "Vân gỗ",
  "van-da": "Vân đá",
  "van-vai": "Vân vải",
  "pvc-film": "PVC Film",
  worktop: "Mặt Top (Compact)",
  "edge-banding": "Chỉ Dán Cạnh",
  ppet: "PPET",
  pvc: "PVC",
};

export function humanizeCatalogLabel(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "Chưa phân nhóm";
  if (!trimmed.includes("-")) return trimmed;
  if (catalogueLabels[trimmed]) return catalogueLabels[trimmed];

  return trimmed
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toLocaleUpperCase("vi") + word.slice(1))
    .join(" ");
}

export function findExactCatalogCodeMatch(
  entries: CatalogSearchEntry[],
  query: string,
): CatalogSearchEntry | undefined {
  const normalizedQuery = normalizeCatalogSearch(query);
  if (!normalizedQuery) return undefined;
  const matches = entries.filter(
    (entry) =>
      normalizeCatalogSearch(entry.code) === normalizedQuery ||
      (entry.aliases ?? []).some(
        (alias) => normalizeCatalogSearch(alias) === normalizedQuery,
      ),
  );
  return matches.length === 1 ? matches[0] : undefined;
}

export function findExactSupplierMatch<
  Supplier extends { displayName: string },
>(suppliers: Supplier[], query: string): Supplier | undefined {
  const normalizedQuery = normalizeCatalogSearch(query);
  if (!normalizedQuery) return undefined;
  const matches = suppliers.filter(
    (supplier) =>
      normalizeCatalogSearch(supplier.displayName) === normalizedQuery,
  );
  return matches.length === 1 ? matches[0] : undefined;
}
