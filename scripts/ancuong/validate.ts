import type { AnCuongProduct } from "./types";
import path from "node:path";
import { paths } from "./config";
import type { CliOptions } from "./types";
import { atomicWriteJson, readJsonIfExists } from "./stable-json";

export interface ValidationIssue {
  level: "error" | "warning";
  code: string;
  message: string;
  path?: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
  summary: { products: number; media: number; relations: number; errors: number; warnings: number };
}

interface ValidationMedia {
  sourceUrl: string;
  productSourceId?: string;
  mimeType?: string;
  width?: number;
  height?: number;
  sha256?: string;
  status?: string;
}

interface ValidationRelation { relationType?: string; sourceId?: string; targetSourceId?: string; sourceUrl?: string; targetSourceUrl?: string; targetProductCode?: string; targetName?: string }
interface ValidationInput { products: Array<Partial<AnCuongProduct> & Record<string, unknown>>; media?: ValidationMedia[]; relations?: ValidationRelation[]; knownProductIds?: string[]; }

const EXCLUDED_SEGMENTS = /\/(?:tin-tuc|news|kien-thuc|du-an|project|tuyen-dung|lien-he|contact|showroom|chinh-sach|search)(?:\/|$)/i;
const IMAGE_MIMES = new Set(["image/avif", "image/gif", "image/jpeg", "image/png", "image/webp"]);
const RELATION_TYPES = new Set(["same-color", "same-line", "application", "edge-band", "related"]);

function issue(issues: ValidationIssue[], code: string, message: string, path?: string, level: ValidationIssue["level"] = "error") {
  issues.push({ level, code, message, path });
}

function identity(product: ValidationInput["products"][number]): string {
  return product.sourceId?.trim() || `${product.sourceUrl}|${product.normalizedProductCode ?? product.productCode ?? ""}|${product.categorySlug ?? product.category ?? ""}`;
}

function secretPaths(value: unknown, currentPath: string): string[] {
  if (!value || typeof value !== "object") return [];
  const results: string[] = [];
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    const childPath = `${currentPath}.${key}`;
    if (/token|cookie|authorization|secret|session/i.test(key)) results.push(childPath);
    results.push(...secretPaths(child, childPath));
  }
  return results;
}

function isAllowedMaterialUrl(value: string, requireProductId = false): boolean {
  try {
    const url = new URL(value);
    if (!["ancuong.com", "www.ancuong.com"].includes(url.hostname) || EXCLUDED_SEGMENTS.test(url.pathname)) return false;
    return !requireProductId || /^\/[a-z0-9-]+\/\d+\.html$/i.test(url.pathname);
  } catch {
    return false;
  }
}

