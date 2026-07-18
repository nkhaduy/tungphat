export type AnalyticsEvent =
  | "click_phone"
  | "click_zalo"
  | "request_quote"
  | "submit_quote_form"
  | "submit_contact_form"
  | "view_contact_page"
  | "view_product"
  | "view_project"
  | "view_cnc_service"
  | "view_product_category"
  | "click_directions";

type EventProperties = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackEvent(event: AnalyticsEvent, properties: EventProperties = {}) {
  if (typeof window === "undefined") return;

  const cleanProperties = Object.fromEntries(
    Object.entries(properties).filter(([, value]) => value !== undefined)
  );

  window.gtag?.("event", event, cleanProperties);
}
