"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
type GalleryImage = {
  src: string;
  thumbnailSrc?: string;
  originalUrl?: string;
  alt: string;
};

export function SupplierMediaGallery({ images }: { images: GalleryImage[] }) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const touchStart = useRef<number | null>(null);
  const current = images[index];
  const move = useCallback((delta: number) => {
    setIndex((value) => (value + delta + images.length) % images.length);
  }, [images.length]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
      if (event.key === "ArrowLeft" && images.length > 1) move(-1);
      if (event.key === "ArrowRight" && images.length > 1) move(1);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [images.length, move, open]);

  useEffect(() => {
    if (!open || images.length < 2) return;
    const adjacent = images[(index + 1) % images.length]?.originalUrl;
    if (adjacent) new window.Image().src = adjacent;
  }, [images, index, open]);

  if (!images.length) return <div className="grid aspect-[1.55/1] place-items-center border border-forest-900/12 bg-[#eef1ed] text-sm font-bold text-slate-500">Ảnh đang cập nhật</div>;

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label={`Mở thư viện ${images.length} ảnh`} className="group relative block aspect-[1.55/1] w-full overflow-hidden border border-forest-900/12 bg-[#eef1ed] focus-visible:ring-2 focus-visible:ring-wood-500">
        <Image src={images[0].thumbnailSrc || images[0].src} alt={images[0].alt} fill priority sizes="(max-width: 1024px) 100vw, 48vw" className="object-cover transition-transform duration-300 group-hover:scale-[1.015] motion-reduce:transition-none" />
        <span className="absolute bottom-3 right-3 bg-forest-950/90 px-3 py-2 text-xs font-extrabold text-white">Mở thư viện {images.length} ảnh</span>
      </button>
      {open && current ? (
        <div role="dialog" aria-modal="true" aria-label={`Thư viện ảnh, ${index + 1} trên ${images.length}`} className="fixed inset-0 z-[1000] flex flex-col bg-black/95 p-3 backdrop-blur-sm sm:p-6" onClick={() => setOpen(false)} onTouchStart={(event) => { touchStart.current = event.touches[0]?.clientX ?? null; }} onTouchEnd={(event) => {
          const start = touchStart.current;
          const end = event.changedTouches[0]?.clientX;
          touchStart.current = null;
          if (start == null || end == null || Math.abs(end - start) < 50 || images.length < 2) return;
          move(end < start ? 1 : -1);
        }}>
          <button type="button" aria-label="Đóng thư viện" onClick={() => setOpen(false)} className="absolute right-3 top-3 z-20 grid min-h-11 min-w-11 place-items-center rounded-full bg-white text-forest-950 shadow-lg transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wood-400 sm:right-6 sm:top-6"><X aria-hidden="true" /></button>
          <div className="relative min-h-0 w-full flex-1" onClick={(event) => event.stopPropagation()}>
            <Image src={current.originalUrl || current.src} alt={current.alt} fill unoptimized sizes="100vw" className="object-contain" />
          </div>
          {images.length > 1 ? <>
            <button type="button" aria-label="Ảnh trước" onClick={(event) => { event.stopPropagation(); move(-1); }} className="absolute left-3 top-1/2 z-10 grid min-h-12 min-w-12 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-forest-950 shadow-lg transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wood-400 sm:left-6"><ChevronLeft aria-hidden="true" /></button>
            <button type="button" aria-label="Ảnh tiếp theo" onClick={(event) => { event.stopPropagation(); move(1); }} className="absolute right-3 top-1/2 z-10 grid min-h-12 min-w-12 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-forest-950 shadow-lg transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wood-400 sm:right-6"><ChevronRight aria-hidden="true" /></button>
          </> : null}
          <div className="mx-auto mt-3 w-full max-w-5xl shrink-0" onClick={(event) => event.stopPropagation()}>
            <p className="mb-2 text-center text-sm font-bold text-white">{index + 1} / {images.length}</p>
            {images.length > 1 ? (
              <div className="flex snap-x gap-2 overflow-x-auto px-1 pb-1 [scrollbar-color:rgba(255,255,255,0.55)_transparent]">
                {images.map((image, imageIndex) => (
                  <button
                    key={`${image.src}-${imageIndex}`}
                    type="button"
                    aria-label={`Chuyển đến ảnh ${imageIndex + 1}`}
                    aria-current={imageIndex === index ? "true" : undefined}
                    onClick={() => setIndex(imageIndex)}
                    className={`relative h-16 w-20 shrink-0 snap-center overflow-hidden rounded-sm border-2 bg-black/50 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wood-400 sm:h-20 sm:w-24 ${imageIndex === index ? "border-white opacity-100" : "border-white/30 opacity-60 hover:opacity-100"}`}
                  >
                    <Image src={image.thumbnailSrc || image.src} alt="" fill sizes="96px" className="object-contain" />
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
