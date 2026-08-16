import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";
import { afterEach, describe, expect, it } from "vitest";
import { extractSitemapUrls, robotsAllowsProducts } from "@/scripts/thanh-thuy/discover";
import { toSourceProduct } from "@/scripts/thanh-thuy/crawl";
import {
  canReuseExistingMedia,
  processImageBuffer,
  processResponsiveImageBuffers,
  rollbackLatest,
  runImport,
  writeImportArtifacts,
} from "@/scripts/thanh-thuy/import";
import {
  classifyQuality,
  normalizeSourceProduct,
  normalizeSourceProducts,
} from "@/scripts/thanh-thuy/normalize";
import {
  isAllowedMediaUrl,
  isAllowedSourceUrl,
  fetchWithRetry,
  readThroughCache,
  stableChecksum,
  slugifyThanhThuy,
} from "@/scripts/thanh-thuy/lib";
import { validateCatalog } from "@/scripts/thanh-thuy/validate";
import type {
  SourceCategory,
  SourceProduct,
  ThanhThuyProduct,
} from "@/scripts/thanh-thuy/types";

const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

function temporaryDirectory(): string {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "thanh-thuy-pipeline-"));
  temporaryDirectories.push(directory);
  return directory;
}

const category: SourceCategory = {
  id: 21,
  name: "Melamine",
  slug: "melamine",
  parent: null,
  sourceUrl: "https://www.gothanhthuy.com/products/melamine/",
  count: 221,
};

const sourceProduct = (overrides: Partial<SourceProduct> = {}): SourceProduct => ({
  id: 3817,
  slug: "lp-101-104g-white-2",
  link: "https://www.gothanhthuy.com/product/laminate/lp-101-104g-white-2/",
  title: { rendered: "LP 101/104G White" },
  content: {
    rendered:
      "<h2>Thông số kỹ thuật</h2><p>Mã sản phẩm: LP 101/104G. Kích thước 1220 x 2440 x 0.7mm.</p>",
  },
  excerpt: { rendered: "LP 101/104G White." },
  categories: [category.id],
  image: {
    sourceUrl: "https://www.gothanhthuy.com/assets/2025/11/lp-101.webp",
    alt: "LP 101/104G White",
    mimeType: "image/webp",
  },
  ...overrides,
});

