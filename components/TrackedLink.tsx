"use client";

import type { AnchorHTMLAttributes, ReactNode } from "react";
import { trackEvent, type AnalyticsEvent } from "@/lib/analytics";

type TrackedLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  eventName: AnalyticsEvent;
  eventProperties?: Record<string, string | number | boolean | undefined>;
  children: ReactNode;
};

export function TrackedLink({ eventName, eventProperties, onClick, children, ...props }: TrackedLinkProps) {
  const location = typeof eventProperties?.location === "string"
    ? eventProperties.location
    : typeof eventProperties?.cta_location === "string" ? eventProperties.cta_location : "unknown";
  return (
    <a
      {...props}
      data-analytics-handled="1"
      data-track-event={eventName}
      data-track-location={location}
      onClick={(event) => {
        const href = typeof props.href === "string" ? props.href : "";
        const enhanced = eventName === "request_quote" && /zalo\.(me|com)/i.test(href)
          ? { ...eventProperties, channel: "zalo" }
          : eventProperties;
        trackEvent(eventName, enhanced);
        onClick?.(event);
      }}
    >
      {children}
    </a>
  );
}
