import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import sharp from "sharp";
import { crawlSource } from "./crawl";
import {
  fetchWithRetry,
  parseCliArgs,
  slugifyThanhThuy,
  stableChecksum,
  writeJsonAtomic,
} from "./lib";
import { normalizeSourceProducts } from "./normalize";
import type {
  ImportReport,
  SourceCategory,
  SourceProduct,
  ThanhThuyCatalog,
  ThanhThuyCategory,
  ThanhThuyImage,
  ThanhThuyProduct,
  ThanhThuySeoStatus,
} from "./types";
import { validateCatalog } from "./validate";

type ProcessedImage = {
  buffer: Buffer;
  width: number;
  height: number;
  checksum: string;
};

export async function processResponsiveImageBuffers(input: Buffer): Promise<ProcessedImage[]> {
  const metadata = await sharp(input, { failOn: "error", limitInputPixels: 80_000_000 }).metadata();
  if (!metadata.width || !metadata.height || !metadata.format || !["avif", "jpeg", "png", "webp"].includes(metadata.format)) {
    throw new Error(`Định dạng ảnh không được hỗ trợ: ${metadata.format ?? "unknown"}`);
  }
  const maximumWidth = Math.min(metadata.width, 1600);
  const widths = [480, 960, 1600].filter((width) => width <= maximumWidth);
  if (!widths.includes(maximumWidth)) widths.push(maximumWidth);
  return Promise.all([...new Set(widths)].sort((left, right) => left - right).map(async (width) => {
    const buffer = await sharp(input, { failOn: "error", limitInputPixels: 80_000_000 })
      .resize({ width, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 90, effort: 5, smartSubsample: false })
      .toBuffer();
    const output = await sharp(buffer).metadata();
    return { buffer, width: output.width ?? width, height: output.height ?? metadata.height, checksum: stableChecksum(buffer) };
  }));
}

export async function processImageBuffer(input: Buffer): Promise<ProcessedImage> {
  const variants = await processResponsiveImageBuffers(input);
  return variants[variants.length - 1];
}

function timestampName(value: string): string {
  return value.replace(/[:.]/g, "-");
}

export function writeImportArtifacts(options: {
  catalog: unknown;
  report: unknown;
  catalogFile: string;
  reportFile: string;
  backupDirectory: string;
  dryRun: boolean;
  now?: string;
  createdMedia?: string[];
}): { backup: string | null } {
  if (options.dryRun) return { backup: null };
  const now = options.now ?? new Date().toISOString();
  fs.mkdirSync(options.backupDirectory, { recursive: true });
  let backup: string | null = null;
  if (fs.existsSync(options.catalogFile)) {
    backup = path.join(options.backupDirectory, `${timestampName(now)}-catalog.json`);
    fs.copyFileSync(options.catalogFile, backup);
    writeJsonAtomic(`${backup}.rollback.json`, {
      catalogFile: path.resolve(options.catalogFile),
      createdMedia: (options.createdMedia ?? []).map((file) => path.resolve(file)),
    });
  }
  writeJsonAtomic(options.catalogFile, options.catalog);
  writeJsonAtomic(options.reportFile, options.report);
  return { backup };
}

export function rollbackLatest(options: { catalogFile: string; backupDirectory: string }): string {
  if (!fs.existsSync(options.backupDirectory)) throw new Error("Không có thư mục backup Thanh Thuỳ.");
  const backups = fs.readdirSync(options.backupDirectory)
    .filter((file) => file.endsWith("-catalog.json"))
    .sort();
  const latest = backups.at(-1);
  if (!latest) throw new Error("Không có backup Thanh Thuỳ để rollback.");
  const backup = path.join(options.backupDirectory, latest);
  const metadataFile = `${backup}.rollback.json`;
  if (fs.existsSync(metadataFile)) {
    const metadata = JSON.parse(fs.readFileSync(metadataFile, "utf8")) as { createdMedia?: string[] };
    for (const file of metadata.createdMedia ?? []) {
      if (path.resolve(file).includes(`${path.sep}public${path.sep}catalog${path.sep}thanh-thuy${path.sep}`)) {
        fs.rmSync(file, { force: true });
      }
    }
  }
  fs.mkdirSync(path.dirname(options.catalogFile), { recursive: true });
  fs.copyFileSync(backup, options.catalogFile);
  return backup;
}

function normalizedCategories(source: SourceCategory[]): ThanhThuyCategory[] {
  const byId = new Map(source.map((category) => [category.id, category]));
  return [...source]
    .sort((a, b) => a.id - b.id)
    .map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      parentId: category.parent,
      parentSlug: category.parent ? byId.get(category.parent)?.slug ?? null : null,
      sourceUrl: category.sourceUrl,
      productCount: category.count,
    }));
}

function catalogPayloadChecksum(categories: ThanhThuyCategory[], products: ThanhThuyProduct[]): string {
  return stableChecksum({
    categories,
    products: products.map((product) => {
      const stableProduct = { ...product } as Partial<ThanhThuyProduct>;
      delete stableProduct.importedAt;
      return stableProduct;
    }),
  });
}

