import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { collectPaginatedRecords } from "../../lib/catalog/full-import/pagination";
import { THANH_THUY_ORIGIN, isAllowedSourceUrl, parseCliArgs, readThroughCache, writeJsonAtomic } from "./lib";
import type { SourceCategory, SourceProduct, WordPressCategory, WordPressProduct } from "./types";

export function toSourceProduct(product: WordPressProduct): SourceProduct {
  const featured = product._embedded?.["wp:featuredmedia"]?.[0];
  return {
    id: product.id,
    slug: product.slug,
    link: product.link,
    title: { rendered: product.title?.rendered ?? "" },
    content: { rendered: product.content?.rendered ?? "" },
    excerpt: { rendered: product.excerpt?.rendered ?? "" },
    categories: product.product_cat ?? [],
    image: featured?.source_url ? {
      sourceUrl: featured.source_url,
      alt: featured.alt_text ?? "",
      mimeType: featured.mime_type ?? "",
    } : undefined,
    modified: product.modified,
  };
}

export function toSourceCategory(category: WordPressCategory): SourceCategory {
  if (!isAllowedSourceUrl(category.link) || !new URL(category.link).pathname.startsWith("/products/")) {
    throw new Error(`Danh mục ngoài /products/: ${category.link}`);
  }
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    parent: category.parent || null,
    sourceUrl: category.link,
    count: category.count,
  };
}

function readRawPage(sourceDirectory: string, page: number): WordPressProduct[] | null {
  const candidates = [
    path.join(sourceDirectory, `products-${page}.json`),
    path.join(sourceDirectory, `products/page-${page}.json`),
  ];
  const file = candidates.find((candidate) => fs.existsSync(candidate));
  return file ? JSON.parse(fs.readFileSync(file, "utf8")) as WordPressProduct[] : null;
}

export async function collectWordPressProducts(
  loadPage: (input: { page: number; pageSize: number }) => Promise<WordPressProduct[]>,
) {
  return collectPaginatedRecords(
    async (input) => ({ records: await loadPage(input) }),
    { pageSize: 100 },
  );
}

export async function crawlSource(options: {
  root?: string;
  sourceDirectory?: string;
  cacheDirectory?: string;
  resume?: boolean;
} = {}): Promise<{ products: SourceProduct[]; categories: SourceCategory[] }> {
  const root = options.root ?? process.cwd();
  const sourceDirectory = options.sourceDirectory;
  const cacheDirectory = options.cacheDirectory ?? path.join(root, ".cache/thanh-thuy/raw");
  const resume = options.resume ?? true;
  const paginated = await collectWordPressProducts(async ({ page, pageSize }) => {
    const records = sourceDirectory ? readRawPage(sourceDirectory, page) : null;
    if (records) return records;
    const url = `${THANH_THUY_ORIGIN}/wp-json/wp/v2/product?per_page=${pageSize}&page=${page}&_embed=1`;
    const body = await readThroughCache(url, path.join(cacheDirectory, `products-${page}.json`), { resume });
    return JSON.parse(body) as WordPressProduct[];
  });
  const rawProducts = paginated.records;
  const categoryFile = sourceDirectory ? path.join(sourceDirectory, "categories.json") : path.join(cacheDirectory, "categories.json");
  let rawCategories: WordPressCategory[];
  if (sourceDirectory && fs.existsSync(categoryFile)) {
    rawCategories = JSON.parse(fs.readFileSync(categoryFile, "utf8")) as WordPressCategory[];
  } else {
    const url = `${THANH_THUY_ORIGIN}/wp-json/wp/v2/product_cat?per_page=100&page=1`;
    rawCategories = JSON.parse(await readThroughCache(url, categoryFile, { resume })) as WordPressCategory[];
  }
  const products = rawProducts.map(toSourceProduct);
  const categories = rawCategories.filter((category) => category.count > 0).map(toSourceCategory);
  writeJsonAtomic(path.join(cacheDirectory, "source-products.json"), products);
  writeJsonAtomic(path.join(cacheDirectory, "source-categories.json"), categories);
  return { products, categories };
}

async function main() {
  const args = parseCliArgs();
  const result = await crawlSource({
    sourceDirectory: typeof args.get("source-dir") === "string" ? path.resolve(String(args.get("source-dir"))) : undefined,
    cacheDirectory: typeof args.get("cache-dir") === "string" ? path.resolve(String(args.get("cache-dir"))) : undefined,
    resume: !args.has("refresh"),
  });
  console.log(`Thanh Thuỳ: đã cache ${result.products.length} sản phẩm và ${result.categories.length} danh mục.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
