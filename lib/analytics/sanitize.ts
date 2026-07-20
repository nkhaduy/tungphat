import type { CtaLocation } from "./types";

const CTA_LOCATION_SET = new Set<CtaLocation>([
  "header", "hero", "floating_button", "mobile_bottom_bar", "homepage_section",
  "product_card", "product_detail", "article_inline", "article_footer",
  "contact_page", "footer", "catalogue_section", "unknown",
]);

export function sanitizePath(raw: string) {
  try {
    const url = new URL(raw, "https://mdftungphat.com");
    const path = url.pathname.replace(/\/{2,}/g, "/");
    return (path.startsWith("/") ? path : `/${path}`).slice(0, 500);
  } catch {
    return "/";
  }
}

export function sanitizeText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return undefined;
  const clean = value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
  return clean ? clean.slice(0, maxLength) : undefined;
}

export function normalizeCtaLocation(value: unknown): CtaLocation {
  if (typeof value !== "string") return "unknown";
  if (CTA_LOCATION_SET.has(value as CtaLocation)) return value as CtaLocation;
  const lower = value.toLowerCase();
  if (lower.includes("header") || lower.includes("menu")) return lower.includes("mobile") ? "mobile_bottom_bar" : "header";
  if (lower.includes("hero")) return "hero";
  if (lower.includes("floating")) return "floating_button";
  if (lower.includes("product_card") || lower.includes("categor")) return "product_card";
  if (lower.includes("product") || lower.includes("spec")) return "product_detail";
  if (lower.includes("article_footer")) return "article_footer";
  if (lower.includes("article")) return "article_inline";
  if (lower.includes("contact") || lower.includes("branch") || /^cn\d+$/i.test(value)) return "contact_page";
  if (lower.includes("footer")) return "footer";
  if (lower.includes("catalog")) return "catalogue_section";
  if (lower.includes("home")) return "homepage_section";
  return "unknown";
}

export function shouldTrackLocation(hostname: string, pathname: string) {
  const host = hostname.toLowerCase();
  if (!host || host === "localhost" || host === "127.0.0.1" || host.endsWith(".local")) return false;
  if (host.endsWith(".vercel.app") || host.endsWith(".pages.dev")) return false;
  const path = sanitizePath(pathname);
  return !path.startsWith("/admin") && !path.startsWith("/analytics") && !path.includes("/preview");
}