describe("Thanh Thuy source boundaries", () => {
  it("accepts only public catalogue paths under /products plus the approved API/sitemap endpoints", () => {
    expect(isAllowedSourceUrl("https://www.gothanhthuy.com/products/melamine/"))
      .toBe(true);
    expect(isAllowedSourceUrl("https://www.gothanhthuy.com/wp-json/wp/v2/product?per_page=100&page=1&_embed=1"))
      .toBe(true);
    expect(isAllowedSourceUrl("https://www.gothanhthuy.com/about/"))
      .toBe(false);
    expect(isAllowedSourceUrl("https://example.com/products/melamine/"))
      .toBe(false);
    expect(isAllowedSourceUrl("https://www.gothanhthuy.com/product/laminate/example/"))
      .toBe(false);
  });

  it("reads only catalogue sitemap URLs and rejects a robots block", () => {
    const xml = `<?xml version="1.0"?><urlset>
      <url><loc>https://www.gothanhthuy.com/products/melamine/</loc></url>
      <url><loc>https://www.gothanhthuy.com/gioi-thieu/</loc></url>
    </urlset>`;
    expect(extractSitemapUrls(xml)).toEqual([
      "https://www.gothanhthuy.com/products/melamine/",
    ]);
    expect(robotsAllowsProducts("User-agent: *\nDisallow: /wp-admin/\n")).toBe(true);
    expect(robotsAllowsProducts("User-agent: *\nDisallow: /products/\n")).toBe(false);
  });

  it("retries transient responses and resumes from a successful cache", async () => {
    const directory = temporaryDirectory();
    const cacheFile = path.join(directory, "page.json");
    let attempts = 0;
    const fetchImpl: typeof fetch = async () => {
      attempts += 1;
      return attempts < 3
        ? new Response("temporary", { status: 503 })
        : new Response("cached body", { status: 200 });
    };

    const response = await fetchWithRetry(
      "https://www.gothanhthuy.com/wp-json/wp/v2/product?per_page=100&page=1&_embed=1",
      { fetchImpl, backoffMs: 0 },
    );
    expect(await response.text()).toBe("cached body");
    expect(attempts).toBe(3);

    await readThroughCache(
      "https://www.gothanhthuy.com/wp-json/wp/v2/product?per_page=100&page=1&_embed=1",
      cacheFile,
      { fetchImpl: async () => new Response("first", { status: 200 }) },
    );
    expect(await readThroughCache("https://www.gothanhthuy.com/wp-json/wp/v2/product", cacheFile, {
      fetchImpl: async () => { throw new Error("cache was not resumed"); },
    })).toBe("first");
  });

  it("maps WordPress records without carrying price or stock fields", () => {
    const source = toSourceProduct({
      id: 9,
      slug: "sample",
      link: "https://www.gothanhthuy.com/product/melamine/sample/",
      title: { rendered: "101 White" },
      content: { rendered: "" },
      excerpt: { rendered: "" },
      product_cat: [21],
      price: "0",
      stock_status: "instock",
      _embedded: {
        "wp:featuredmedia": [{
          source_url: "https://www.gothanhthuy.com/assets/sample.webp",
          alt_text: "101 White",
          mime_type: "image/webp",
        }],
      },
    } as never) as SourceProduct & Record<string, unknown>;

    expect(source.image?.sourceUrl).toBe("https://www.gothanhthuy.com/assets/sample.webp");
    expect(source).not.toHaveProperty("price");
    expect(source).not.toHaveProperty("stock_status");
  });

  it("allows local download only for public supplier media assets", () => {
    expect(
      isAllowedMediaUrl(
        "https://www.gothanhthuy.com/assets/2025/11/lp-101.webp",
      ),
    ).toBe(true);
    expect(
      isAllowedMediaUrl("https://www.gothanhthuy.com/wp-admin/export.zip"),
    ).toBe(false);
    expect(isAllowedMediaUrl("https://cdn.example.com/lp-101.webp")).toBe(
      false,
    );
  });
});

