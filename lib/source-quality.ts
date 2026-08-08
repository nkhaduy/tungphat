export const SOURCE_QUALITY_TIERS = [
  "P1_PRIMARY_MANUFACTURER",
  "P2_OFFICIAL_CATALOGUE",
  "P3_FIRST_PARTY_BUSINESS",
  "P4_REPUTABLE_SECONDARY",
  "P5_UNVERIFIED",
] as const;

export type SourceQualityTier = (typeof SOURCE_QUALITY_TIERS)[number];

type Source = { id: string; qualityTier: SourceQualityTier };
type PublishedField = {
  recordId: string;
  field: string;
  value: unknown;
  sourceIds: string[];
};

export function validatePublishedProvenance({ sources, fields }: { sources: Source[]; fields: PublishedField[] }) {
  const sourceById = new Map(sources.map((source) => [source.id, source]));
  const errors: string[] = [];

  for (const field of fields) {
    if (field.value === null || field.value === undefined || field.value === "") continue;
    if (field.sourceIds.length === 0) {
      errors.push(`${field.recordId}.${field.field}: missing source for published fact.`);
      continue;
    }
    for (const sourceId of field.sourceIds) {
      const source = sourceById.get(sourceId);
      if (!source) errors.push(`${field.recordId}.${field.field}: unknown source ${sourceId}.`);
      else if (source.qualityTier === "P5_UNVERIFIED") errors.push(`${field.recordId}.${field.field}: P5_UNVERIFIED cannot support a published fact.`);
    }
  }

  return errors;
}
