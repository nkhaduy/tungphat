export type EntityConsistency = "CONSISTENT" | "MISMATCH" | "VERIFIED" | "UNVERIFIED" | "MISSING" | "AUTH_BLOCKED";

export type EntityRecord = {
  source: string;
  sourceType: string;
  url: string | null;
  entity: string | null;
  branch: string | null;
  address: string | null;
  phone: string | null;
  website: string | null;
  categories: string[];
  relationship: string | null;
  evidence: string | null;
  consistency: EntityConsistency;
  confidence: "low" | "medium" | "high";
  checkedAt: string | null;
};

type LegacyEntityRecord = Partial<EntityRecord> & {
  entityName?: string | null;
  consistencyStatus?: EntityConsistency;
  socialProfile?: string | null;
};

function inferSourceType(source: string) {
  if (/google maps|bing places/iu.test(source)) return "maps";
  if (/facebook|zalo|youtube|tiktok|linkedin/iu.test(source)) return "social";
  if (/website/iu.test(source)) return "website";
  return "directory";
}

function inferBranch(source: string) {
  return source.match(/branch\s+\d+/iu)?.[0]?.toLocaleLowerCase("en-US") ?? null;
}

export function normalizeEntityRecord(record: LegacyEntityRecord): EntityRecord {
  return {
    source: record.source ?? "Unknown source",
    sourceType: record.sourceType ?? inferSourceType(record.source ?? ""),
    url: record.url ?? record.socialProfile ?? null,
    entity: record.entity ?? record.entityName ?? null,
    branch: record.branch ?? inferBranch(record.source ?? ""),
    address: record.address ?? null,
    phone: record.phone ?? null,
    website: record.website ?? null,
    categories: record.categories ?? [],
    relationship: record.relationship ?? null,
    evidence: record.evidence ?? null,
    consistency: record.consistency ?? record.consistencyStatus ?? "UNVERIFIED",
    confidence: record.confidence ?? "low",
    checkedAt: record.checkedAt ?? null,
  };
}

export function summarizeEntityRecords(records: EntityRecord[]) {
  const count = (status: EntityConsistency) => records.filter((record) => record.consistency === status).length;
  const verified = count("VERIFIED");
  const consistent = count("CONSISTENT");
  return {
    total: records.length,
    verified,
    consistent,
    corroborated: verified + consistent,
    mismatches: count("MISMATCH"),
    missing: count("MISSING"),
    unverified: count("UNVERIFIED"),
    authBlocked: count("AUTH_BLOCKED"),
  };
}
