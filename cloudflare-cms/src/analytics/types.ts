export const eventNames = [
  "page_view", "article_view", "article_engaged", "product_view", "scroll_depth",
  "engagement_time", "click_phone", "click_zalo", "click_email", "click_maps",
  "click_catalogue", "click_quote", "form_start", "form_submit",
] as const;

export const ctaLocations = [
  "header", "hero", "floating_button", "mobile_bottom_bar", "homepage_section",
  "product_card", "product_detail", "article_inline", "article_footer",
  "contact_page", "footer", "catalogue_section", "unknown",
] as const;

export type AnalyticsEnv = {
  DB: D1Database;
  ENVIRONMENT: string;
  CORS_ALLOWED_ORIGINS: string;
  CORS_ALLOWED_ORIGIN_SUFFIXES?: string;
  IP_HASH_SALT: string;
  ANALYTICS_HASH_SALT?: string;
  CMS_ALLOWED_ORIGINS: string;
  CMS_SESSION_SECRET: string;
  GA4_PROPERTY_ID?: string;
  GOOGLE_SERVICE_ACCOUNT_EMAIL?: string;
  GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?: string;
  SEARCH_CONSOLE_SITE_URL?: string;
};
