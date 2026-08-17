import { compactConfirmedGalleryDuplicates, type GalleryImage } from "./gallery-dedup";

export type AnCuongGalleryDecision = {
  recordId: string;
  duplicateIndex: number;
  canonicalIndex: number;
  duplicateChecksum: string;
  canonicalChecksum: string;
  duplicateSourceUrl?: string;
  canonicalSourceUrl?: string;
  classification: "EXACT_REFERENCE_DUPLICATE" | "EXACT_BINARY_DUPLICATE" | "VISUAL_DUPLICATE";
};

type RecordWithGallery<T extends GalleryImage> = {
  id: string;
  images: T[];
};

export function applyAnCuongGalleryDecisions<T extends GalleryImage & { originalChecksum?: string }, R extends RecordWithGallery<T>>(
  records: R[],
  decisions: AnCuongGalleryDecision[],
): R[] {
  const byRecord = new Map<string, AnCuongGalleryDecision[]>();
  for (const decision of decisions) {
    const current = byRecord.get(decision.recordId) || [];
    current.push(decision);
    byRecord.set(decision.recordId, current);
  }

  return records.map((record) => {
    const recordDecisions = byRecord.get(record.id);
    if (!recordDecisions?.length) return record;
    for (const decision of recordDecisions) {
      const duplicate = record.images[decision.duplicateIndex];
      const canonical = record.images[decision.canonicalIndex];
      const duplicateMatches = duplicate?.originalChecksum
        ? duplicate.originalChecksum === decision.duplicateChecksum
        : Boolean(decision.duplicateSourceUrl && duplicate?.sourceUrl === decision.duplicateSourceUrl);
      const canonicalMatches = canonical?.originalChecksum
        ? canonical.originalChecksum === decision.canonicalChecksum
        : Boolean(decision.canonicalSourceUrl && canonical?.sourceUrl === decision.canonicalSourceUrl);
      if (!duplicateMatches || !canonicalMatches) {
        throw new Error(`Stale gallery decision for ${record.id}`);
      }
    }
    return {
      ...record,
      images: compactConfirmedGalleryDuplicates(record.images, recordDecisions),
    };
  });
}
