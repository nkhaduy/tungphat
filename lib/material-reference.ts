import type { Material, MaterialDataset } from "@/lib/materials";

export type MaterialReferenceFilters = { search: string; category: string };

export function filterMaterials(materials: Material[], filters: MaterialReferenceFilters) {
  const search = filters.search.trim().toLocaleLowerCase("vi-VN");
  return materials.filter((material) => {
    const categoryMatches = filters.category === "all" || material.category === filters.category;
    if (!categoryMatches) return false;
    if (!search) return true;
    const searchable = [material.name, material.category, material.materialClass, ...material.applications, ...material.limitations]
      .join(" ")
      .toLocaleLowerCase("vi-VN");
    return searchable.includes(search);
  });
}

function csvCell(value: string) {
  return `"${value.replace(/"/gu, '""')}"`;
}

function printable(value: string | string[] | null) {
  if (value === null || value.length === 0) return "Chưa xác minh";
  return Array.isArray(value) ? value.join("; ") : value;
}

export function toMaterialReferenceCsv(dataset: MaterialDataset) {
  const header = ["slug", "name", "category", "materialClass", "dimensions", "thicknesses", "surface", "applications", "limitations", "sourceIds", "lastVerified"];
  const rows = dataset.materials.map((material) => [
    material.slug,
    material.name,
    material.category,
    material.materialClass,
    printable(material.dimensions),
    printable(material.thicknesses),
    printable(material.surface),
    printable(material.applications),
    printable(material.limitations),
    material.sourceIds.join("; "),
    dataset.lastVerified,
  ]);
  return [header.join(","), ...rows.map((row) => row.map(csvCell).join(","))].join("\n") + "\n";
}
