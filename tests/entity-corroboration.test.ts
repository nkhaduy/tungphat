import { describe, expect, it } from "vitest";
import { summarizeEntityRecords, normalizeEntityRecord } from "@/lib/entity-corroboration";

describe("entity corroboration", () => {
  it("normalizes legacy record fields into the Phase 3 schema", () => {
    const record = normalizeEntityRecord({
      source: "Google Maps - branch 1",
      url: "https://maps.google.com/example",
      entityName: "Cửa Hàng Gỗ Ghép Tùng Phát",
      address: "14 Tam Bình",
      phone: null,
      website: null,
      relationship: "location listing",
      consistencyStatus: "UNVERIFIED",
      evidence: "Official site stores the place ID.",
      confidence: "medium",
    });
    expect(record).toMatchObject({ source: "Google Maps - branch 1", sourceType: "maps", branch: "branch 1", entity: "Cửa Hàng Gỗ Ghép Tùng Phát", consistency: "UNVERIFIED", checkedAt: null });
  });

  it("counts statuses without treating missing sources as corroboration", () => {
    const summary = summarizeEntityRecords([
      normalizeEntityRecord({ source: "Official website", sourceType: "website", entity: "Tùng Phát", consistency: "CONSISTENT" }),
      normalizeEntityRecord({ source: "Facebook", sourceType: "social", entity: null, consistency: "MISSING" }),
    ]);
    expect(summary).toEqual({ total: 2, verified: 0, consistent: 1, corroborated: 1, mismatches: 0, missing: 1, unverified: 0, authBlocked: 0 });
  });
});
