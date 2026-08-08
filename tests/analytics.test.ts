import { afterEach, describe, expect, it, vi } from "vitest";
import { attributionFromUrl, attributionParameters } from "@/lib/analytics/attribution";
import { normalizeCtaLocation, sanitizePath, sanitizeText, shouldTrackLocation } from "@/lib/analytics/sanitize";
import { generateAnonymousId, SESSION_TIMEOUT_MS } from "@/lib/analytics/session";
import { analyticsEventNames } from "@/lib/analytics/types";
import { conversionRate, countLeadSessions, isAssistedConversion, recordMilestone, vietnamDayBounds } from "@/lib/analytics/metrics";
import { sendGa4Event } from "@/lib/analytics/client";

afterEach(() => vi.unstubAllGlobals());

describe("anonymous analytics primitives", () => {
  it("generates random UUID v4 visitor and session identifiers", () => {
    const first = generateAnonymousId();
    const second = generateAnonymousId();
    expect(first).not.toBe(second);
    expect(first).toMatch(/^[0-9a-f-]{36}$/i);
    expect(first[14]).toBe("4");
  });

  it("uses a 30 minute session timeout", () => {
    expect(SESSION_TIMEOUT_MS).toBe(30 * 60 * 1000);
  });

  it("keeps the event taxonomy allowlisted", () => {
    expect(analyticsEventNames).toContain("page_view");
    expect(analyticsEventNames).toContain("click_zalo");
    expect(analyticsEventNames).not.toContain("keystroke");
  });

  it("queues GA4 events until the lazy analytics loader defines gtag", () => {
    vi.stubGlobal("window", { dataLayer: [] });
    sendGa4Event("page_view", { page_path: "/" });
    expect(window.dataLayer).toEqual([["event", "page_view", { page_path: "/" }]]);
  });
});

describe("attribution", () => {
  it("prioritizes UTM attribution and only extracts allowlisted parameters", () => {
    const url = new URL("https://mdftungphat.com/go-ghep?utm_source=Facebook&utm_medium=Social&utm_campaign=sale&secret=never");
    expect(attributionFromUrl(url, "google.com")).toEqual({
      source: "facebook", medium: "social", campaign: "sale", term: undefined, content: undefined,
    });
    expect(attributionParameters(url, "https://google.com/search?q=private")).toEqual({
      utm_source: "Facebook",
      utm_medium: "Social",
      utm_campaign: "sale",
      referrer_host: "google.com",
    });
  });

  it.each([
    ["https://google.com/search", "google", "organic"],
    ["https://facebook.com/post", "facebook", "social"],
    ["https://zalo.me/share", "zalo", "social"],
    ["", "direct", "none"],
    ["https://example.com/article", "example.com", "referral"],
  ])("classifies %s", (referrer, source, medium) => {
    const host = referrer ? new URL(referrer).hostname : "";
    expect(attributionFromUrl(new URL("https://mdftungphat.com/"), host)).toMatchObject({ source, medium });
  });
});

describe("sanitization and exclusions", () => {
  it("drops query strings, hashes and duplicate slashes from paths", () => {
    expect(sanitizePath("https://mdftungphat.com//go-ghep/?email=private#x")).toBe("/go-ghep/");
  });

  it("limits titles and removes control characters", () => {
    expect(sanitizeText(`A\u0000  B`, 3)).toBe("A B");
  });

  it("normalizes legacy CTA locations", () => {
    expect(normalizeCtaLocation("go-ghep_hero")).toBe("hero");
    expect(normalizeCtaLocation("CN1")).toBe("contact_page");
    expect(normalizeCtaLocation("floating")).toBe("floating_button");
  });

  it("does not track admin, preview, localhost or deployment previews", () => {
    expect(shouldTrackLocation("mdftungphat.com", "/go-ghep")).toBe(true);
    expect(shouldTrackLocation("mdftungphat.com", "/admin")).toBe(false);
    expect(shouldTrackLocation("localhost", "/")).toBe(false);
    expect(shouldTrackLocation("example.vercel.app", "/")).toBe(false);
  });
});

describe("business metric definitions", () => {
  it("deduplicates lead sessions and avoids division by zero", () => {
    const events = [
      { event_name: "click_zalo", session_id: "a" },
      { event_name: "click_phone", session_id: "a" },
      { event_name: "page_view", session_id: "b" },
      { event_name: "form_submit", session_id: "c" },
    ];
    expect(countLeadSessions(events)).toBe(2);
    expect(conversionRate(2, 4)).toBe(0.5);
    expect(conversionRate(0, 0)).toBe(0);
  });

  it("counts assisted conversion only after a content view", () => {
    expect(isAssistedConversion(100, 101)).toBe(true);
    expect(isAssistedConversion(101, 100)).toBe(false);
    expect(isAssistedConversion(100, 100)).toBe(false);
  });

  it("deduplicates scroll milestones", () => {
    const seen = new Set<number>();
    expect(recordMilestone(seen, 50)).toBe(true);
    expect(recordMilestone(seen, 50)).toBe(false);
  });

  it("uses exact Asia/Ho_Chi_Minh day boundaries", () => {
    const bounds = vietnamDayBounds("2026-07-20");
    expect(bounds?.end).toBe((bounds?.start || 0) + 86400);
    expect(new Date((bounds?.start || 0) * 1000).toISOString()).toBe("2026-07-19T17:00:00.000Z");
    expect(bounds?.timezone).toBe("Asia/Ho_Chi_Minh");
  });
});
