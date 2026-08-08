import type { CatalogSearchEntry } from "./core/types";

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
