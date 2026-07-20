export const analyticsEventNames = [
  "page_view",
  "article_view",
  "article_engaged",
  "product_view",
  "scroll_depth",
  "engagement_time",
  "click_phone",
  "click_zalo",
  "click_email",
  "click_maps",
  "click_catalogue",
  "click_quote",
  "form_start",
  "form_submit",
] as const;

export type FirstPartyAnalyticsEvent = (typeof analyticsEventNames)[number];

export const ctaLocations = [
  "header",
  "hero",
  "floating_button",
  "mobile_bottom_bar",
  "homepage_section",
  "product_card",
  "product_detail",
  "article_inline",
  "article_footer",
  "contact_page",
  "footer",
  "catalogue_section",
  "unknown",
] as const;

export type CtaLocation = (typeof ctaLocations)[number];

export type AnalyticsProperties = {
  path?: string;
  page_title?: string;
  content_type?: "article" | "product" | "service" | "project" | "catalogue" | "page";
  content_id?: string;
  content_title?: string;
  content_category?: string;
  cta_location?: CtaLocation;
  target_type?: "phone" | "zalo" | "email" | "maps" | "catalogue" | "quote" | "form";
  scroll_percent?: 25 | 50 | 75 | 90;
  engagement_seconds?: number;
};

export type LegacyAnalyticsEvent =
  | FirstPartyAnalyticsEvent
  | "request_quote"
  | "submit_quote_form"
  | "submit_contact_form"
  | "view_contact_page"
  | "view_product"
  | "view_project"
  | "view_cnc_service"
  | "view_product_category"
  | "click_directions";

export type LegacyEventProperties = Record<string, string | number | boolean | undefined>;

export type AnalyticsPayload = AnalyticsProperties & {
  event_id: string;
  visitor_id: string;
  session_id: string;
  event_name: FirstPartyAnalyticsEvent;
  occurred_at: number;
  attribution?: {
    referrer_host?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_term?: string;
    utm_content?: string;
    gclid?: string;
    fbclid?: string;
  };
};
