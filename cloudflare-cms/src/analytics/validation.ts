import { z } from "zod";
import { ctaLocations, eventNames } from "./types";

const optionalText = (max: number) => z.string().trim().min(1).max(max).optional();
const uuid = z.string().uuid();

export const analyticsPayloadSchema = z.object({
  event_id: uuid,
  visitor_id: uuid,
  session_id: uuid,
  event_name: z.enum(eventNames),
  occurred_at: z.number().int().positive(),
  path: z.string().trim().startsWith("/").max(500),
  page_title: optionalText(160),
  content_type: z.enum(["article", "product", "service", "project", "catalogue", "page"]).optional(),
  content_id: optionalText(160),
  content_title: optionalText(180),
  content_category: optionalText(120),
  cta_location: z.enum(ctaLocations).optional(),
  target_type: z.enum(["phone", "zalo", "email", "maps", "catalogue", "quote", "form"]).optional(),
  scroll_percent: z.union([z.literal(25), z.literal(50), z.literal(75), z.literal(90)]).optional(),
  engagement_seconds: z.number().int().min(1).max(7200).optional(),
  attribution: z.object({
    referrer_host: optionalText(255),
    utm_source: optionalText(120),
    utm_medium: optionalText(120),
    utm_campaign: optionalText(120),
    utm_term: optionalText(120),
    utm_content: optionalText(120),
    gclid: optionalText(180),
    fbclid: optionalText(180),
  }).strict().optional(),
}).strict();

export function sanitizePath(raw: string) {
  const path = raw.split("?")[0].split("#")[0].replace(/\/{2,}/g, "/");
  return (path.startsWith("/") ? path : `/${path}`).slice(0, 500);
}

export function isBot(userAgent: string) {
  return /bot|crawler|spider|slurp|googlebot|bingbot|ahrefsbot|semrushbot|facebookexternalhit|facebot|preview|uptime|monitor|playwright|headlesschrome/i.test(userAgent);
}

export function parseDevice(userAgent: string) {
  const device = /tablet|ipad/i.test(userAgent) ? "tablet" : /mobile|android|iphone/i.test(userAgent) ? "mobile" : "desktop";
  const browser = /edg\//i.test(userAgent) ? "Edge" : /opr\//i.test(userAgent) ? "Opera"
    : /firefox\//i.test(userAgent) ? "Firefox" : /chrome\//i.test(userAgent) ? "Chrome"
      : /safari\//i.test(userAgent) ? "Safari" : "Other";
  const os = /windows/i.test(userAgent) ? "Windows" : /android/i.test(userAgent) ? "Android"
    : /iphone|ipad|ios/i.test(userAgent) ? "iOS" : /mac os|macintosh/i.test(userAgent) ? "macOS"
      : /linux/i.test(userAgent) ? "Linux" : "Other";
  return { device, browser, os };
}

export function attribution(input: z.infer<typeof analyticsPayloadSchema>["attribution"]) {
  const source = input?.utm_source?.toLowerCase();
  const medium = input?.utm_medium?.toLowerCase();
  if (source || medium) return {
    source: source || "campaign",
    medium: medium || "campaign",
    campaign: input?.utm_campaign || null,
    term: input?.utm_term || null,
    content: input?.utm_content || null,
  };
  if (input?.gclid) return { source: "google", medium: "cpc", campaign: null, term: null, content: null };
  if (input?.fbclid) return { source: "facebook", medium: "social", campaign: null, term: null, content: null };
  const host = (input?.referrer_host || "").toLowerCase().replace(/^www\./, "");
  if (!host || host === "mdftungphat.com" || host.endsWith(".mdftungphat.com")) {
    return { source: "direct", medium: "none", campaign: null, term: null, content: null };
  }
  if (/(^|\.)google\.[a-z.]+$/.test(host)) return { source: "google", medium: "organic", campaign: null, term: null, content: null };
  if (/(^|\.)(facebook|fb|instagram)\.com$/.test(host)) return { source: "facebook", medium: "social", campaign: null, term: null, content: null };
  if (/(^|\.)zalo\.(me|com)$/.test(host)) return { source: "zalo", medium: "social", campaign: null, term: null, content: null };
  if (host.includes("maps") && host.includes("google")) return { source: "google_maps", medium: "referral", campaign: null, term: null, content: null };
  return { source: host.slice(0, 120), medium: "referral", campaign: null, term: null, content: null };
}
