import type { CatalogSearchEntry } from "./core/types";
import { canonicalCatalogGroups } from "./material-taxonomy";
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

export function formatCatalogCardTitle(
  entry: Pick<CatalogSearchEntry, "supplierId" | "code" | "name">,
): string {
  const cleanedName =
    entry.supplierId === "ba-thanh"
      ? entry.name
          .replace(/^(?:MELAMINE|LAMINATE)\s+BA\s+THANH(?:\s*[–—-]\s*|\s+)/iu, "")
          .trim()
      : entry.name.trim();
  const code = entry.code.trim();
  if (!code) return cleanedName;
  if (normalizeCatalogSearch(cleanedName).startsWith(normalizeCatalogSearch(code))) {
    return cleanedName;
  }
  return `${code} ${cleanedName}`.trim();
}

export function formatCatalogCardTaxonomy(
  entry: Pick<
    CatalogSearchEntry,
    "canonicalGroup" | "category" | "series" | "group" | "material"
  >,
): string {
  const seen = new Set<string>();
  const canonicalLabel = canonicalCatalogGroups.find(
    (item) => item.slug === entry.canonicalGroup,
  )?.label;
  const sourceGroup = entry.group?.trim();
  const keepSourceGroup = sourceGroup && !entry.canonicalGroup;
  const labels = [
    entry.category ?? entry.material,
    canonicalLabel,
    entry.series,
    keepSourceGroup ? sourceGroup : undefined,
  ]
    .filter((value): value is string => Boolean(value?.trim()))
    .map((value) => {
      const label = humanizeCatalogLabel(value);
      return label.charAt(0).toLocaleUpperCase("vi") + label.slice(1);
    })
    .filter((label) => {
      const normalized = normalizeCatalogSearch(label);
      if (seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    });

  return `Danh mục: ${labels.join(" · ") || "Chưa phân nhóm"}`;
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
