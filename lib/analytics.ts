import { sendAnalyticsEvent } from "@/lib/analytics/client";
import { normalizeCtaLocation } from "@/lib/analytics/sanitize";
import type {
  AnalyticsProperties,
  FirstPartyAnalyticsEvent,
  LegacyAnalyticsEvent,
  LegacyEventProperties,
} from "@/lib/analytics/types";

export type AnalyticsEvent = LegacyAnalyticsEvent;

const directEvents = new Set<FirstPartyAnalyticsEvent>([
  "page_view", "article_view", "article_engaged", "product_view", "scroll_depth",
  "engagement_time", "click_phone", "click_zalo", "click_email", "click_maps",
  "click_catalogue", "click_quote", "form_start", "form_submit",
]);

function propertiesFor(event: FirstPartyAnalyticsEvent, properties: LegacyEventProperties): AnalyticsProperties {
  return {
    path: typeof properties.path === "string" ? properties.path : undefined,
    page_title: typeof properties.page_title === "string" ? properties.page_title : undefined,
    content_type: typeof properties.content_type === "string"
      ? properties.content_type as AnalyticsProperties["content_type"]
      : undefined,
    content_id: typeof properties.content_id === "string"
      ? properties.content_id
      : typeof properties.content_type === "string" ? properties.content_type : undefined,
    content_title: typeof properties.content_title === "string" ? properties.content_title : undefined,
    content_category: typeof properties.content_category === "string" ? properties.content_category : undefined,
    cta_location: normalizeCtaLocation(properties.cta_location ?? properties.location),
    target_type: event === "click_phone" ? "phone"
      : event === "click_zalo" ? "zalo"
        : event === "click_email" ? "email"
          : event === "click_maps" ? "maps"
            : event === "click_catalogue" ? "catalogue"
              : event === "click_quote" ? "quote"
                : event.startsWith("form_") ? "form" : undefined,
    scroll_percent: typeof properties.scroll_percent === "number"
      ? properties.scroll_percent as AnalyticsProperties["scroll_percent"] : undefined,
    engagement_seconds: typeof properties.engagement_seconds === "number"
      ? properties.engagement_seconds : undefined,
  };
}

export function trackEvent(event: AnalyticsEvent, properties: LegacyEventProperties = {}) {
  if (typeof window === "undefined") return;
  if (directEvents.has(event as FirstPartyAnalyticsEvent)) {
    const direct = event as FirstPartyAnalyticsEvent;
    sendAnalyticsEvent(direct, propertiesFor(direct, properties));
    return;
  }
  if (event === "request_quote") {
    const quote = propertiesFor("click_quote", properties);
    sendAnalyticsEvent("click_quote", quote);
    if (properties.channel === "zalo") sendAnalyticsEvent("click_zalo", { ...quote, target_type: "zalo" });
    return;
  }
  if (event === "submit_quote_form" || event === "submit_contact_form") {
    sendAnalyticsEvent("form_submit", propertiesFor("form_submit", properties));
    return;
  }
  if (event === "view_product") {
    sendAnalyticsEvent("product_view", {
      ...propertiesFor("product_view", properties),
      content_type: "product",
    });
    return;
  }
  if (event === "click_directions") {
    sendAnalyticsEvent("click_maps", propertiesFor("click_maps", properties));
    return;
  }
  // Preserve existing GA4-only informational events without adding them to the
  // first-party allowlist or duplicating page views.
  window.gtag?.("event", event, Object.fromEntries(
    Object.entries(properties).filter(([, value]) => value !== undefined),
  ));
}

export type { AnalyticsProperties, FirstPartyAnalyticsEvent };
