import { createHash } from "node:crypto";
import { buildCoverageSummary } from "./coverage";
import type { AccountedSourceRecord, FullSourceManifest, ManifestValidationIssue } from "./types";

export { buildCoverageSummary } from "./coverage";

const outcomesRequiringReason = new Set(["duplicate", "redirected", "removed", "non-product", "invalid", "blocked"]);

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([, child]) => child !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => [key, stableValue(child)]),
  );
}

function stableRecords(records: AccountedSourceRecord[]): AccountedSourceRecord[] {
  return [...records]
    .map((record) => ({
      ...record,
      recordIds: record.recordIds ? [...record.recordIds].sort() : undefined,
    }))
    .sort((left, right) =>
      left.url.localeCompare(right.url) ||
      (left.sourceParent ?? "").localeCompare(right.sourceParent ?? "") ||
      left.discoveredFrom.localeCompare(right.discoveredFrom),
    );
}

export function checksumFullSourceManifest(manifest: FullSourceManifest): string {
  const payload = stableValue({
    schemaVersion: manifest.schemaVersion,
    supplier: manifest.supplier,
    records: stableRecords(manifest.records),
  });
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

export function validateFullSourceManifest(manifest: FullSourceManifest): ManifestValidationIssue[] {
  const issues: ManifestValidationIssue[] = [];
  const seenUrls = new Set<string>();
  for (const record of manifest.records) {
    let normalizedUrl = record.url;
    try {
      const url = new URL(record.url);
      normalizedUrl = url.toString();
      if (url.protocol !== "https:") {
        issues.push({ code: "SOURCE_URL_NOT_HTTPS", message: "Source URL must use HTTPS", url: record.url });
      }
    } catch {
      issues.push({ code: "SOURCE_URL_INVALID", message: "Source URL is invalid", url: record.url });
    }
    if (record.supplier !== manifest.supplier) {
      issues.push({ code: "SUPPLIER_MISMATCH", message: "Record supplier does not match manifest supplier", url: record.url });
    }
    if (seenUrls.has(normalizedUrl)) {
      issues.push({ code: "DUPLICATE_SOURCE_URL", message: "Source URL occurs more than once", url: record.url });
    }
    seenUrls.add(normalizedUrl);
    if (!record.outcome) {
      issues.push({ code: "UNACCOUNTED_SOURCE_URL", message: "Discovered source URL has no accounted outcome", url: record.url });
    } else if (outcomesRequiringReason.has(record.outcome) && !record.reason?.trim()) {
      issues.push({ code: "OUTCOME_REASON_REQUIRED", message: `${record.outcome} outcome requires a reason`, url: record.url });
    }
    if (record.outcome === "imported" && !record.recordIds?.length) {
      issues.push({ code: "IMPORTED_RECORD_ID_REQUIRED", message: "Imported source URL must reference at least one normalized record", url: record.url });
    }
  }
  const coverage = buildCoverageSummary(manifest);
  if (coverage.unaccounted > 0 && !issues.some((issue) => issue.code === "UNACCOUNTED_SOURCE_URL")) {
    issues.push({ code: "COVERAGE_INCOMPLETE", message: `${coverage.unaccounted} source URL(s) are unaccounted` });
  }
  if (manifest.checksum && manifest.checksum !== checksumFullSourceManifest(manifest)) {
    issues.push({ code: "MANIFEST_CHECKSUM_MISMATCH", message: "Manifest checksum does not match its stable contents" });
  }
  return issues;
}
