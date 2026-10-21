import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { getAllSupplierSearchEntriesForCatalogue } from "@/lib/catalog/suppliers/search";
import type { SupplierId } from "@/lib/catalog/core/types";

const directory = join(process.cwd(), "public", "data");
mkdirSync(directory, { recursive: true });
const entries = getAllSupplierSearchEntriesForCatalogue();

for (const supplier of ["thanh-thuy", "ba-thanh", "an-cuong"] as SupplierId[]) {
  const file = join(directory, `catalogue-search-${supplier}.json`);
  const content = JSON.stringify(entries.filter((entry) => entry.supplierId === supplier));
  let current = "";
  try { current = readFileSync(file, "utf8"); } catch { /* First generation. */ }
  if (current !== content) writeFileSync(file, content);
  console.log(`${supplier}: ${JSON.parse(content).length} search entries`);
}
