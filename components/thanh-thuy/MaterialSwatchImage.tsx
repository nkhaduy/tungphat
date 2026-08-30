"use client";

import { useState } from "react";
import { resolveMediaSrcSet, resolveMediaUrl } from "@/lib/media";

type MaterialSwatchImageProps = {
  src: string;
  srcSet?: string;
  alt: string;
  width?: number;
  height?: number;
  sizes?: string;
  className?: string;
  priority?: boolean;
};

export function MaterialSwatchImage({
  src,
  srcSet,
  alt,
  width = 800,
  height = 450,
  sizes = "(max-width: 768px) 100vw, 33vw",
  className = "object-cover",
  priority = false,
}: MaterialSwatchImageProps) {
  const [failed, setFailed] = useState(false);
  return (
    // The importer provides its own content-hashed responsive derivatives.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={failed ? "/images/wood-panels.webp" : resolveMediaUrl(src)}
      srcSet={failed ? undefined : resolveMediaSrcSet(srcSet)}
      alt={alt}
      width={failed ? 800 : width}
      height={failed ? 600 : height}
      sizes={sizes}
      onError={() => setFailed(true)}
      className={className}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
    />
  );
}
