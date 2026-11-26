"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

/** Keep below-fold imagery off the network until it reaches the viewport. */
export function CatalogueDeferredImage({ src, alt, sizes, className, fallbackLabel, eager = false, priority = false }: { src: string; alt: string; sizes: string; className: string; fallbackLabel?: string; eager?: boolean; priority?: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(eager);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (eager) return;
    const target = ref.current;
    if (!target) return;
    if (typeof IntersectionObserver === "undefined") {
      const timer = globalThis.setTimeout(() => setVisible(true), 0);
      return () => globalThis.clearTimeout(timer);
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) { setVisible(true); observer.disconnect(); }
    }, { rootMargin: "300px 0px" });
    observer.observe(target);
    return () => observer.disconnect();
  }, [eager]);
  return <span ref={ref} data-catalogue-deferred-image className="absolute inset-0">
    {visible && !failed ? <Image src={src} alt={alt} fill priority={priority} fetchPriority={priority ? "high" : "auto"} sizes={sizes} className={className} onError={() => setFailed(true)} /> : null}
    {failed && fallbackLabel ? <span role="img" aria-label={fallbackLabel} className="grid h-full place-items-center px-3 text-center text-xs font-medium text-slate-600">{fallbackLabel}</span> : null}
    <noscript><Image src={src} alt={alt} fill sizes={sizes} className={className} /></noscript>
  </span>;
}
