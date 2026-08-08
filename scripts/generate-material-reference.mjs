import fs from "node:fs";
import path from "node:path";
import dataset from "../data/materials/materials.json" with { type: "json" };

function cell(value) {
  const printable = value === null || value.length === 0 ? "Chưa xác minh" : Array.isArray(value) ? value.join("; ") : value;
  return `"${String(printable).replaceAll('"', '""')}"`;
}

const header = ["slug", "name", "category", "materialClass", "dimensions", "thicknesses", "surface", "applications", "limitations", "sourceIds", "lastVerified"];
const rows = dataset.materials.map((material) => [material.slug, material.name, material.category, material.materialClass, material.dimensions, material.thicknesses, material.surface, material.applications, material.limitations, material.sourceIds, dataset.lastVerified]);
const csv = [header.join(","), ...rows.map((row) => row.map(cell).join(","))].join("\n") + "\n";
fs.mkdirSync(path.dirname("public/material-reference.csv"), { recursive: true });
fs.writeFileSync("public/material-reference.csv", csv);
console.log(`Generated public/material-reference.csv (${dataset.materials.length} records)`);
