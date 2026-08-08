"use client";

import { attributionParameters } from "./attribution";
import {
  analyticsOptedOut,
  generateAnonymousId,
  getAnalyticsIdentity,
} from "./session";
import { sanitizePath, sanitizeText, shouldTrackLocation } from "./sanitize";
import type {
  AnalyticsPayload,
  AnalyticsProperties,
  FirstPartyAnalyticsEvent,
} from "./types";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    __TP_ANALYTICS_TEST_MODE__?: boolean;
    __TP_PREVIEW__?: boolean;
  }
}

const API_BASE = (
  process.env.NEXT_PUBLIC_ANALYTICS_API_BASE || "https://cms.mdftungphat.com"
).replace(/\/+$/, "");
const TEST_BUILD = process.env.NEXT_PUBLIC_ANALYTICS_TEST_MODE === "1";

function sessionAttribution() {
  const cached = sessionStorage.getItem("tp_session_attribution");
  if (cached) {
    try {
      return JSON.parse(cached) as AnalyticsPayload["attribution"];
    } catch {
      /* recreate */
    }
  }
  const value = attributionParameters(
    new URL(window.location.href),
    document.referrer,
  );
  sessionStorage.setItem("tp_session_attribution", JSON.stringify(value));
  return value;
}

function buildPayload(
  eventName: FirstPartyAnalyticsEvent,
  properties: AnalyticsProperties,
): AnalyticsPayload | null {
  const testMode = TEST_BUILD && window.__TP_ANALYTICS_TEST_MODE__ === true;
  if (
    window.__TP_PREVIEW__ === true ||
    location.pathname.startsWith("/cms-preview") ||
    analyticsOptedOut() ||
    (!testMode &&
      (navigator.webdriver ||
        !shouldTrackLocation(location.hostname, location.pathname)))
  )
    return null;
  const { visitorId, sessionId } = getAnalyticsIdentity();
  return {
    event_id: generateAnonymousId(),
    visitor_id: visitorId,
    session_id: sessionId,
    event_name: eventName,
    occurred_at: Math.floor(Date.now() / 1000),
    path: sanitizePath(properties.path || location.pathname),
    page_title: sanitizeText(properties.page_title || document.title, 160),
    content_type: properties.content_type,
    content_id: sanitizeText(properties.content_id, 160),
    content_title: sanitizeText(properties.content_title, 180),
    content_category: sanitizeText(properties.content_category, 120),
    cta_location: properties.cta_location,
    target_type: properties.target_type,
    scroll_percent: properties.scroll_percent,
    engagement_seconds: properties.engagement_seconds,
    attribution: sessionAttribution(),
  };
}

function sendFirstParty(payload: AnalyticsPayload, preferBeacon = false) {
  const body = JSON.stringify(payload);
  if (preferBeacon && navigator.sendBeacon) {
    const blob = new Blob([body], { type: "application/json" });
    if (navigator.sendBeacon(`${API_BASE}/api/analytics/track`, blob)) return;
  }
  void fetch(`${API_BASE}/api/analytics/track`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body,
    keepalive: true,
    credentials: "omit",
  }).catch(() => undefined);
}

export function sendGa4Event(eventName: string, properties: Record<string, unknown>) {
  const args: ["event", string, Record<string, unknown>] = ["event", eventName, properties];
  if (typeof window.gtag === "function") window.gtag(...args);
  else {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(args);
  }
}

export function sendAnalyticsEvent(
  eventName: FirstPartyAnalyticsEvent,
  properties: AnalyticsProperties = {},
  options: { beacon?: boolean; ga4?: boolean } = {},
) {
  const payload = buildPayload(eventName, properties);
  if (!payload) return;
  const dispatch = () => sendFirstParty(payload, options.beacon);
  if (options.beacon) dispatch();
  else if (typeof window.requestIdleCallback === "function")
    window.requestIdleCallback(dispatch, { timeout: 1200 });
  else globalThis.setTimeout(dispatch, 0);

  if (options.ga4 !== false) {
    sendGa4Event(eventName, {
      page_path: payload.path,
      content_type: payload.content_type,
      content_id: payload.content_id,
      content_title: payload.content_title,
      content_category: payload.content_category,
      cta_location: payload.cta_location,
      target_type: payload.target_type,
      scroll_percent: payload.scroll_percent,
      engagement_seconds: payload.engagement_seconds,
    });
  }
}
