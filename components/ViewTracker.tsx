"use client";

import { useEffect } from "react";
import { trackEvent, type AnalyticsEvent } from "@/lib/analytics";

export function ViewTracker({ event, contentType }: { event: AnalyticsEvent; contentType: string }) {
  useEffect(() => {
    trackEvent(event, { content_type: contentType });
  }, [event, contentType]);
  return null;
}
