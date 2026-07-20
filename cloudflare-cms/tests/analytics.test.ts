import { describe, expect, it } from "vitest";
import { createAdminSessionCookie, hasValidAdminSession } from "../src/oauth/admin-session";
import { dateInVietnam, dateRange } from "../src/analytics/admin-handler";
import { analyticsPayloadSchema, attribution, isBot, parseDevice, sanitizePath } from "../src/analytics/validation";

const validPayload = {
  event_id: "123e4567-e89b-42d3-a456-426614174000",
  visitor_id: "123e4567-e89b-42d3-a456-426614174001",
  session_id: "123e4567-e89b-42d3-a456-426614174002",
  event_name: "click_zalo",
  occurred_at: 1_800_000_000,
  path: "/go-ghep",
  page_title: "Gỗ ghép",
  cta_location: "hero",
  target_type: "zalo",
};

describe("collector validation", () => {
  it("accepts an allowlisted event and rejects unknown metadata", () => {
    expect(analyticsPayloadSchema.safeParse(validPayload).success).toBe(true);
    expect(analyticsPayloadSchema.safeParse({ ...validPayload, event_name: "fingerprint" }).success).toBe(false);
    expect(analyticsPayloadSchema.safeParse({ ...validPayload, email: "private@example.com" }).success).toBe(false);
  });

  it("rejects invalid path, oversized title and scroll values", () => {
    expect(analyticsPayloadSchema.safeParse({ ...validPayload, path: "https://evil.example" }).success).toBe(false);
    expect(analyticsPayloadSchema.safeParse({ ...validPayload, page_title: "x".repeat(161) }).success).toBe(false);
    expect(analyticsPayloadSchema.safeParse({ ...validPayload, scroll_percent: 99 }).success).toBe(false);
  });

  it("sanitizes paths and classifies only coarse device information", () => {
    expect(sanitizePath("/go-ghep?email=private#x")).toBe("/go-ghep");
    expect(parseDevice("Mozilla/5.0 (iPhone) AppleWebKit Safari/605.1")).toEqual({
      device: "mobile", browser: "Safari", os: "iOS",
    });
  });

  it("filters search, social and automation bots", () => {
    expect(isBot("Googlebot/2.1")).toBe(true);
    expect(isBot("Playwright Chromium")).toBe(true);
    expect(isBot("Mozilla/5.0 Chrome/126")).toBe(false);
  });

  it("does not let a mid-session referrer override UTM attribution", () => {
    expect(attribution({ utm_source: "newsletter", utm_medium: "email", referrer_host: "google.com" }))
      .toMatchObject({ source: "newsletter", medium: "email" });
  });
});

describe("CMS admin session", () => {
  it("creates an HttpOnly session accepted by server-side auth", async () => {
    const secret = "test-secret-that-is-at-least-thirty-two-characters";
    const cookie = await createAdminSessionCookie(secret);
    expect(cookie).toContain("HttpOnly");
    const request = new Request("https://cms.mdftungphat.com/api/admin/analytics/status", {
      headers: { Cookie: cookie.split(";")[0] },
    });
    expect(await hasValidAdminSession(request, secret)).toBe(true);
    expect(await hasValidAdminSession(request, `${secret}-wrong`)).toBe(false);
  });
});

describe("Vietnam analytics date range", () => {
  it("changes today at midnight Asia/Ho_Chi_Minh, not UTC midnight", () => {
    expect(dateInVietnam(Date.parse("2026-07-19T16:59:59.000Z"))).toBe("2026-07-19");
    expect(dateInVietnam(Date.parse("2026-07-19T17:00:00.000Z"))).toBe("2026-07-20");
  });

  it("creates exact inclusive Vietnam-day boundaries", () => {
    const range = dateRange(new URL("https://cms.mdftungphat.com/api/admin/analytics/overview?from=2026-07-20&to=2026-07-20"));
    expect(new Date((range?.start || 0) * 1000).toISOString()).toBe("2026-07-19T17:00:00.000Z");
    expect(new Date((range?.end || 0) * 1000).toISOString()).toBe("2026-07-20T17:00:00.000Z");
  });
});
