import type {
  AccountedSourceRecord,
  FullSourceManifest,
  SourceOutcome,
  SupplierDocumentRecord,
  SupplierFamilyRecord,
  SupplierSkuRecord,
} from "../../lib/catalog/full-import/types";
import { checksumFullSourceManifest } from "../../lib/catalog/full-import/manifest";
import { validateFullSourceManifest } from "../../lib/catalog/full-import/manifest";
import type { AnCuongProduct, DiscoveryManifest } from "./types";
import type { NonNumericProductAudit } from "./crawl-non-numeric";
import type { RejectedProductDetail } from "./normalize";
import type { CliOptions } from "./types";
import { paths } from "./config";
import { atomicWriteJson, readJsonIfExists } from "./stable-json";
import { join, resolve } from "node:path";

type ManifestInput = {
  discovery: DiscoveryManifest;
  products: Array<Pick<AnCuongProduct, "sourceUrl" | "sourceId" | "normalizedProductCode">>;
  relationOnlyProducts: SupplierSkuRecord[];
  families: SupplierFamilyRecord[];
  documents: SupplierDocumentRecord[];
  rejections: RejectedProductDetail[];
  nonNumericAudit: NonNumericProductAudit;
  generatedAt: string;
};

const outcomePriority: Record<SourceOutcome, number> = {
  imported: 7,
  removed: 6,
  invalid: 5,
  blocked: 4,
  duplicate: 3,
  redirected: 2,
  "non-product": 1,
};

function normalizedUrl(value: string): string {
  return new URL(value).toString();
}

function skuRecordId(product: { sourceId?: string; normalizedProductCode?: string; sourceProductId?: string; slug?: string }): string {
  return `an-cuong:sku:${product.sourceId || product.sourceProductId || product.slug || product.normalizedProductCode}`;
}

export function buildAnCuongFullSourceManifest(input: ManifestInput): FullSourceManifest {
  const records = new Map<string, AccountedSourceRecord>();
  const add = (record: AccountedSourceRecord) => {
    const url = normalizedUrl(record.url);
    const next = { ...record, url, recordIds: record.recordIds ? [...new Set(record.recordIds)].sort() : undefined };
    const previous = records.get(url);
    if (!previous) {
      records.set(url, next);
      return;
    }
    const preferred = !previous.outcome || next.outcome && outcomePriority[next.outcome] > outcomePriority[previous.outcome]
      ? next
      : previous;
    records.set(url, {
      ...preferred,
      recordIds: [...new Set([...(previous.recordIds ?? []), ...(next.recordIds ?? [])])].sort(),
    });
  };

  const productsById = new Map(input.products.filter((product) => product.sourceId).map((product) => [product.sourceId!, product]));
  const productsByUrl = new Map(input.products.map((product) => [normalizedUrl(product.sourceUrl), product]));
  const rejectedById = new Map(input.rejections.filter((rejection) => rejection.sourceId).map((rejection) => [rejection.sourceId!, rejection]));
  const relationOnlyById = new Map(input.relationOnlyProducts.filter((product) => product.sourceProductId).map((product) => [product.sourceProductId!, product]));
  const evidenceRecordIds = new Map<string, string[]>();
  for (const product of input.relationOnlyProducts) {
    const recordId = skuRecordId(product);
    for (const sourceUrl of product.sourceUrls) {
      const url = normalizedUrl(sourceUrl);
      evidenceRecordIds.set(url, [...new Set([...(evidenceRecordIds.get(url) ?? []), recordId])]);
    }
  }

  const infrastructure = [
    input.discovery.sourceRoot,
    input.discovery.robotsUrl,
    input.discovery.sitemapIndexUrl,
    ...(input.discovery.sitemapUrls ?? []),
  ].filter((value): value is string => Boolean(value));
  for (const url of infrastructure) add({
    supplier: "an-cuong",
    url,
    discoveredFrom: url.endsWith("robots.txt") ? "html-link" : "sitemap",
    pageType: "unknown",
    outcome: "non-product",
    reason: "Discovery infrastructure is accounted separately from catalogue records",
  });

  for (const category of input.discovery.categories) add({
    supplier: "an-cuong",
    url: category.sourceUrl,
    discoveredFrom: "html-link",
    sourceParent: input.discovery.sourceRoot,
    locale: "vi",
    pageType: "category",
    outcome: "non-product",
    reason: "Category listing is a discovery surface; its products and families are accounted individually",
  });
  for (const url of input.discovery.sitemapCategoryUrls ?? []) add({
    supplier: "an-cuong",
    url,
    discoveredFrom: "sitemap",
    pageType: "category",
    outcome: "non-product",
    reason: "Category sitemap URL is a discovery surface; catalogue records are accounted individually",
  });

  const aliases = input.discovery.sitemapProductAliases ?? [];
  for (const alias of aliases) {
    if (normalizedUrl(alias.url) !== normalizedUrl(alias.canonicalUrl)) {
      add({
        supplier: "an-cuong",
        url: alias.url,
        canonicalUrl: alias.canonicalUrl,
        discoveredFrom: "sitemap",
        sourceParent: input.discovery.sitemapUrls?.find((url) => new URL(url).pathname === "/sitemap-product.xml"),
        locale: alias.locale,
        pageType: "product",
        outcome: "duplicate",
        reason: `Locale alias of canonical product ${alias.sourceId}`,
      });
      continue;
    }
    const product = productsById.get(alias.sourceId) ?? productsByUrl.get(normalizedUrl(alias.canonicalUrl));
    const relationOnly = relationOnlyById.get(alias.sourceId);
    const rejection = rejectedById.get(alias.sourceId);
    if (product) {
      add({
        supplier: "an-cuong",
        url: alias.url,
        canonicalUrl: alias.canonicalUrl,
        discoveredFrom: "sitemap",
        locale: alias.locale,
        pageType: "product",
        outcome: "imported",
        recordIds: [skuRecordId(product), ...(evidenceRecordIds.get(normalizedUrl(alias.url)) ?? [])],
      });
    } else if (rejection) {
      add({
        supplier: "an-cuong",
        url: alias.url,
        canonicalUrl: alias.canonicalUrl,
        discoveredFrom: "sitemap",
        locale: alias.locale,
        pageType: "product",
        outcome: "removed",
        reason: relationOnly
          ? "The detail page is removed; the public SKU code remains accounted from live relation cards"
          : rejection.reason,
        ...(relationOnly ? { recordIds: [skuRecordId(relationOnly)] } : {}),
      });
    } else {
      add({
        supplier: "an-cuong",
        url: alias.url,
        canonicalUrl: alias.canonicalUrl,
        discoveredFrom: "sitemap",
        locale: alias.locale,
        pageType: "product",
        outcome: "blocked",
        reason: "Numeric sitemap product did not reconcile with an imported or rejected detail response",
      });
    }
  }

  const nonNumericByUrl = new Map(input.nonNumericAudit.accounting.map((record) => [normalizedUrl(record.sourceUrl), record]));
  for (const url of input.discovery.sitemapNonNumericProductUrls ?? []) {
    const audit = nonNumericByUrl.get(normalizedUrl(url));
    const product = productsByUrl.get(normalizedUrl(audit?.canonicalUrl ?? url));
    if (!audit) {
      add({ supplier: "an-cuong", url, discoveredFrom: "sitemap", pageType: "product", outcome: "blocked", reason: "Non-numeric sitemap URL has no crawl audit result" });
      continue;
    }
    add({
      supplier: "an-cuong",
      url,
      ...(audit.canonicalUrl ? { canonicalUrl: audit.canonicalUrl } : {}),
      discoveredFrom: "sitemap",
      pageType: "product",
      status: audit.status,
      checksum: audit.checksum,
      outcome: audit.outcome,
      ...(audit.reason ? { reason: audit.reason } : {}),
      ...(audit.outcome === "imported" && product ? { recordIds: [skuRecordId(product)] } : {}),
    });
  }

  for (const family of input.families) {
    for (const sourceUrl of family.sourceUrls) add({
      supplier: "an-cuong",
      url: sourceUrl,
      discoveredFrom: "sitemap",
      locale: sourceUrl.includes("-en/") || /-en\.html$/i.test(sourceUrl) ? "en" : "vi",
      pageType: "product-family",
      outcome: "imported",
      recordIds: [`an-cuong:family:${family.slug}`],
    });
  }

  for (const document of input.documents) {
    for (const sourceUrl of document.sourceUrls) add({
      supplier: "an-cuong",
      url: sourceUrl,
      discoveredFrom: "catalogue-document",
      pageType: "catalogue",
      outcome: "imported",
      recordIds: [`an-cuong:document:${document.slug}`],
    });
  }

  const manifest: FullSourceManifest = {
    schemaVersion: 1,
    supplier: "an-cuong",
    generatedAt: input.generatedAt,
    records: [...records.values()].sort((left, right) => left.url.localeCompare(right.url)),
    checksum: "",
  };
  manifest.checksum = checksumFullSourceManifest(manifest);
  return manifest;
}

