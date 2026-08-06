import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { absoluteUrl } from "@/lib/seo";
import type { SupplierId } from "@/lib/catalog/core/types";
import {
  anCuongAdapter,
  baThanhAdapter,
  thanhThuyAdapter,
} from "@/lib/catalog/suppliers";

type SupplierPage = {
  route: string;
  supplierId: SupplierId;
  indexable: boolean;
  html: string;
};

type PageMetadata = {
  title: string;
  description: string;
  canonical: string;
  robots: string;
  h1: string;
  jsonLd: unknown[];
  invalidJsonLd: number;
};

const expectedBrands: Record<SupplierId, string> = {
  "thanh-thuy": "Thanh Thuỳ",
  "ba-thanh": "Ba Thanh",
  "an-cuong": "An Cường",
};

function decodeHtml(value: string): string {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function textContent(value: string): string {
  return decodeHtml(value.replace(/<[^>]+>/g, " "));
}

function attribute(tag: string, name: string): string {
  const match = tag.match(
    new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"),
  );
  return decodeHtml(match?.[1] ?? match?.[2] ?? match?.[3] ?? "");
}

function metadataFromHtml(html: string): PageMetadata {
  const title = textContent(
    html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "",
  );
  const h1 = textContent(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? "");
  const tags = [...html.matchAll(/<(?:meta|link)\b[^>]*>/gi)].map(
    (match) => match[0],
  );
  const descriptionTag =
    tags.find(
      (tag) => attribute(tag, "name").toLowerCase() === "description",
    ) ?? "";
  const robotsTag =
    tags.find((tag) => attribute(tag, "name").toLowerCase() === "robots") ?? "";
  const canonicalTag =
    tags.find((tag) => attribute(tag, "rel").toLowerCase() === "canonical") ??
    "";
  const jsonLd: unknown[] = [];
  let invalidJsonLd = 0;
  for (const match of html.matchAll(
    /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  )) {
    try {
      jsonLd.push(JSON.parse(match[1]));
    } catch {
      invalidJsonLd += 1;
    }
  }
  return {
    title,
    description: attribute(descriptionTag, "content"),
    canonical: attribute(canonicalTag, "href"),
    robots: attribute(robotsTag, "content").toLowerCase(),
    h1,
    jsonLd,
    invalidJsonLd,
  };
}

function collectBrandNames(value: unknown, results: string[] = []): string[] {
  if (Array.isArray(value)) {
    for (const item of value) collectBrandNames(item, results);
    return results;
  }
  if (!value || typeof value !== "object") return results;
  const record = value as Record<string, unknown>;
  const brand = record.brand;
  if (brand && typeof brand === "object") {
    const name = (brand as { name?: unknown }).name;
    if (typeof name === "string") results.push(name);
  }
  if (record["@type"] === "Brand" && typeof record.name === "string") {
    results.push(record.name);
  }
  for (const child of Object.values(record)) collectBrandNames(child, results);
  return results;
}

function duplicates(values: Array<{ value: string; route: string }>) {
  const routesByValue = new Map<string, string[]>();
  for (const entry of values) {
    if (!entry.value) continue;
    const routes = routesByValue.get(entry.value) ?? [];
    routes.push(entry.route);
    routesByValue.set(entry.value, routes);
  }
  return [...routesByValue.entries()].filter(([, routes]) => routes.length > 1);
}

function canonicalPath(value: string): string {
  const pathname = new URL(value, "https://mdftungphat.com").pathname;
  return pathname === "/" ? pathname : `${pathname.replace(/\/+$/, "")}/`;
}

export function auditSupplierPages(
  pages: SupplierPage[],
  sitemapPaths: string[],
) {
  const errors: string[] = [];
  const sitemap = new Set(sitemapPaths.map(canonicalPath));
  const pageRoutes = new Set(pages.map((page) => canonicalPath(page.route)));
  const parsed = pages.map((page) => ({
    ...page,
    metadata: metadataFromHtml(page.html),
  }));
  let invalidJsonLd = 0;
  let brandMismatches = 0;
  let orphanIndexablePages = 0;

  for (const page of parsed) {
    const route = canonicalPath(page.route);
    const expectedCanonical = absoluteUrl(route);
    const metadata = page.metadata;
    if (!page.html) errors.push(`${route}: missing HTML output`);
    if (!metadata.title) errors.push(`${route}: missing title`);
    if (!metadata.description) errors.push(`${route}: missing description`);
    if (!metadata.h1) errors.push(`${route}: missing H1`);
    if (metadata.canonical !== expectedCanonical) {
      errors.push(
        `${route}: canonical mismatch (${metadata.canonical || "missing"})`,
      );
    }
    if (/\|\s*Tùng Phát\s*\|\s*Tùng Phát/i.test(metadata.title)) {
      errors.push(`${route}: duplicate terminal title suffix`);
    }
    if (route === "/catalogue/an-cuong/") {
      if (metadata.title !== "Catalogue An Cường | Tùng Phát") {
        errors.push(
          `${route}: required title is "Catalogue An Cường | Tùng Phát"`,
        );
      }
      if (metadata.h1 !== "Catalogue An Cường") {
        errors.push(`${route}: required H1 is "Catalogue An Cường"`);
      }
    }
    const isNoindex = /(?:^|[,\s])noindex(?:[,\s]|$)/i.test(metadata.robots);
    if (page.indexable && isNoindex)
      errors.push(`${route}: indexable route is noindex`);
    if (!page.indexable && !isNoindex)
      errors.push(`${route}: noindex route is indexable`);
    if (page.indexable && !sitemap.has(route)) {
      orphanIndexablePages += 1;
      errors.push(`${route}: indexable page is absent from supplier sitemap`);
    }
    if (!page.indexable && sitemap.has(route)) {
      errors.push(`${route}: noindex page appears in supplier sitemap`);
    }
    invalidJsonLd += metadata.invalidJsonLd;
    if (metadata.invalidJsonLd) errors.push(`${route}: invalid JSON-LD`);
    const wrongBrands = collectBrandNames(metadata.jsonLd).filter(
      (name) => name !== expectedBrands[page.supplierId],
    );
    if (wrongBrands.length) {
      brandMismatches += wrongBrands.length;
      errors.push(
        `${route}: brand mismatch (${[...new Set(wrongBrands)].join(", ")})`,
      );
    }
  }

  const duplicateIndexableTitles = duplicates(
    parsed
      .filter((page) => page.indexable)
      .map((page) => ({ value: page.metadata.title, route: page.route })),
  );
  const duplicateIndexableDescriptions = duplicates(
    parsed
      .filter((page) => page.indexable)
      .map((page) => ({ value: page.metadata.description, route: page.route })),
  );
  const duplicateNoindexTitles = duplicates(
    parsed
      .filter((page) => !page.indexable)
      .map((page) => ({ value: page.metadata.title, route: page.route })),
  );
  const duplicateNoindexDescriptions = duplicates(
    parsed
      .filter((page) => !page.indexable)
      .map((page) => ({ value: page.metadata.description, route: page.route })),
  );

  for (const [title, routes] of duplicateIndexableTitles) {
    errors.push(`Duplicate title "${title}": ${routes.join(", ")}`);
  }
  for (const [description, routes] of duplicateIndexableDescriptions) {
    errors.push(`Duplicate description "${description}": ${routes.join(", ")}`);
  }
  for (const sitemapPath of sitemap) {
    if (!pageRoutes.has(sitemapPath)) {
      errors.push(`${sitemapPath}: sitemap URL has no matching page`);
    }
  }

  return {
    errors,
    findings: {
      duplicateIndexableTitles: duplicateIndexableTitles.map(
        ([value, routes]) => ({ value, routes }),
      ),
      duplicateIndexableDescriptions: duplicateIndexableDescriptions.map(
        ([value, routes]) => ({ value, routes }),
      ),
      duplicateNoindexTitles: duplicateNoindexTitles.map(([value, routes]) => ({
        value,
        routes,
      })),
      duplicateNoindexDescriptions: duplicateNoindexDescriptions.map(
        ([value, routes]) => ({ value, routes }),
      ),
    },
    summary: {
      pages: pages.length,
      indexable: pages.filter((page) => page.indexable).length,
      noindex: pages.filter((page) => !page.indexable).length,
      uniqueTitles: new Set(
        parsed.map((page) => page.metadata.title).filter(Boolean),
      ).size,
      uniqueDescriptions: new Set(
        parsed.map((page) => page.metadata.description).filter(Boolean),
      ).size,
      canonicalsChecked: parsed.filter((page) => page.metadata.canonical)
        .length,
      invalidJsonLd,
      brandMismatches,
      orphanIndexablePages,
    },
  };
}

function outputPathFor(route: string): string {
  const relative = canonicalPath(route).replace(/^\/+|\/+$/g, "");
  return relative
    ? path.join("out", relative, "index.html")
    : path.join("out", "index.html");
}

async function main() {
  const adapters = [thanhThuyAdapter, baThanhAdapter, anCuongAdapter];
  const claims = adapters.flatMap((adapter) => adapter.getRouteClaims());
  const uniqueClaims = [
    ...new Map(
      claims.map((claim) => [canonicalPath(claim.path), claim]),
    ).values(),
  ];
  const pages = uniqueClaims.map((claim) => {
    const file = outputPathFor(claim.path);
    return {
      route: claim.path,
      supplierId: claim.supplierId,
      indexable: claim.indexable,
      html: fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "",
    };
  });
  const sitemapXml = fs.readFileSync(path.join("out", "sitemap.xml"), "utf8");
  const sitemapPaths = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((match) => new URL(match[1]).pathname)
    .filter((pathname) =>
      uniqueClaims.some(
        (claim) => canonicalPath(claim.path) === canonicalPath(pathname),
      ),
    );
  const result = auditSupplierPages(pages, sitemapPaths);
  fs.mkdirSync(path.join("data", "imports", "suppliers"), { recursive: true });
  fs.writeFileSync(
    path.join("data", "imports", "suppliers", "output-audit.json"),
    `${JSON.stringify(result, null, 2)}\n`,
  );
  if (result.errors.length) {
    throw new Error(
      `Supplier output audit failed with ${result.errors.length} error(s)`,
    );
  }
  console.log(JSON.stringify(result.summary, null, 2));
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