function statusCounts(products: ThanhThuyProduct[]): Record<ThanhThuySeoStatus, number> {
  const counts: Record<ThanhThuySeoStatus, number> = {
    READY_TO_INDEX: 0,
    NEEDS_ENRICHMENT: 0,
    MEDIA_MISSING: 0,
    DATA_INVALID: 0,
    DUPLICATE: 0,
    SOURCE_UNAVAILABLE: 0,
  };
  for (const product of products) counts[product.seoStatus] += 1;
  return counts;
}

async function mapConcurrent<T, R>(items: T[], concurrency: number, operation: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await operation(items[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  return results;
}

async function loadMedia(
  products: SourceProduct[],
  options: { root: string; cacheDirectory: string; dryRun: boolean; resume: boolean },
): Promise<{ byId: Map<number, ThanhThuyImage>; createdMedia: string[]; uniqueSourceImages: number }> {
  const references = new Map<string, SourceProduct[]>();
  for (const product of products) {
    if (!product.image?.sourceUrl) continue;
    const list = references.get(product.image.sourceUrl) ?? [];
    list.push(product);
    references.set(product.image.sourceUrl, list);
  }
  const publicDirectory = path.join(options.root, "public/catalog/thanh-thuy");
  const rawDirectory = path.join(options.cacheDirectory, "media/raw");
  const processedDirectory = path.join(options.cacheDirectory, "media/processed");
  fs.mkdirSync(rawDirectory, { recursive: true });
  fs.mkdirSync(processedDirectory, { recursive: true });
  const sourceEntries = [...references.entries()].sort(([left], [right]) => left.localeCompare(right));
  const processed = await mapConcurrent(sourceEntries, 3, async ([sourceUrl, linkedProducts]) => {
    const rawFile = path.join(rawDirectory, `${stableChecksum(sourceUrl)}.bin`);
    let input: Buffer;
    if (options.resume && fs.existsSync(rawFile)) input = fs.readFileSync(rawFile);
    else {
      const response = await fetchWithRetry(sourceUrl, { allowMedia: true });
      input = Buffer.from(await response.arrayBuffer());
      const contentType = response.headers.get("content-type") ?? "";
      if (!contentType.startsWith("image/")) throw new Error(`MIME ảnh không hợp lệ tại ${sourceUrl}: ${contentType}`);
      fs.writeFileSync(rawFile, input);
    }
    const variants = await processResponsiveImageBuffers(input);
    const image = variants[variants.length - 1];
    const processedFiles = variants.map((variant) => {
      const file = path.join(processedDirectory, `${variant.checksum}.webp`);
      if (!fs.existsSync(file)) fs.writeFileSync(file, variant.buffer);
      return file;
    });
    return { sourceUrl, linkedProducts, image, variants, processedFiles };
  });

  const byChecksum = new Map<string, { src: string; width: number; height: number; variants: Array<{ src: string; absolute: string; width: number; height: number; checksum: string }> }>();
  const byId = new Map<number, ThanhThuyImage>();
  const createdMedia: string[] = [];
  for (const item of processed) {
    let local = byChecksum.get(item.image.checksum);
    if (!local) {
      const representative = [...item.linkedProducts].sort((a, b) => a.id - b.id)[0];
      const name = slugifyThanhThuy(representative.title.rendered || representative.slug).slice(0, 80) || `source-${representative.id}`;
      const variants = item.variants.map((variant, index) => {
        const filename = `${name}-${variant.width}w-${variant.checksum.slice(0, 12)}.webp`;
        return { src: `/catalog/thanh-thuy/${filename}`, absolute: path.join(publicDirectory, filename), width: variant.width, height: variant.height, checksum: variant.checksum, processedFile: item.processedFiles[index] };
      });
      const primary = variants[variants.length - 1];
      local = {
        src: primary.src,
        width: primary.width,
        height: primary.height,
        variants: variants.map((variant) => ({ src: variant.src, absolute: variant.absolute, width: variant.width, height: variant.height, checksum: variant.checksum })),
      };
      byChecksum.set(item.image.checksum, local);
      if (!options.dryRun) {
        fs.mkdirSync(publicDirectory, { recursive: true });
        for (const variant of variants) {
          if (fs.existsSync(variant.absolute)) continue;
          fs.copyFileSync(variant.processedFile, variant.absolute);
          createdMedia.push(variant.absolute);
        }
      }
    }
    for (const product of item.linkedProducts) {
      byId.set(product.id, {
        src: local.src,
        alt: product.image?.alt || product.title.rendered,
        width: local.width,
        height: local.height,
        checksum: item.image.checksum,
        variants: local.variants.map((variant) => ({ src: variant.src, width: variant.width, height: variant.height, checksum: variant.checksum })),
      });
    }
  }
  return { byId, createdMedia, uniqueSourceImages: references.size };
}

function readExistingCatalog(file: string): ThanhThuyCatalog | null {
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) as ThanhThuyCatalog : null;
}

export function assertCompleteSourceSnapshot(
  existing: ThanhThuyCatalog | null,
  sourceProducts: SourceProduct[],
): void {
  if (!existing?.products.length) return;
  const sourceIds = new Set(sourceProducts.map((product) => product.id));
  const missing = existing.products
    .map((product) => product.sourceId)
    .filter((sourceId) => !sourceIds.has(sourceId));
  if (missing.length) {
    throw new Error(
      `Crawl nguồn thiếu ${missing.length} sản phẩm hiện có (sourceId ${missing.slice(0, 10).join(", ")}); giữ nguyên catalogue hiện tại.`,
    );
  }
}

export async function runImport(options: {
  root?: string;
  sourceDirectory?: string;
  cacheDirectory?: string;
  dryRun?: boolean;
  resume?: boolean;
  now?: string;
} = {}): Promise<{ catalog: ThanhThuyCatalog; report: ImportReport }> {
  const root = options.root ?? process.cwd();
  const cacheDirectory = options.cacheDirectory ?? path.join(root, ".cache/thanh-thuy");
  const dryRun = options.dryRun ?? false;
  const resume = options.resume ?? true;
  const now = options.now ?? new Date().toISOString();
  const catalogFile = path.join(root, "data/catalogs/thanh-thuy/catalog.json");
  const reportFile = path.join(root, "data/imports/thanh-thuy/import-report.json");
  const backupDirectory = path.join(cacheDirectory, "backups");
  const source = await crawlSource({ root, sourceDirectory: options.sourceDirectory, cacheDirectory: path.join(cacheDirectory, "raw"), resume });
  if (source.products.length < 1 || source.categories.length < 1) throw new Error("Crawl không đầy đủ; giữ nguyên catalogue hiện tại.");
  const existing = readExistingCatalog(catalogFile);
  assertCompleteSourceSnapshot(existing, source.products);
  const media = await loadMedia(source.products, { root, cacheDirectory, dryRun, resume });
  const normalized = normalizeSourceProducts(source.products, { categories: source.categories, importedAt: now, localImageById: media.byId });
  const previousById = new Map(existing?.products.map((product) => [product.id, product]) ?? []);
  let created = 0;
  let updated = 0;
  let unchanged = 0;
  const products = normalized.map((product) => {
    const previous = previousById.get(product.id);
    if (!previous) {
      created += 1;
      return product;
    }
    if (previous.checksum === product.checksum && previous.image?.checksum === product.image?.checksum && previous.slug === product.slug) {
      unchanged += 1;
      return {
        ...product,
        description: previous.description,
        applications: previous.applications,
        importedAt: previous.importedAt,
      };
    }
    updated += 1;
    return {
      ...product,
      description: previous.description || product.description,
      applications: previous.applications.length ? previous.applications : product.applications,
    };
  });
  const categories = normalizedCategories(source.categories);
  const checksum = catalogPayloadChecksum(categories, products);
  const catalog: ThanhThuyCatalog = {
    schemaVersion: 1,
    supplier: "Thanh Thuỳ",
    sourceName: "Gỗ Thanh Thuỳ",
    importedAt: existing?.checksum === checksum ? existing.importedAt : now,
    checksum,
    categories,
    products,
  };
  const errors = validateCatalog(catalog, { root, requireMediaFiles: !dryRun });
  if (errors.length) throw new Error(`Catalogue Thanh Thuỳ không hợp lệ:\n- ${errors.join("\n- ")}`);
  const report: ImportReport = {
    schemaVersion: 1,
    importedAt: now,
    dryRun,
    sourceProducts: source.products.length,
    catalogProducts: products.length,
    categories: categories.length,
    uniqueSourceImages: media.uniqueSourceImages,
    localImages: new Set(products.map((product) => product.image?.src).filter(Boolean)).size,
    created,
    updated,
    unchanged,
    statuses: statusCounts(products),
    catalogChecksum: checksum,
    backup: null,
  };
  const written = writeImportArtifacts({
    catalog,
    report,
    catalogFile,
    reportFile,
    backupDirectory,
    dryRun,
    now,
    createdMedia: media.createdMedia,
  });
  report.backup = written.backup ? path.relative(root, written.backup) : null;
  if (!dryRun) writeJsonAtomic(reportFile, report);
  return { catalog, report };
}

async function main() {
  const args = parseCliArgs();
  const root = process.cwd();
  const cacheDirectory = typeof args.get("cache-dir") === "string"
    ? path.resolve(String(args.get("cache-dir")))
    : path.join(root, ".cache/thanh-thuy");
  if (args.get("rollback") === "latest") {
    const restored = rollbackLatest({
      catalogFile: path.join(root, "data/catalogs/thanh-thuy/catalog.json"),
      backupDirectory: path.join(cacheDirectory, "backups"),
    });
    console.log(`Đã rollback catalogue từ ${restored}.`);
    return;
  }
  const result = await runImport({
    root,
    cacheDirectory,
    sourceDirectory: typeof args.get("source-dir") === "string" ? path.resolve(String(args.get("source-dir"))) : undefined,
    dryRun: args.has("dry-run"),
    resume: !args.has("refresh"),
  });
  console.log(JSON.stringify(result.report, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