export function validateCatalogue(input: ValidationInput): ValidationResult {
  const issues: ValidationIssue[] = [];
  if (input.products.length === 0) issue(issues, "PRODUCTS_EMPTY", "normalized catalogue contains no products");
  const seen = new Set<string>();
  const productIds = new Set([
    ...input.products.map((product) => product.sourceId).filter((value): value is string => typeof value === "string" && value.length > 0),
    ...(input.knownProductIds ?? []),
  ]);
  for (const [index, product] of input.products.entries()) {
    const path = `products[${index}]`;
    if (product.source !== undefined && product.source !== "ancuong") issue(issues, "SOURCE_INVALID", "source must be ancuong", `${path}.source`);
    if (typeof product.sourceUrl !== "string" || !isAllowedMaterialUrl(product.sourceUrl, true)) issue(issues, "URL_OUT_OF_SCOPE", "product URL is outside the material catalogue allowlist", `${path}.sourceUrl`);
    for (const field of ["name", "category", "categorySlug"]) if (typeof product[field] !== "string" || !String(product[field]).trim()) issue(issues, "FIELD_REQUIRED", `${field} is required`, `${path}.${field}`);
    if (product.productCode !== undefined && typeof product.productCode !== "string") issue(issues, "FIELD_INVALID", "productCode must be a string", `${path}.productCode`);
    if (seen.has(identity(product))) issue(issues, "DUPLICATE_PRODUCT", "product identity occurs more than once", path);
    seen.add(identity(product));
    const serialized = JSON.stringify(product);
    if (/<(?:script|style|form|iframe)\b|javascript:/i.test(serialized)) issue(issues, "HTML_LEAK", "product contains HTML or executable markup", path);
    if (/\b(?:hotline|email|điện thoại|phone|contact us|liên hệ)\b/i.test(serialized)) issue(issues, "CONTACT_LEAK", "product contains source contact content", path);
    for (const secretPath of secretPaths(product, path)) issue(issues, "SECRET_FIELD", "dataset contains a secret-like field", secretPath);
    if (product.contentUsageStatus && !["technical-data", "reference-only", "requires-rewrite", "do-not-publish"].includes(product.contentUsageStatus)) issue(issues, "CONTENT_USAGE_INVALID", "contentUsageStatus is not recognized", `${path}.contentUsageStatus`);
  }
  const relationKeys = new Set<string>();
  for (const [index, relation] of (input.relations ?? []).entries()) {
    if (!relation.relationType || !RELATION_TYPES.has(relation.relationType)) issue(issues, "RELATION_TYPE_INVALID", "relation type is not recognized", `relations[${index}].relationType`);
    if (relation.sourceId && relation.targetSourceId && relation.sourceId === relation.targetSourceId) issue(issues, "SELF_RELATION", "relation cannot point to itself", `relations[${index}]`);
    const targetsProduct = relation.relationType === "same-color" || relation.relationType === "edge-band" || relation.relationType === "related";
    if (targetsProduct && relation.targetSourceId && !productIds.has(relation.targetSourceId)) issue(issues, "RELATION_UNRESOLVED", "source-declared relation target does not exist in the discovered catalogue", `relations[${index}].targetSourceId`, "warning");
    const relationTarget = relation.targetSourceId ?? relation.targetSourceUrl ?? relation.targetProductCode ?? relation.targetName ?? "";
    const relationKey = `${relation.relationType ?? ""}|${relation.sourceId ?? relation.sourceUrl ?? ""}|${relationTarget}`;
    if (relationKeys.has(relationKey)) issue(issues, "DUPLICATE_RELATION", "relation occurs more than once", `relations[${index}]`);
    relationKeys.add(relationKey);
    if (relation.sourceUrl && !isAllowedMaterialUrl(relation.sourceUrl)) issue(issues, "RELATION_URL_OUT_OF_SCOPE", "relation source URL is outside the catalogue allowlist", `relations[${index}].sourceUrl`);
    if (relation.targetSourceUrl && !isAllowedMaterialUrl(relation.targetSourceUrl)) issue(issues, "RELATION_URL_OUT_OF_SCOPE", "relation target URL is outside the catalogue allowlist", `relations[${index}].targetSourceUrl`);
  }
  for (const [index, media] of (input.media ?? []).entries()) {
    const path = `media[${index}]`;
    if (media.mimeType && !IMAGE_MIMES.has(media.mimeType)) issue(issues, "MEDIA_MIME_INVALID", "media MIME type is not an allowed image type", `${path}.mimeType`);
    if ((media.width === 1 && media.height === 1) || /(?:tracking|tracker|pixel|spacer)/i.test(media.sourceUrl)) issue(issues, "TRACKING_PIXEL", "media appears to be a tracking pixel", path);
    if (media.sha256 && !/^[a-f0-9]{64}$/i.test(media.sha256)) issue(issues, "CHECKSUM_INVALID", "media sha256 must be a 64-character hex digest", `${path}.sha256`);
    if (media.status === "downloaded" && !media.sha256) issue(issues, "CHECKSUM_MISSING", "downloaded media must have a checksum", `${path}.sha256`);
  }
  const errors = issues.filter((entry) => entry.level === "error").length;
  return { valid: errors === 0, issues, summary: { products: input.products.length, media: input.media?.length ?? 0, relations: input.relations?.length ?? 0, errors, warnings: issues.length - errors } };
}

function recordsFrom(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object" && Array.isArray((value as { records?: unknown[] }).records)) return (value as { records: unknown[] }).records;
  return [];
}

export async function run(options: CliOptions): Promise<ValidationResult> {
  const products = recordsFrom(await readJsonIfExists(path.join(paths.normalized, "catalogue.json"))) as ValidationInput["products"];
  const media = recordsFrom(await readJsonIfExists(path.join(paths.normalized, "media-manifest.json"))) as ValidationMedia[];
  const relations = recordsFrom(await readJsonIfExists(path.join(paths.normalized, "relations.json"))) as ValidationRelation[];
  const listings = recordsFrom(await readJsonIfExists(path.join(paths.raw, "listings.json"))) as Array<{ sourceId?: string }>;
  const knownProductIds = listings.map((listing) => listing.sourceId).filter((value): value is string => typeof value === "string" && value.length > 0);
  const result = validateCatalogue({ products, media, relations, knownProductIds });
  if (!options.dryRun) await atomicWriteJson(path.join(paths.reports, "validation-report.json"), result);
  if (!result.valid) throw new Error(`An Cuong validation failed with ${result.summary.errors} error(s)`);
  return result;
}
