"use client";

import { useEffect } from "react";
import { sendAnalyticsEvent } from "@/lib/analytics/client";
import { recordMilestone } from "@/lib/analytics/metrics";

type Props = {
  contentType: "article" | "product";
  contentId: string;
  contentTitle: string;
  contentCategory?: string;
  selector?: string;
};

export function ContentEngagementTracker({
  contentType,
  contentId,
  contentTitle,
  contentCategory,
  selector = "[data-analytics-content]",
}: Props) {
  useEffect(() => {
    const base = {
      content_type: contentType,
      content_id: contentId,
      content_title: contentTitle,
      content_category: contentCategory,
    } as const;
    sendAnalyticsEvent(contentType === "article" ? "article_view" : "product_view", base);

    const milestones = new Set<number>();
    let articleEngaged = false;
    let visibleStartedAt = document.visibilityState === "visible" ? performance.now() : 0;
    let visibleMs = 0;
    let lastSentSeconds = 0;

    const visibleSeconds = () => Math.floor((visibleMs + (visibleStartedAt ? performance.now() - visibleStartedAt : 0)) / 1000);
    const sendEngagement = (beacon = false) => {
      const seconds = visibleSeconds();
      const delta = seconds - lastSentSeconds;
      if (delta < 5) return;
      lastSentSeconds = seconds;
      sendAnalyticsEvent("engagement_time", { ...base, engagement_seconds: delta }, { beacon });
    };
    const markArticleEngaged = () => {
      if (contentType !== "article" || articleEngaged) return;
      articleEngaged = true;
      sendAnalyticsEvent("article_engaged", base);
    };
    const onScroll = () => {
      const target = document.querySelector(selector) as HTMLElement | null;
      if (!target) return;
      const rect = target.getBoundingClientRect();
      const total = Math.max(target.scrollHeight, rect.height, 1);
      const progressed = Math.max(0, Math.min(100, ((window.innerHeight - rect.top) / total) * 100));
      for (const milestone of [25, 50, 75, 90] as const) {
        if (progressed >= milestone && recordMilestone(milestones, milestone)) {
          sendAnalyticsEvent("scroll_depth", { ...base, scroll_percent: milestone });
          if (milestone >= 50) markArticleEngaged();
        }
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        if (visibleStartedAt) visibleMs += performance.now() - visibleStartedAt;
        visibleStartedAt = 0;
        sendEngagement(true);
      } else {
        visibleStartedAt = performance.now();
      }
    };
    const engagedTimer = window.setInterval(() => {
      if (visibleSeconds() >= 30) {
        markArticleEngaged();
        window.clearInterval(engagedTimer);
      }
    }, 1000);
    const onPageHide = () => sendEngagement(true);

    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);
    onScroll();
    return () => {
      window.clearInterval(engagedTimer);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
      sendEngagement(true);
    };
  }, [contentCategory, contentId, contentTitle, contentType, selector]);

  return null;
}
