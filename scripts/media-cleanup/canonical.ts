export type CanonicalMediaCandidate = {
  id: string;
  width?: number;
  height?: number;
  bytes?: number;
  role?: string;
  referenceCount?: number;
  r2Key?: string;
};

export function selectCanonicalMedia<T extends CanonicalMediaCandidate>(candidates: T[]): T {
  if (!candidates.length) throw new Error("Cannot select canonical media from an empty group");
  return [...candidates].sort((left, right) => score(right) - score(left) || left.id.localeCompare(right.id))[0];
}

function score(candidate: CanonicalMediaCandidate): number {
  const pixels = (candidate.width ?? 0) * (candidate.height ?? 0);
  const fullSizeRole = candidate.role === "fullsheet" || candidate.role === "actual-photo" || candidate.role === "product" ? 1 : 0;
  return pixels * 1_000_000 + (candidate.bytes ?? 0) * 100 + fullSizeRole * 10 + (candidate.referenceCount ?? 0);
}
