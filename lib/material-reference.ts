import { getMaterialDataset, type Material, type MaterialComparisonRecord, type MaterialDataset } from "@/lib/materials";

export type MaterialReferenceFilters = { search: string; category: string };

export function filterMaterials(materials: Material[], filters: MaterialReferenceFilters) {
  const search = filters.search.trim().toLocaleLowerCase("vi-VN");
  return materials.filter((material) => {
    const categoryMatches = filters.category === "all" || material.category === filters.category;
    if (!categoryMatches) return false;
    if (!search) return true;
    const searchable = [material.name, material.category, material.materialClass, material.manufacturer ?? "", material.finish ?? "", ...material.applications, ...material.limitations]
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
  const header = ["id", "recordType", "slug", "name", "manufacturer", "category", "materialClass", "dimensions", "thicknesses", "finish", "surface", "applications", "limitations", "sourceIds", "lastVerified"];
  const rows = dataset.materials.map((material) => [
    material.id,
    material.recordType,
    material.slug,
    material.name,
    printable(material.manufacturer),
    material.category,
    material.materialClass,
    printable(material.dimensions),
    printable(material.thicknesses),
    printable(material.finish),
    printable(material.surface),
    printable(material.applications),
    printable(material.limitations),
    material.sourceIds.join("; "),
    dataset.lastVerified,
  ]);
  return [header.join(","), ...rows.map((row) => row.map(csvCell).join(","))].join("\n") + "\n";
}

export function getMaterialComparisonMatrix() {
  return getMaterialDataset().comparisonMatrix;
}

export function toMaterialComparisonCsv(records: MaterialComparisonRecord[]) {
  const header = ["id", "name", "composition", "density", "moistureBehavior", "machining", "surfaceFinish", "typicalApplications", "choiceGuidance", "sourceIds"];
  const rows = records.map((record) => [record.id, record.name, printable(record.composition), printable(record.density), printable(record.moistureBehavior), printable(record.machining), printable(record.surfaceFinish), printable(record.typicalApplications), printable(record.choiceGuidance), record.sourceIds.join("; ")]);
  return [header.join(","), ...rows.map((row) => row.map(csvCell).join(","))].join("\n") + "\n";
}

export function toMaterialComparisonJson(dataset: MaterialDataset) {
  return `${JSON.stringify(
    {
      schemaVersion: dataset.schemaVersion,
      lastVerified: dataset.lastVerified,
      caveat:
        "Family-level comparison only; no stock, SKU, machine-limit or universal performance claim is implied.",
      records: dataset.comparisonMatrix,
      sources: dataset.sources,
    },
    null,
    2,
  )}\n`;
}
