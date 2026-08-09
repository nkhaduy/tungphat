import { describe, expect, it } from "vitest";
import { buildExternalEntityEdges, summarizeEntityRecords, normalizeEntityRecord } from "@/lib/entity-corroboration";

describe("entity corroboration", () => {
  it("adds graph edges only for verified or consistent external URLs", () => {
    const records = [
      normalizeEntityRecord({ source: "Google Maps", sourceType: "maps", url: "https://maps.example/branch", consistency: "VERIFIED", confidence: "high" }),
      normalizeEntityRecord({ source: "Zalo", sourceType: "social", url: "https://zalo.me/0909259160", consistency: "CONSISTENT", confidence: "medium" }),
      normalizeEntityRecord({ source: "Facebook", sourceType: "social", url: "https://facebook.com/candidate", consistency: "UNVERIFIED", confidence: "medium" }),
    ];

    expect(buildExternalEntityEdges(records)).toEqual([
      { from: "tung-phat", to: "external-google-maps", relationship: "externalCorroboration", evidence: "https://maps.example/branch", status: "VERIFIED" },
      { from: "tung-phat", to: "external-zalo", relationship: "externalCorroboration", evidence: "https://zalo.me/0909259160", status: "CONSISTENT" },
    ]);
  });

  it("normalizes Vietnamese source names into stable ASCII node identifiers", () => {
    const records = [
      normalizeEntityRecord({ source: "Gỗ Thanh Thùy distributor directory", sourceType: "manufacturer-directory", url: "https://example.com/tung-phat", consistency: "VERIFIED", confidence: "high" }),
    ];

    expect(buildExternalEntityEdges(records)[0].to).toBe("external-go-thanh-thuy-distributor-directory");
  });
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
