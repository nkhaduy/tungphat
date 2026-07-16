"use client";

import { useEffect, useRef, useState } from "react";

const TRUSTINDEX_SCRIPT_ID = "trustindex-widget-loader";
const LOAD_TIMEOUT_MS = 15_000;

type WidgetStatus = "idle" | "loading" | "loaded" | "error";

function getTrustindexWidgetUrl(widgetId: string) {
  return `https://cdn.trustindex.io/loader.js?${widgetId}`;
}

export function TrustindexReviews() {
  const hostRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<HTMLDivElement>(null);
  const teardownTimerRef = useRef<number | null>(null);
  const [status, setStatus] = useState<WidgetStatus>("idle");
  const widgetId = process.env.NEXT_PUBLIC_TRUSTINDEX_WIDGET_ID?.trim() ?? "";
  const isTrustindexEnabled =
    process.env.NEXT_PUBLIC_REVIEWS_PROVIDER?.trim().toLowerCase() === "trustindex" &&
    Boolean(widgetId);

  useEffect(() => {
    const host = hostRef.current;
    const widget = widgetRef.current;

    if (!host || !widget) {
      return;
    }

    if (!isTrustindexEnabled) {
      setStatus("error");
      return;
    }

    if (teardownTimerRef.current !== null) {
      window.clearTimeout(teardownTimerRef.current);
      teardownTimerRef.current = null;
    }

    let disposed = false;
    let started = false;
    let timeoutId: number | null = null;
    let intersectionObserver: IntersectionObserver | null = null;
    let mutationObserver: MutationObserver | null = null;
    let script: HTMLScriptElement | null = null;

    const cleanupListeners = () => {
      script?.removeEventListener("error", handleScriptError);
    };

    const setLoaded = () => {
      if (disposed) return;

      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
        timeoutId = null;
      }

      mutationObserver?.disconnect();
      setStatus("loaded");
    };

    const hasRenderedWidget = () =>
      Array.from(widget.children).some((child) => child.tagName !== "SCRIPT");

    const handleScriptError = () => {
      if (disposed) return;

      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
        timeoutId = null;
      }

      mutationObserver?.disconnect();
      setStatus("error");
    };

    const loadWidget = () => {
      if (started || disposed) return;
      started = true;
      setStatus("loading");

      mutationObserver = new MutationObserver(() => {
        if (hasRenderedWidget()) {
          setLoaded();
        }
      });
      mutationObserver.observe(widget, { childList: true, subtree: true });

      const existingScript = document.getElementById(TRUSTINDEX_SCRIPT_ID);
      if (existingScript && !widget.contains(existingScript)) {
        existingScript.remove();
      }

      script = widget.querySelector<HTMLScriptElement>(`#${TRUSTINDEX_SCRIPT_ID}`);
      if (!script) {
        script = document.createElement("script");
        script.id = TRUSTINDEX_SCRIPT_ID;
        script.src = getTrustindexWidgetUrl(widgetId);
        script.async = true;
        script.defer = true;
        widget.appendChild(script);
      }

      script.addEventListener("error", handleScriptError, { once: true });

      if (hasRenderedWidget()) {
        setLoaded();
        return;
      }

      timeoutId = window.setTimeout(handleScriptError, LOAD_TIMEOUT_MS);
    };

    intersectionObserver = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          intersectionObserver?.disconnect();
          loadWidget();
        }
      },
      { rootMargin: "400px 0px" }
    );
    intersectionObserver.observe(host);

    return () => {
      disposed = true;
      intersectionObserver?.disconnect();
      mutationObserver?.disconnect();
      cleanupListeners();

      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }

      // React Strict Mode immediately mounts the effect again in development.
      // Delaying teardown preserves the single widget instance in that cycle.
      teardownTimerRef.current = window.setTimeout(() => {
        widget.replaceChildren();
        teardownTimerRef.current = null;
      }, 0);
    };
  }, [isTrustindexEnabled, widgetId]);

  const showLoading = status === "idle" || status === "loading";

  return (
    <div ref={hostRef} className="min-w-0" aria-busy={showLoading}>
      {showLoading && (
        <div className="grid min-h-48 place-items-center border border-forest-900/10 bg-white px-6 text-center text-sm font-semibold text-slate-500">
          Đang tải đánh giá từ Google...
        </div>
      )}
      {status === "error" && (
        <p role="status" className="py-8 text-center text-sm font-semibold text-slate-500">
          Chưa thể tải đánh giá lúc này.
        </p>
      )}
      <div
        ref={widgetRef}
        className="min-w-0 max-w-full"
        aria-label="Đánh giá khách hàng Tùng Phát trên Google"
      />
    </div>
  );
}
