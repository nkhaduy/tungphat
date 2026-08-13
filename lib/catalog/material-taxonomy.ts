import type {
  CanonicalCatalogGroup,
  CatalogSearchEntry,
  SupplierId,
} from "./core/types";

export const materialTaxonomy = [
  { slug: "all", label: "Tất cả" },
  { slug: "melamine", label: "Melamine" },
  { slug: "laminate", label: "Laminate" },
  { slug: "acrylic", label: "Acrylic" },
  { slug: "veneer", label: "Veneer" },
  { slug: "pvc-ppet", label: "PVC / PPET" },
  { slug: "worktop", label: "Mặt Top (Compact)" },
  { slug: "edge-banding", label: "Mã cạnh" },
  { slug: "panel", label: "Panel" },
  { slug: "other-decorative", label: "Khác" },
] as const;

export type MaterialTaxonomySlug = Exclude<(typeof materialTaxonomy)[number]["slug"], "all">;

export const canonicalCatalogGroups = [
  { slug: "all", label: "Tất cả" },
  { slug: "woodgrain", label: "Vân gỗ" },
  { slug: "solid", label: "Đơn sắc" },
  { slug: "stone-material", label: "Vân đá / vật liệu" },
  { slug: "textile-leather-rattan", label: "Vân vải / da / mây" },
  { slug: "effect", label: "Hiệu ứng khác" },
] as const;

export type { CanonicalCatalogGroup } from "./core/types";

export function isMaterialTaxonomySlug(value: string): value is MaterialTaxonomySlug {
  return materialTaxonomy.some((item) => item.slug !== "all" && item.slug === value);
}

function fold(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase();
}

export function classifyMaterialTaxonomy(values: Array<string | undefined>): MaterialTaxonomySlug | undefined {
  const value = fold(values.filter(Boolean).join(" "));
  if (/chi (dan canh|nep)|edge band|pvc edge|abs edge/.test(value)) return "edge-banding";
  if (/acrylic/.test(value)) return "acrylic";
  if (/laminate|high pressure laminate|hpl/.test(value)) return "laminate";
  if (/melamine/.test(value)) return "melamine";
  if (/veneer|van lang/.test(value)) return "veneer";
  if (/ppet|pvc|decal/.test(value)) return "pvc-ppet";
  if (/worktop|mat top|compact top/.test(value)) return "worktop";
  if (/3d|decorative|trang tri|panel|tam op|wall/.test(value)) return "panel";
  if (value.trim()) return "other-decorative";
  return undefined;
}

export function classifyCatalogGroup(
  values: Array<string | undefined>,
): CanonicalCatalogGroup | undefined {
  const value = fold(values.filter(Boolean).join(" "))
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  if (/van go|woodgrain|wood grain|wood pattern/.test(value)) return "woodgrain";
  if (/don sac|solid colou?r|solid color|uni colou?r|uni color/.test(value)) return "solid";
  if (/van da|stone|vat lieu cong nghiep|industrial material|metal|xi mang|cement/.test(value)) {
    return "stone-material";
  }
  if (/van vai|\bvai\b|textile|fabric|\bda\b|leather|\bmay\b|rattan/.test(value)) {
    return "textile-leather-rattan";
  }
  if (/hieu ung|effect|metallic|glitter|pearlescent|high gloss|sieu mo/.test(value)) return "effect";
  return undefined;
}

export function catalogGroupOptions(
  entries: CatalogSearchEntry[],
  filters: { supplierId?: SupplierId | ""; material?: string } = {},
) {
  const scoped = entries.filter((entry) => {
    if (filters.supplierId && entry.supplierId !== filters.supplierId) return false;
    if (filters.material && entry.material !== filters.material) return false;
    return true;
  });
  const counts = new Map<CanonicalCatalogGroup, number>();
  for (const entry of scoped) {
    if (!entry.canonicalGroup) continue;
    counts.set(entry.canonicalGroup, (counts.get(entry.canonicalGroup) ?? 0) + 1);
  }
  return canonicalCatalogGroups
    .map((item) => ({
      ...item,
      count: item.slug === "all" ? scoped.length : counts.get(item.slug) ?? 0,
    }))
    .filter((item) => item.count > 0);
}

export function materialTaxonomyOptions(entries: CatalogSearchEntry[]) {
  const counts = new Map<string, number>();
  for (const entry of entries) {
    if (entry.material) counts.set(entry.material, (counts.get(entry.material) ?? 0) + 1);
  }
  return materialTaxonomy
    .map((item) => ({ ...item, count: item.slug === "all" ? entries.length : counts.get(item.slug) ?? 0 }))
    .filter((item) => item.count > 0);
}

export function materialTaxonomyOptionsForSupplier(
  entries: CatalogSearchEntry[],
  supplierId?: CatalogSearchEntry["supplierId"] | "",
) {
  return materialTaxonomyOptions(
    supplierId ? entries.filter((entry) => entry.supplierId === supplierId) : entries,
  );
}