describe("Thanh Thuy normalization", () => {
  it("keeps a reliable supplier code and creates a supplier-namespaced route slug", () => {
    const normalized = normalizeSourceProduct(sourceProduct(), {
      categories: [category],
      importedAt: "2026-08-04T00:00:00.000Z",
      localImage: "/catalog/thanh-thuy/3817-lp-101-104g-white-a1b2c3.webp",
    });

    expect(normalized.code).toBe("LP 101/104G");
    expect(normalized.slug).toBe("thanh-thuy-lp-101-104g-white");
    expect(normalized.sourceName).toBe("Gỗ Thanh Thuỳ");
    expect(normalized.supplier).toBe("Thanh Thuỳ");
    expect(normalized.sourceUrl).toBe(sourceProduct().link);
    expect(normalized.published).toBe(true);
    expect(normalized.seoStatus).toBe("READY_TO_INDEX");
  });

  it("marks records without a reliable code as enrichment work", () => {
    const normalized = normalizeSourceProduct(
      sourceProduct({
        id: 3112,
        slug: "veneer-walnut",
        link: "https://www.gothanhthuy.com/product/veneer/veneer-walnut/",
        title: { rendered: "VENEER WALNUT" },
        content: { rendered: "<p>Veneer walnut.</p>" },
        image: undefined,
      }),
      { categories: [{ ...category, id: 24, name: "Veneer", slug: "veneer" }], importedAt: "2026-08-04T00:00:00.000Z" },
    );

    expect(normalized.code).toBeNull();
    expect(normalized.seoStatus).toBe("MEDIA_MISSING");
    expect(normalized.published).toBe(false);
  });

  it("does not copy source commerce fields into the public contract", () => {
    const normalized = normalizeSourceProduct(sourceProduct(), {
      categories: [category],
      importedAt: "2026-08-04T00:00:00.000Z",
      localImage: "/catalog/thanh-thuy/image.webp",
    }) as ThanhThuyProduct & Record<string, unknown>;

    expect(normalized).not.toHaveProperty("price");
    expect(normalized).not.toHaveProperty("stock");
    expect(normalized).not.toHaveProperty("offers");
  });

  it("decodes WordPress entities in imported image alt text", () => {
    const normalized = normalizeSourceProduct(
      sourceProduct({
        title: { rendered: "AM 204 &#8211; SUGAR GLITTER" },
        image: {
          sourceUrl: "https://www.gothanhthuy.com/assets/am-204.webp",
          alt: "AM 204 &#8211; SUGAR GLITTER",
          mimeType: "image/webp",
        },
      }),
      {
        categories: [category],
        importedAt: "2026-08-04T00:00:00.000Z",
        localImage: {
          src: "/catalog/thanh-thuy/am-204.webp",
          alt: "AM 204 &#8211; SUGAR GLITTER",
          width: 1600,
          height: 800,
          checksum: "abc123",
          variants: [],
        },
      },
    );

    expect(normalized.name).toBe("AM 204 – SUGAR GLITTER");
    expect(normalized.image?.alt).toBe("AM 204 – SUGAR GLITTER");
  });

  it("deduplicates codes and route slugs deterministically without changing source records", () => {
    const products = normalizeSourceProducts(
      [
        sourceProduct(),
        sourceProduct({
          id: 3818,
          slug: "lp-101-104g-white-3",
          link: "https://www.gothanhthuy.com/product/laminate/lp-101-104g-white-3/",
        }),
      ],
      { categories: [category], importedAt: "2026-08-04T00:00:00.000Z", localImageById: new Map() },
    );

    expect(products.map((product) => product.slug)).toEqual([
      "thanh-thuy-lp-101-104g-white",
      "thanh-thuy-lp-101-104g-white-2",
    ]);
    expect(products[1].seoStatus).toBe("DUPLICATE");
    expect(products[1].sourceUrl).not.toBe(products[0].sourceUrl);
  });

  it("is idempotent for the same source snapshot", () => {
    const options = {
      categories: [category],
      importedAt: "2026-08-04T00:00:00.000Z",
      localImage: "/catalog/thanh-thuy/image.webp",
    } as const;
    expect(normalizeSourceProduct(sourceProduct(), options)).toEqual(
      normalizeSourceProduct(sourceProduct(), options),
    );
    expect(stableChecksum(JSON.stringify(sourceProduct()))).toMatch(/^[a-f0-9]{64}$/);
    expect(slugifyThanhThuy("LP 101/104G White")).toBe("lp-101-104g-white");
  });
});

describe("Thanh Thuy quality gate", () => {
  it("returns the exact status enum for invalid, missing-media and enrichment states", () => {
    expect(classifyQuality({ valid: false, hasImage: true, hasCode: true, substantive: true })).toBe("DATA_INVALID");
    expect(classifyQuality({ valid: true, hasImage: false, hasCode: true, substantive: true })).toBe("MEDIA_MISSING");
    expect(classifyQuality({ valid: true, hasImage: true, hasCode: false, substantive: true })).toBe("NEEDS_ENRICHMENT");
    expect(classifyQuality({ valid: true, hasImage: true, hasCode: true, substantive: false })).toBe("NEEDS_ENRICHMENT");
    expect(classifyQuality({ valid: true, hasImage: true, hasCode: true, substantive: true })).toBe("READY_TO_INDEX");
  });
});

