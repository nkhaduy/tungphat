import fs from "node:fs";
import path from "node:path";
import dataset from "../data/materials/materials.json" with { type: "json" };

function cell(value) {
  const printable = value === null || value.length === 0 ? "Chưa xác minh" : Array.isArray(value) ? value.join("; ") : value;
  return `"${String(printable).replaceAll('"', '""')}"`;
}

const header = ["id", "recordType", "slug", "name", "manufacturer", "category", "materialClass", "dimensions", "thicknesses", "finish", "surface", "applications", "limitations", "sourceIds", "lastVerified"];
const rows = dataset.materials.map((material) => [material.id, material.recordType, material.slug, material.name, material.manufacturer, material.category, material.materialClass, material.dimensions, material.thicknesses, material.finish, material.surface, material.applications, material.limitations, material.sourceIds, dataset.lastVerified]);
const csv = [header.join(","), ...rows.map((row) => row.map(cell).join(","))].join("\n") + "\n";
fs.mkdirSync(path.dirname("public/material-reference.csv"), { recursive: true });
fs.writeFileSync("public/material-reference.csv", csv);
const comparisonHeader = ["id", "name", "composition", "density", "moistureBehavior", "machining", "surfaceFinish", "typicalApplications", "choiceGuidance", "sourceIds"];
const comparisonRows = dataset.comparisonMatrix.map((record) => [record.id, record.name, record.composition, record.density, record.moistureBehavior, record.machining, record.surfaceFinish, record.typicalApplications, record.choiceGuidance, record.sourceIds]);
const comparisonCsv = [comparisonHeader.join(","), ...comparisonRows.map((row) => row.map(cell).join(","))].join("\n") + "\n";
fs.writeFileSync("public/material-comparison-matrix.csv", comparisonCsv);
fs.writeFileSync("public/material-comparison-matrix.json", `${JSON.stringify({ schemaVersion: dataset.schemaVersion, lastVerified: dataset.lastVerified, caveat: "Family-level comparison only; no stock, SKU, machine-limit or universal performance claim is implied.", records: dataset.comparisonMatrix, sources: dataset.sources }, null, 2)}\n`);
console.log(`Generated material reference assets (${dataset.materials.length} records; ${dataset.comparisonMatrix.length} comparison rows)`);
