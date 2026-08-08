import { createHash } from "node:crypto";
import type { SupplierSkuRecord } from "../../lib/catalog/full-import/types";
import type { RelationRecord } from "./crawl-relations";

type RejectedDetail = {
  sourceId?: string;
  sourceUrl: string;
  reason: string;
};

function normalizeCode(value: string): string {
  return value.normalize("NFKC").replace(/\s+/g, " ").trim();
}

function slug(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("vi")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function productFamily(sourceUrl: string): string {
  const segments = new URL(sourceUrl).pathname.split("/").filter(Boolean);
  const familySlug = segments.at(-2) ?? segments[0] ?? "other";
  if (familySlug === "pvc-decal") return "PVC Decal";
  if (familySlug === "eco-veneer") return "Eco Veneer";
  return familySlug.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}

function checksum(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

export function buildRelationOnlySkuRecords(
  relations: RelationRecord[],
  rejectedDetails: RejectedDetail[],
  importedSourceIds: Set<string>,
  importedAt: string,
): SupplierSkuRecord[] {
  const rejectedIds = new Set(rejectedDetails.map((detail) => detail.sourceId).filter((value): value is string => Boolean(value)));
  const grouped = new Map<string, RelationRecord[]>();
  for (const relation of relations) {
    if (relation.relationType !== "same-color" ||
      !relation.targetSourceId ||
      importedSourceIds.has(relation.targetSourceId) ||
      !rejectedIds.has(relation.targetSourceId) ||
      !relation.targetSourceUrl ||
      !relation.targetProductCode?.trim() ||
      !relation.targetName?.trim()) continue;
    const group = grouped.get(relation.targetSourceId) ?? [];
    group.push(relation);
    grouped.set(relation.targetSourceId, group);
  }

  const records: SupplierSkuRecord[] = [];
  for (const [sourceProductId, group] of grouped) {
    const sorted = [...group].sort((left, right) => left.sourceUrl.localeCompare(right.sourceUrl));
    const evidence = sorted[0];
    const code = normalizeCode(evidence.targetProductCode!);
    const family = productFamily(evidence.targetSourceUrl!);
    const sourceUrls = [...new Set([
      evidence.targetSourceUrl!,
      ...sorted.map((relation) => relation.sourceUrl),
    ])].sort();
    const canonicalSourceUrl = sourceUrls.find((url) => url !== evidence.targetSourceUrl) ?? evidence.targetSourceUrl!;
    const sourceChecksum = checksum({ sourceProductId, code, name: evidence.targetName, sourceUrls });
    records.push({
      recordType: "sku",
      supplier: "an-cuong",
      sourceProductId,
      code,
      normalizedCode: code.toLocaleUpperCase("vi"),
      name: evidence.targetName!,
      slug: `an-cuong-${slug(code)}`,
      productFamily: family,
      category: family,
      collections: [],
      attributes: {
        sourceEvidence: "same-color-relation",
        detailPageStatus: "removed",
      },
      formats: [],
      images: [],
      documents: [],
      sourceUrls,
      canonicalSourceUrl,
      importedAt,
      sourceChecksum,
      completenessScore: 35,
      editorialStatus: "NEEDS_EDITORIAL_REVIEW",
      seoStatus: "NOINDEX_USEFUL",
    });
  }
  return records.sort((left, right) => left.normalizedCode.localeCompare(right.normalizedCode));
}
