import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import type { SupplierColorCode } from "@/lib/catalog/types";
import { CATALOG_PATH, IMPORT_DIR } from "./config";

export async function validateBaThanhCatalog() {
  const records = JSON.parse(await fs.readFile(CATALOG_PATH, "utf8")) as SupplierColorCode[];
  const errors: string[] = [];
  const warnings: string[] = [];
  const seenCodes = new Set<string>();
  const seenSlugs = new Set<string>();
  const seenUrls = new Set<string>();
  const seenImages = new Set<string>();
  for (const record of records) {
    if (!record.codeNormalized) errors.push(`${record.id}: missing code`);
    if (seenCodes.has(`${record.supplier}:${record.codeNormalized}`)) errors.push(`${record.id}: duplicate code`);
    seenCodes.add(`${record.supplier}:${record.codeNormalized}`);
    if (seenSlugs.has(record.slug)) errors.push(`${record.id}: duplicate slug`);
    seenSlugs.add(record.slug);
    if (seenUrls.has(record.sourceUrl)) errors.push(`${record.id}: duplicate source URL`);
    seenUrls.add(record.sourceUrl);
    if (!record.category) errors.push(`${record.id}: missing category`);
    if (!record.sourceIndexUrl || !record.sourceChecksum) errors.push(`${record.id}: missing provenance`);
    if (record.seoStatus === "READY_TO_INDEX" && !record.published) errors.push(`${record.id}: ready record is unpublished`);
    if (record.seoStatus === "READY_TO_INDEX" && !record.editorialDescription) errors.push(`${record.id}: ready record is thin`);
    if (record.seoStatus === "READY_TO_INDEX" && !record.images.length) errors.push(`${record.id}: ready record has no media`);
    for (const image of record.images) {
      if (!image.alt) errors.push(`${record.id}: missing alt`);
      if (image.checksum && seenImages.has(image.checksum)) warnings.push(`${record.id}: duplicate image ${image.checksum}`);
      if (image.checksum) seenImages.add(image.checksum);
      if (!image.localPath?.startsWith("/catalog/ba-thanh/")) {
        errors.push(`${record.id}: non-local media path`);
        continue;
      }
      try {
        const file = path.join(process.cwd(), "public", image.localPath.replace(/^\//, ""));
        const metadata = await sharp(file).metadata();
        if (!metadata.width || !metadata.height) errors.push(`${record.id}: broken image ${image.localPath}`);
        if (image.thumbnailSrc) {
          const thumbnail = path.join(process.cwd(), "public", image.thumbnailSrc.replace(/^\//, ""));
          const thumbnailMetadata = await sharp(thumbnail).metadata();
          if (!thumbnailMetadata.width || !thumbnailMetadata.height) errors.push(`${record.id}: broken thumbnail ${image.thumbnailSrc}`);
          if (thumbnailMetadata.width > 480) errors.push(`${record.id}: oversized thumbnail ${image.thumbnailSrc}`);
        }
      } catch {
        errors.push(`${record.id}: missing/broken image ${image.localPath}`);
      }
    }
  }
  const report = {
    validatedAt: new Date().toISOString(),
    total: records.length,
    readyToIndex: records.filter((record) => record.seoStatus === "READY_TO_INDEX").length,
    noindex: records.filter((record) => record.seoStatus !== "READY_TO_INDEX").length,
    errors,
    warnings,
    pass: errors.length === 0,
  };
  await fs.writeFile(path.join(IMPORT_DIR, "validation-report.json"), `${JSON.stringify(report, null, 2)}\n`);
  if (errors.length) throw new Error(`Ba Thanh validation failed with ${errors.length} error(s)`);
  return report;
}

if (process.argv[1]?.endsWith("validate.ts")) {
  validateBaThanhCatalog().then((report) => console.log(JSON.stringify(report, null, 2))).catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
