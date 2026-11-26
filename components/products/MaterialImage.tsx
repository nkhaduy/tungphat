import imageIndex from "@/data/product-image-index.json";

const images = Object.values(imageIndex).flatMap((image) => [image, ...image.gallery]);

/** Native srcset is intentional: static export has no Next image optimizer.
 * Width descriptors are actual file widths; no source is enlarged or hotlinked. */
export function MaterialImage({ src, alt, sizes, priority = false, className = "" }: { src: string; alt: string; sizes: string; priority?: boolean; className?: string }) {
  if (!src) return null;
  const image = images.find((item) => item.image === src);
  return (
    // eslint-disable-next-line @next/next/no-img-element -- precomputed local responsive WebPs for static export
    <img src={src} srcSet={image?.srcSet || undefined} sizes={sizes} width={image?.width} height={image?.height} alt={alt} loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : "auto"} decoding="async" className={`absolute inset-0 h-full w-full object-contain ${className}`} />
  );
}
