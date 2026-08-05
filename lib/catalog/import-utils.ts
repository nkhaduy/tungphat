import type { SupplierColorCode } from "@/lib/catalog/types";

type ImportReport = {
  created: number;
  updated: number;
  unchanged: number;
  skipped: number;
  duplicates: number;
};

const EDITORIAL_FIELDS = [
  "editorialDescription",
  "applications",
  "relatedServices",
  "published",
  "seoStatus",
] as const;

function recordKey(record: SupplierColorCode) {
  return `${record.supplier}:${record.codeNormalized}`;
}

function comparableSource(record: SupplierColorCode) {
  const copy = { ...record } as Record<string, unknown>;
  delete copy.sourceImportedAt;
  for (const field of EDITORIAL_FIELDS) delete copy[field];
  return JSON.stringify(copy);
}

function preserveEditorial(incoming: SupplierColorCode, existing?: SupplierColorCode) {
  if (!existing) return incoming;
  const merged = { ...incoming };
  for (const field of EDITORIAL_FIELDS) {
    const current = existing[field];
    if (current !== undefined) {
      Object.assign(merged, { [field]: current });
    }
  }
  return merged;
}

export function mergeCatalogRecords(
  existingRecords: SupplierColorCode[],
  incomingRecords: SupplierColorCode[],
): { records: SupplierColorCode[]; report: ImportReport } {
  const report: ImportReport = { created: 0, updated: 0, unchanged: 0, skipped: 0, duplicates: 0 };
  const existing = new Map(existingRecords.map((record) => [recordKey(record), record]));
  const incoming = new Map<string, SupplierColorCode>();

  for (const record of incomingRecords) {
    const key = recordKey(record);
    if (incoming.has(key)) {
      report.duplicates += 1;
      continue;
    }
    incoming.set(key, record);
  }

  for (const [key, record] of incoming) {
    const current = existing.get(key);
    if (!current) {
      existing.set(key, record);
      report.created += 1;
      continue;
    }
    if (comparableSource(current) === comparableSource(record)) {
      report.unchanged += 1;
      continue;
    }
    existing.set(key, preserveEditorial(record, current));
    report.updated += 1;
  }

  return {
    records: [...existing.values()].sort((a, b) => a.codeNormalized.localeCompare(b.codeNormalized, "en")),
    report,
  };
}

export function buildZaloInquiryUrl(baseUrl: string, displayCode: string) {
  const message = `Tôi cần kiểm tra mã Melamine Ba Thanh ${displayCode} tại Tùng Phát. Vui lòng tư vấn loại ván, quy cách và tình trạng hàng.`;
  const separator = baseUrl.includes("?") ? "&" : "?";
  return `${baseUrl}${separator}text=${encodeURIComponent(message)}`;
}
