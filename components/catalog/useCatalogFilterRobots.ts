"use client";

import { useEffect } from "react";
import { catalogRobotsContent } from "@/lib/catalog/url-state";

const selector = 'meta[name="robots"][data-catalogue-filter-state="true"]';

export function useCatalogFilterRobots(active: boolean) {
  useEffect(() => {
    const content = catalogRobotsContent(active);
    let robots = document.head.querySelector<HTMLMetaElement>(selector);
    if (content) {
      if (!robots) {
        robots = document.createElement("meta");
        robots.name = "robots";
        robots.dataset.catalogueFilterState = "true";
        document.head.appendChild(robots);
      }
      robots.content = content;
    } else {
      robots?.remove();
    }
    return () => document.head.querySelector(selector)?.remove();
  }, [active]);
}
