"use client";

import { useState } from "react";
import imageIndex from "@/data/product-image-index.json";
import { MaterialImage } from "@/components/products/MaterialImage";

export function MaterialGallery({ slug }: { slug: string }) {
  const entry = imageIndex[slug as keyof typeof imageIndex];
  const images = entry?.image ? [entry, ...entry.gallery.filter((item) => item.image)] : [];
  const [selected, setSelected] = useState(0);
  if (!images.length) return null;
  const current = images[selected];
  return <div>
    <figure className="relative aspect-[4/3] overflow-hidden rounded-xl bg-white">
      <MaterialImage src={current.image} alt={current.alt} sizes="(max-width: 1023px) 100vw, 46vw" priority={selected === 0} className="p-4 sm:p-6" />
    </figure>
    {images.length > 1 ? <div role="group" aria-label="Chọn ảnh vật liệu" className="mt-3 flex gap-3">{images.map((image, index) => <button key={image.image} type="button" aria-label={`Xem ảnh ${index + 1}: ${image.alt}`} aria-pressed={selected === index} onClick={() => setSelected(index)} className={`relative h-16 w-20 overflow-hidden rounded border-2 bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-900 ${selected === index ? "border-forest-900" : "border-transparent"}`}><MaterialImage src={image.image} alt="" sizes="80px" className="p-1" /></button>)}</div> : null}
  </div>;
}