export async function run(options: CliOptions): Promise<FullSourceManifest> {
  const discovery = await readJsonIfExists<DiscoveryManifest>(join(paths.reports, "discovery-manifest.json"));
  const products = await readJsonIfExists<AnCuongProduct[]>(join(paths.normalized, "catalogue.json"));
  const relationOnlyProducts = await readJsonIfExists<SupplierSkuRecord[]>(join(paths.normalized, "relation-only-products.json"));
  const families = await readJsonIfExists<SupplierFamilyRecord[]>(join(paths.normalized, "product-families.json"));
  const documents = (await readJsonIfExists<SupplierDocumentRecord[]>(join(paths.normalized, "documents.json"))) ?? [];
  const rejections = await readJsonIfExists<RejectedProductDetail[]>(join(paths.reports, "detail-rejections.json"));
  const nonNumericAudit = await readJsonIfExists<NonNumericProductAudit>(join(paths.reports, "non-numeric-product-audit.json"));
  if (!discovery || !products || !relationOnlyProducts || !families || !rejections || !nonNumericAudit) {
    throw new Error("An Cuong full manifest requires completed discovery, normalization and source audits");
  }
  const generatedAt = products.map((product) => product.fetchedAt).sort().at(-1) ?? discovery.generatedAt;
  const manifest = buildAnCuongFullSourceManifest({
    discovery,
    products,
    relationOnlyProducts,
    families,
    documents,
    rejections,
    nonNumericAudit,
    generatedAt,
  });
  const issues = validateFullSourceManifest(manifest);
  if (issues.length > 0) throw new Error(`An Cuong full source manifest is invalid: ${issues.map((issue) => issue.code).join(", ")}`);
  if (!options.dryRun) await atomicWriteJson(resolve("data/imports/an-cuong/full-source-manifest.json"), manifest);
  return manifest;
}
