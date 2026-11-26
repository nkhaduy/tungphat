import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { getCatalogueListingEntries, splitCataloguePages, CATALOGUE_PAGE_SIZE } from "@/lib/catalog/listing";
import type { SupplierId } from "@/lib/catalog/core/types";

const directory = join(process.cwd(), "public", "data");
mkdirSync(directory, { recursive: true });
const publicCodes = getCatalogueListingEntries();
const pageSize = CATALOGUE_PAGE_SIZE;
const pagesDirectory = join(directory, "catalogue-pages");
mkdirSync(pagesDirectory, { recursive: true });

function writeIfChanged(file: string, value: unknown) {
  const content = JSON.stringify(value);
  let current = "";
  try { current = readFileSync(file, "utf8"); } catch { /* First generation. */ }
  if (current !== content) writeFileSync(file, content);
}

const pages = splitCataloguePages(publicCodes, pageSize);
writeIfChanged(join(pagesDirectory, "index.json"), { total: publicCodes.length, pageSize, pageCount: pages.length });
for (let page = 2; page <= pages.length; page += 1) {
  writeIfChanged(
    join(pagesDirectory, `page-${page}.json`),
    pages[page - 1],
  );
}

for (const supplier of ["thanh-thuy", "ba-thanh", "an-cuong"] as SupplierId[]) {
  const file = join(directory, `catalogue-search-${supplier}.json`);
  const content = JSON.stringify(publicCodes.filter((entry) => entry.supplierId === supplier));
  let current = "";
  try { current = readFileSync(file, "utf8"); } catch { /* First generation. */ }
  if (current !== content) writeFileSync(file, content);
  console.log(`${supplier}: ${JSON.parse(content).length} search entries`);
}
