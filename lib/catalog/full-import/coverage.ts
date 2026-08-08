import type { CoverageSummary, FullSourceManifest, SourceOutcome } from "./types";

export function buildCoverageSummary(manifest: FullSourceManifest): CoverageSummary {
  const outcomes: Partial<Record<SourceOutcome, number>> = {};
  let accounted = 0;
  for (const record of manifest.records) {
    if (!record.outcome) continue;
    accounted += 1;
    outcomes[record.outcome] = (outcomes[record.outcome] ?? 0) + 1;
  }
  const totalDiscovered = manifest.records.length;
  return {
    totalDiscovered,
    accounted,
    unaccounted: totalDiscovered - accounted,
    coveragePercentage: totalDiscovered === 0 ? 100 : Number(((accounted / totalDiscovered) * 100).toFixed(2)),
    outcomes,
  };
}
