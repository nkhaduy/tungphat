import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { isValidProductRecordUrl, parseCliArgs } from "./lib";
import { thanhThuySeoStatuses, type ThanhThuyCatalog } from "./types";

function containsCommerceFields(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  if (Array.isArray(value)) return value.some(containsCommerceFields);
  return Object.entries(value as Record<string, unknown>).some(([key, child]) =>
    ["offer", "offers", "price", "stock", "stock_status", "availability"].includes(key.toLowerCase()) || containsCommerceFields(child));
}

export function validateCatalog(
  catalog: ThanhThuyCatalog,
  options: { root?: string; requireMediaFiles?: boolean } = {},
): string[] {
  const root = options.root ?? process.cwd();
  const errors: string[] = [];
  if (catalog.schemaVersion !== 1) errors.push("schemaVersion phải là 1");
  if (catalog.supplier !== "Thanh Thuỳ" || catalog.sourceName !== "Gỗ Thanh Thuỳ") errors.push("source attribution không hợp lệ");
  if (!Array.isArray(catalog.products) || !Array.isArray(catalog.categories)) errors.push("catalog arrays không hợp lệ");
  const ids = new Set<string>();
  const slugs = new Set<string>();
  const sourceUrls = new Set<string>();
  for (const product of catalog.products ?? []) {
    if (ids.has(product.id)) errors.push(`id trùng: ${product.id}`);
    if (slugs.has(product.slug)) errors.push(`slug trùng: ${product.slug}`);
    if (sourceUrls.has(product.sourceUrl)) errors.push(`sourceUrl trùng: ${product.sourceUrl}`);
    ids.add(product.id);
    slugs.add(product.slug);
    sourceUrls.add(product.sourceUrl);
    if (!isValidProductRecordUrl(product.sourceUrl)) errors.push(`sourceUrl không hợp lệ: ${product.sourceUrl}`);
    if (product.sourceName !== "Gỗ Thanh Thuỳ" || product.supplier !== "Thanh Thuỳ") errors.push(`attribution thiếu: ${product.id}`);
    if (!thanhThuySeoStatuses.includes(product.seoStatus)) errors.push(`seoStatus không hợp lệ: ${product.id}`);
    if (product.seoStatus === "READY_TO_INDEX" && (!product.published || !product.code || !product.image)) {
      errors.push(`READY_TO_INDEX thiếu quality gate: ${product.id}`);
    }
    if (product.image) {
      if (!product.image.src.startsWith("/catalog/thanh-thuy/") || /^https?:\/\//.test(product.image.src)) {
        errors.push(`hotlink ảnh: ${product.id}`);
      } else if (options.requireMediaFiles !== false) {
        const mediaFile = path.join(root, "public", product.image.src.replace(/^\//, ""));
        if (!fs.existsSync(mediaFile)) errors.push(`thiếu media: ${product.image.src}`);
      }
    }
    if (!product.checksum || !/^[a-f0-9]{64}$/.test(product.checksum)) errors.push(`checksum không hợp lệ: ${product.id}`);
    if (containsCommerceFields(product)) errors.push(`commerce field bị cấm: ${product.id}`);
  }
  return errors;
}

async function main() {
  const args = parseCliArgs();
  const file = typeof args.get("catalog") === "string"
    ? path.resolve(String(args.get("catalog")))
    : path.join(process.cwd(), "data/catalogs/thanh-thuy/catalog.json");
  const catalog = JSON.parse(fs.readFileSync(file, "utf8")) as ThanhThuyCatalog;
  const errors = validateCatalog(catalog);
  if (errors.length) throw new Error(errors.join("\n"));
  console.log(`Catalogue Thanh Thuỳ hợp lệ: ${catalog.products.length} sản phẩm, ${catalog.categories.length} danh mục.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
