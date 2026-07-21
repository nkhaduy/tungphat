"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { sendAnalyticsEvent } from "@/lib/analytics/client";
import { normalizeCtaLocation } from "@/lib/analytics/sanitize";
import type { FirstPartyAnalyticsEvent } from "@/lib/analytics/types";

let lastPagePath = "";

function inferLocation(element: Element) {
  const explicit = element.getAttribute("data-track-location");
  if (explicit) return normalizeCtaLocation(explicit);
  if (element.closest("header")) return normalizeCtaLocation("header");
  if (element.closest("footer")) return normalizeCtaLocation("footer");
  if (location.pathname === "/lien-he/" || location.pathname === "/lien-he") return normalizeCtaLocation("contact_page");
  if (element.closest("article")) return normalizeCtaLocation("article_inline");
  return normalizeCtaLocation("unknown");
}

function classifyAnchor(anchor: HTMLAnchorElement): FirstPartyAnalyticsEvent | null {
  const explicit = anchor.dataset.trackEvent as FirstPartyAnalyticsEvent | undefined;
  if (explicit) return explicit;
  const href = anchor.href.toLowerCase();
  const text = `${anchor.textContent || ""} ${anchor.getAttribute("aria-label") || ""}`.toLowerCase();
  if (href.startsWith("tel:")) return "click_phone";
  if (href.startsWith("mailto:")) return "click_email";
  if (href.includes("zalo.me") || href.includes("zalo.com")) return "click_zalo";
  if (href.includes("google.com/maps") || href.includes("maps.app.goo.gl")) return "click_maps";
  if (href.endsWith(".pdf") || href.includes("catalogue") || text.includes("catalogue")) return "click_catalogue";
  if (text.includes("báo giá") || text.includes("bao gia")) return "click_quote";
  return null;
}

export function AnalyticsProvider() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith("/cms-preview") || pathname === lastPagePath) return;
    lastPagePath = pathname;
    sendAnalyticsEvent("page_view", { path: pathname, page_title: document.title });
  }, [pathname]);

  useEffect(() => {
    if (pathname?.startsWith("/cms-preview")) return;
    const startedForms = new WeakSet<HTMLFormElement>();
    const onClick = (event: MouseEvent) => {
      const anchor = event.target instanceof Element ? event.target.closest("a") : null;
      if (!(anchor instanceof HTMLAnchorElement) || anchor.dataset.analyticsHandled === "1") return;
      const eventName = classifyAnchor(anchor);
      if (!eventName) return;
      sendAnalyticsEvent(eventName, {
        cta_location: inferLocation(anchor),
        target_type: eventName === "click_phone" ? "phone"
          : eventName === "click_email" ? "email"
            : eventName === "click_zalo" ? "zalo"
              : eventName === "click_maps" ? "maps"
                : eventName === "click_catalogue" ? "catalogue" : "quote",
      });
    };
    const onFocus = (event: FocusEvent) => {
      const form = event.target instanceof Element ? event.target.closest("form") : null;
      if (!(form instanceof HTMLFormElement) || startedForms.has(form)) return;
      startedForms.add(form);
      sendAnalyticsEvent("form_start", {
        cta_location: inferLocation(form),
        target_type: "form",
      });
    };
    document.addEventListener("click", onClick, true);
    document.addEventListener("focusin", onFocus, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("focusin", onFocus, true);
    };
  }, [pathname]);

  return null;
}
