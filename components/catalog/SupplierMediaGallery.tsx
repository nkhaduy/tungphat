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
        <div role="dialog" aria-modal="true" aria-label={`Thư viện ảnh, ${index + 1} trên ${images.length}`} className="fixed inset-0 z-[100] grid bg-black/92 p-3 sm:p-6" onClick={() => setOpen(false)} onTouchStart={(event) => { touchStart.current = event.touches[0]?.clientX ?? null; }} onTouchEnd={(event) => {
          const start = touchStart.current;
          const end = event.changedTouches[0]?.clientX;
          touchStart.current = null;
          if (start == null || end == null || Math.abs(end - start) < 50 || images.length < 2) return;
          move(end < start ? 1 : -1);
        }}>
          <button type="button" aria-label="Đóng thư viện" onClick={() => setOpen(false)} className="absolute right-3 top-3 z-20 grid min-h-11 min-w-11 place-items-center bg-white text-forest-950 sm:right-6 sm:top-6"><X aria-hidden="true" /></button>
          <div className="relative m-auto h-[calc(100dvh-7rem)] w-full max-w-[min(92rem,100vw-1.5rem)]" onClick={(event) => event.stopPropagation()}>
            <Image src={current.originalUrl || current.src} alt={current.alt} fill unoptimized sizes="100vw" className="object-contain" />
          </div>
          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 px-3 py-2 text-sm font-bold text-white">{index + 1} / {images.length}</p>
          {images.length > 1 ? <>
            <button type="button" aria-label="Ảnh trước" onClick={(event) => { event.stopPropagation(); move(-1); }} className="absolute left-3 top-1/2 grid min-h-12 min-w-12 -translate-y-1/2 place-items-center bg-white/95 text-forest-950 sm:left-6"><ChevronLeft aria-hidden="true" /></button>
            <button type="button" aria-label="Ảnh tiếp theo" onClick={(event) => { event.stopPropagation(); move(1); }} className="absolute right-3 top-1/2 grid min-h-12 min-w-12 -translate-y-1/2 place-items-center bg-white/95 text-forest-950 sm:right-6"><ChevronRight aria-hidden="true" /></button>
          </> : null}
        </div>
      ) : null}
    </>
  );
}
