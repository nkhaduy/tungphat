import { getMaterialDataset, validateMaterialDatasetProvenance } from "../lib/materials";

const errors = validateMaterialDatasetProvenance(getMaterialDataset());
if (errors.length) {
  console.error(`Material provenance validation failed (${errors.length}):\n- ${errors.join("\n- ")}`);
  process.exit(1);
}
console.log(`Material provenance validation pass: ${getMaterialDataset().materials.length} records, ${getMaterialDataset().sources.length} sources, no P5-backed published facts.`);
