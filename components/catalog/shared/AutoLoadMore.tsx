"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type AutoLoadMoreProps = {
  hasMore: boolean;
  onLoadMore: () => void;
  remaining: number;
  pageSize: number;
};

const LOAD_DELAY_MS = 300;
const REDUCED_MOTION_DELAY_MS = 150;

export function AutoLoadMore({
  hasMore,
  onLoadMore,
  remaining,
  pageSize,
}: AutoLoadMoreProps) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<number | null>(null);
  const loadingRef = useRef(false);
  const onLoadMoreRef = useRef(onLoadMore);
  const [isLoading, setIsLoading] = useState(false);
  const [observerSupported, setObserverSupported] = useState<boolean | null>(null);

  useEffect(() => {
    onLoadMoreRef.current = onLoadMore;
  }, [onLoadMore]);

  const requestLoadMore = useCallback(() => {
    if (!hasMore || loadingRef.current) return;

    loadingRef.current = true;
    setIsLoading(true);
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const delay = prefersReducedMotion
      ? REDUCED_MOTION_DELAY_MS
      : LOAD_DELAY_MS;

    timerRef.current = window.setTimeout(() => {
      onLoadMoreRef.current();
      loadingRef.current = false;
      setIsLoading(false);
      timerRef.current = null;
    }, delay);
  }, [hasMore]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const supported = typeof window.IntersectionObserver === "function";
    setObserverSupported(supported);
    if (!supported || !hasMore || isLoading || !sentinelRef.current) return;

    const observer = new window.IntersectionObserver(
      (observerEntries) => {
        if (observerEntries.some((entry) => entry.isIntersecting)) {
          requestLoadMore();
        }
      },
      { rootMargin: "700px 0px" },
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, isLoading, requestLoadMore]);

  useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    },
    [],
  );

  if (!hasMore) return null;

  return (
    <div className="mt-6">
      <div
        ref={sentinelRef}
        data-testid="catalogue-load-sentinel"
        className="h-px w-full"
        aria-hidden="true"
      />
      <p
        role="status"
        aria-live="polite"
        className={isLoading ? "mx-auto mt-2 text-center text-sm font-bold text-forest-900" : "sr-only"}
      >
        {isLoading ? "Đang tải thêm mã màu" : ""}
      </p>
      {isLoading ? (
        <div
          aria-hidden="true"
          className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3"
        >
          {["a", "b", "c"].map((key) => (
            <div
              key={key}
              className="h-16 animate-pulse border border-forest-900/10 bg-[#eef1ed] motion-reduce:animate-none"
            />
          ))}
        </div>
      ) : null}
      <button
        type="button"
        onClick={requestLoadMore}
        className={
          observerSupported === false
            ? "pressable mx-auto mt-4 flex min-h-12 items-center justify-center border border-forest-900/20 bg-white px-6 text-sm font-extrabold text-forest-950"
            : "sr-only focus:not-sr-only focus-visible:ring-2 focus-visible:ring-wood-500"
        }
      >
        Tải thêm {Math.min(pageSize, remaining)} mã
      </button>
    </div>
  );
}
