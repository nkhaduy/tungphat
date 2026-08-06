import type { AnCuongProduct, DiffClassification, DiffRecord } from "./types";
import { stableStringify } from "./stable-json";
import path from "node:path";
import { paths } from "./config";
import type { CliOptions } from "./types";
import { atomicWriteJson, readJsonIfExists } from "./stable-json";

export type DiffProduct = Partial<AnCuongProduct> & {
  sourceUrl: string;
  sourceId?: string;
  productCode?: string;
  normalizedProductCode?: string;
  category?: string;
  categorySlug?: string;
  normalizedHash?: string;
  status?: string;
};

export interface CatalogueDiff {
  entries: DiffRecord[];
  catalogue: DiffProduct[];
  summary: Record<DiffClassification, number>;
}

export function buildDiffReport(result: CatalogueDiff): Pick<CatalogueDiff, "entries" | "summary"> {
  return { entries: result.entries, summary: result.summary };
}

const CLASSIFICATION_ORDER: DiffClassification[] = ["INVALID", "NEW", "UPDATED", "MEDIA_CHANGED", "RELATION_CHANGED", "DUPLICATE", "MISSING_FROM_SOURCE", "UNCHANGED"];

function canonicalUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    parsed.search = "";
    parsed.pathname = parsed.pathname.replace(/\/+$/, "") || "/";
    return parsed.toString();
  } catch {
    return url.trim();
  }
}

function key(product: DiffProduct): string {
  return product.sourceId?.trim() || `${canonicalUrl(product.sourceUrl)}|${product.normalizedProductCode ?? product.productCode ?? ""}|${product.categorySlug ?? product.category ?? ""}`;
}

function fingerprints(product: DiffProduct): string[] {
  const result = [`url:${canonicalUrl(product.sourceUrl)}`];
  if (product.sourceId?.trim()) {
    result.push(`id:${product.sourceId.trim()}`);
    return result;
  }
  const code = product.normalizedProductCode ?? product.productCode;
  const category = product.categorySlug ?? product.category;
  if (code && category) result.push(`code:${code}|category:${category}`);
  if (product.sourceHash && category) result.push(`hash:${product.sourceHash}|category:${category}`);
  return result;
}

function relationSignature(product: DiffProduct): string {
  return stableStringify({ relatedProducts: product.relatedProducts ?? [], sameColorProducts: product.sameColorProducts ?? [], applicationProducts: product.applicationProducts ?? [] });
}

function mediaSignature(product: DiffProduct): string {
  return stableStringify({ primaryImage: product.primaryImage ?? null, gallery: product.gallery ?? [] });
}

function record(keyValue: string, classification: DiffClassification, product?: DiffProduct, details?: string[]): DiffRecord {
  return { key: keyValue, classification, sourceUrl: product?.sourceUrl, productCode: product?.productCode, details };
}

function summaryFor(entries: DiffRecord[]): Record<DiffClassification, number> {
  const summary = Object.fromEntries(CLASSIFICATION_ORDER.map((item) => [item, 0])) as Record<DiffClassification, number>;
  for (const entry of entries) summary[entry.classification] += 1;
  return summary;
}

export function diffCatalogues(previous: DiffProduct[], current: DiffProduct[]): CatalogueDiff {
  const oldByFingerprint = new Map<string, DiffProduct>();
  for (const item of previous) for (const fingerprint of fingerprints(item)) oldByFingerprint.set(fingerprint, item);
  const seen = new Set<string>();
  const matchedPrevious = new Set<DiffProduct>();
  const entries: DiffRecord[] = [];
  const catalogue: DiffProduct[] = [];

  for (const item of current) {
    const itemKey = key(item);
    const itemFingerprints = fingerprints(item);
    const prior = itemFingerprints.map((fingerprint) => oldByFingerprint.get(fingerprint)).find((value): value is DiffProduct => Boolean(value));
    if (itemFingerprints.some((fingerprint) => seen.has(fingerprint))) {
      entries.push(record(itemKey, "DUPLICATE", item, ["identity collides with another current record"]));
      catalogue.push({ ...item, status: "duplicate" });
      continue;
    }
    for (const fingerprint of itemFingerprints) seen.add(fingerprint);
    if (prior) matchedPrevious.add(prior);
    if (item.status === "invalid" || item.status === "source-unavailable") {
      entries.push(record(itemKey, "INVALID", item, [`source status is ${item.status}`]));
      catalogue.push(item);
      continue;
    }
    if (!prior) {
      entries.push(record(itemKey, "NEW", item));
      catalogue.push(item);
      continue;
    }
    const relationChanged = relationSignature(prior) !== relationSignature(item);
    const mediaChanged = mediaSignature(prior) !== mediaSignature(item);
    const contentChanged = prior.normalizedHash !== item.normalizedHash;
    let classification: DiffClassification = "UNCHANGED";
    const details: string[] = [];
    if (contentChanged) { classification = "UPDATED"; details.push("normalized content changed"); }
    else if (relationChanged) { classification = "RELATION_CHANGED"; details.push("relationship graph changed"); }
    else if (mediaChanged) { classification = "MEDIA_CHANGED"; details.push("media manifest changed"); }
    entries.push(record(itemKey, classification, item, details));
    catalogue.push({ ...item, status: classification === "UNCHANGED" ? item.status : classification === "UPDATED" ? "changed" : item.status });
  }

  for (const prior of previous) {
    const priorKey = key(prior);
    if (!matchedPrevious.has(prior)) {
      entries.push(record(priorKey, "MISSING_FROM_SOURCE", prior, ["record existed in previous snapshot but not current source"]));
      catalogue.push({ ...prior, status: "missing" });
    }
  }

  entries.sort((left, right) => {
    const rank = (item: DiffClassification) => CLASSIFICATION_ORDER.indexOf(item);
    return rank(left.classification) - rank(right.classification) || left.key.localeCompare(right.key);
  });
  catalogue.sort((left, right) => key(left).localeCompare(key(right)));
  return { entries, catalogue, summary: summaryFor(entries) };
}

function recordsFrom(value: unknown): DiffProduct[] {
  if (Array.isArray(value)) return value as DiffProduct[];
  if (value && typeof value === "object" && Array.isArray((value as { records?: unknown[] }).records)) return (value as { records: DiffProduct[] }).records;
  return [];
}

export async function run(options: CliOptions): Promise<CatalogueDiff> {
  const current = recordsFrom(await readJsonIfExists(path.join(paths.normalized, "catalogue.json")));
  const previous = recordsFrom(await readJsonIfExists(path.join(paths.export, "catalogue.json")));
  const result = diffCatalogues(previous, current);
  if (!options.dryRun) await atomicWriteJson(path.join(paths.reports, "latest-diff.json"), buildDiffReport(result));
  return result;
}