describe("Thanh Thuy import safety", () => {
  it("reports a stable no-op when the same source snapshot is imported twice", async () => {
    const root = temporaryDirectory();
    const sourceDirectory = path.join(root, "source");
    fs.mkdirSync(sourceDirectory, { recursive: true });
    fs.writeFileSync(path.join(sourceDirectory, "products-1.json"), JSON.stringify([{
      id: 1,
      slug: "101-white",
      link: "https://www.gothanhthuy.com/product/melamine/101-white/",
      title: { rendered: "101 White" },
      content: { rendered: "<p>Mã sản phẩm: 101. Thông số kỹ thuật mẫu thử.</p>" },
      excerpt: { rendered: "101 White" },
      product_cat: [21],
    }]));
    fs.writeFileSync(path.join(sourceDirectory, "categories.json"), JSON.stringify([{
      id: 21,
      count: 1,
      name: "Melamine",
      slug: "melamine",
      parent: 0,
      link: "https://www.gothanhthuy.com/products/melamine/",
    }]));

    const first = await runImport({ root, sourceDirectory, cacheDirectory: path.join(root, "cache"), now: "2026-08-06T01:00:00.000Z" });
    const second = await runImport({ root, sourceDirectory, cacheDirectory: path.join(root, "cache"), now: "2026-08-06T02:00:00.000Z" });

    expect(first.report.created).toBe(1);
    expect(second.report.created).toBe(0);
    expect(second.report.updated).toBe(0);
    expect(second.report.unchanged).toBe(1);
    expect(second.report.removed).toBe(0);
    expect(second.catalog.checksum).toBe(first.catalog.checksum);
    expect(second.catalog.importedAt).toBe(first.catalog.importedAt);
  });

  it("reuses complete local media variants instead of downloading the source again", () => {
    const root = temporaryDirectory();
    const publicDirectory = path.join(root, "public/catalog/thanh-thuy");
    fs.mkdirSync(publicDirectory, { recursive: true });
    const small = Buffer.from("480");
    const large = Buffer.from("960");
    fs.writeFileSync(path.join(publicDirectory, "sample-480.webp"), small);
    fs.writeFileSync(path.join(publicDirectory, "sample-960.webp"), large);
    const image = {
      src: "/catalog/thanh-thuy/sample-960.webp",
      alt: "Sample",
      width: 960,
      height: 480,
      checksum: stableChecksum(large),
      variants: [
        { src: "/catalog/thanh-thuy/sample-480.webp", width: 480, height: 240, checksum: stableChecksum(small) },
        { src: "/catalog/thanh-thuy/sample-960.webp", width: 960, height: 480, checksum: stableChecksum(large) },
      ],
    };

    expect(canReuseExistingMedia(image, root)).toBe(true);
    fs.writeFileSync(path.join(publicDirectory, "sample-480.webp"), "tampered");
    expect(canReuseExistingMedia(image, root)).toBe(false);
  });

  it("rejects invalid image bytes and produces deterministic local WebP output", async () => {
    await expect(processImageBuffer(Buffer.from("not an image"))).rejects.toThrow();
    const input = await sharp({
      create: { width: 8, height: 4, channels: 3, background: "#d8c6a2" },
    }).png().toBuffer();
    const first = await processImageBuffer(input);
    const second = await processImageBuffer(input);

    expect(first.checksum).toBe(second.checksum);
    expect(first.buffer.equals(second.buffer)).toBe(true);
    expect(first.width).toBe(8);
    expect(first.height).toBe(4);
    expect((await sharp(first.buffer).metadata()).format).toBe("webp");
  });

  it("creates responsive widths without upscaling a small material sample", async () => {
    const large = await sharp({ create: { width: 1800, height: 900, channels: 3, background: "#a88a64" } }).png().toBuffer();
    const variants = await processResponsiveImageBuffers(large);
    expect(variants.map((variant) => variant.width)).toEqual([480, 960, 1600]);

    const small = await sharp({ create: { width: 320, height: 160, channels: 3, background: "#a88a64" } }).png().toBuffer();
    const smallVariants = await processResponsiveImageBuffers(small);
    expect(smallVariants.map((variant) => variant.width)).toEqual([320]);
  });

  it("keeps dry runs read-only and restores the latest timestamped backup", () => {
    const root = temporaryDirectory();
    const catalogFile = path.join(root, "data/catalogs/thanh-thuy/catalog.json");
    const reportFile = path.join(root, "data/imports/thanh-thuy/import-report.json");
    const backupDirectory = path.join(root, ".cache/thanh-thuy/backups");
    const firstCatalog = { schemaVersion: 1, marker: "first" };
    const secondCatalog = { schemaVersion: 1, marker: "second" };

    writeImportArtifacts({ catalog: firstCatalog, report: { dryRun: true }, catalogFile, reportFile, backupDirectory, dryRun: true });
    expect(fs.existsSync(catalogFile)).toBe(false);

    writeImportArtifacts({ catalog: firstCatalog, report: { dryRun: false }, catalogFile, reportFile, backupDirectory, dryRun: false, now: "2026-08-04T01:00:00.000Z" });
    writeImportArtifacts({ catalog: secondCatalog, report: { dryRun: false }, catalogFile, reportFile, backupDirectory, dryRun: false, now: "2026-08-04T02:00:00.000Z" });
    expect(JSON.parse(fs.readFileSync(catalogFile, "utf8"))).toEqual(secondCatalog);

    rollbackLatest({ catalogFile, backupDirectory });
    expect(JSON.parse(fs.readFileSync(catalogFile, "utf8"))).toEqual(firstCatalog);
  });

  it("rejects public hotlinks, fake offers and duplicate route slugs", () => {
    const product = normalizeSourceProduct(sourceProduct(), {
      categories: [category],
      importedAt: "2026-08-04T00:00:00.000Z",
      localImage: "/catalog/thanh-thuy/image.webp",
    });
    const catalog = {
      schemaVersion: 1 as const,
      supplier: "Thanh Thuỳ" as const,
      sourceName: "Gỗ Thanh Thuỳ" as const,
      importedAt: "2026-08-04T00:00:00.000Z",
      checksum: stableChecksum([product.checksum]),
      categories: [],
      products: [product],
    };
    expect(validateCatalog(catalog, { requireMediaFiles: false })).toEqual([]);

    const unsafe = {
      ...catalog,
      products: [
        { ...product, image: { ...product.image!, src: sourceProduct().image!.sourceUrl }, offers: { price: 0 } },
        product,
      ],
    };
    const errors = validateCatalog(unsafe as never, { requireMediaFiles: false });
    expect(errors.some((error) => error.includes("hotlink"))).toBe(true);
    expect(errors.some((error) => error.includes("commerce"))).toBe(true);
    expect(errors.some((error) => error.includes("slug"))).toBe(true);
  });

  it("accepts catalogue media externalized in the R2 manifest", () => {
    const root = temporaryDirectory();
    const localImage = "/catalog/thanh-thuy/image.webp";
    const product = normalizeSourceProduct(sourceProduct(), {
      categories: [category],
      importedAt: "2026-08-04T00:00:00.000Z",
      localImage,
    });
    const catalog = {
      schemaVersion: 1 as const,
      supplier: "Thanh Thuỳ" as const,
      sourceName: "Gỗ Thanh Thuỳ" as const,
      importedAt: "2026-08-04T00:00:00.000Z",
      checksum: stableChecksum([product.checksum]),
      categories: [],
      products: [product],
    };
    fs.mkdirSync(path.join(root, "data"), { recursive: true });
    fs.writeFileSync(path.join(root, "data/catalog-media-manifest.json"), JSON.stringify({
      entries: [{ logicalPath: localImage.replace(/^\//, "") }],
      aliases: {},
    }));

    expect(validateCatalog(catalog, { root })).toEqual([]);
  });
});
