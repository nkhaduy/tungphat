"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

/** Keep below-fold imagery off the network until it reaches the viewport. */
export function CatalogueDeferredImage({ src, alt, sizes, className }: { src: string; alt: string; sizes: string; className: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const target = ref.current;
    if (!target) return;
    if (typeof IntersectionObserver === "undefined") {
      const timer = globalThis.setTimeout(() => setVisible(true), 0);
      return () => globalThis.clearTimeout(timer);
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) { setVisible(true); observer.disconnect(); }
    });
    observer.observe(target);
    return () => observer.disconnect();
  }, []);
  return <span ref={ref} data-catalogue-deferred-image className="absolute inset-0">{visible && <Image src={src} alt={alt} fill sizes={sizes} className={className} />}<noscript><Image src={src} alt={alt} fill sizes={sizes} className={className} /></noscript></span>;
}
