"use client";

/* Trustindex exposes these public avatar URLs with the corresponding review. */
/* eslint-disable @next/next/no-img-element */
import { BadgeCheck, ChevronLeft, ChevronRight, ExternalLink, Star, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export type TrustindexReview = {
  id: string;
  reviewerName: string;
  avatarUrl: string | null;
  rating: number;
  text: string;
  date: string;
};

export type TrustindexReviewData = {
  sourceUrl: string;
  source: "Google";
  rating: number;
  reviewCount: number;
  verified: boolean;
  googleLinks: string[];
  refreshedAt: string;
  reviews: TrustindexReview[];
};

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toLocaleUpperCase("vi-VN") || "TP";
}

function StarRating({ rating }: { rating: number }) {
  return <span role="img" className="flex gap-0.5 text-[#f6b400]" aria-label={`${rating} trên 5 sao`}>{Array.from({ length: 5 }, (_, index) => <Star key={index} size={15} fill={index < rating ? "currentColor" : "none"} className={index < rating ? "" : "text-slate-200"} aria-hidden="true" />)}</span>;
}

function ReviewCard({ review, googleUrl, onReadMore }: { review: TrustindexReview; googleUrl: string; onReadMore: () => void }) {
  const [photoFailed, setPhotoFailed] = useState(false);
  const needsDialog = review.text.length > 260;
  return <article data-trustindex-card className="flex min-h-[21rem] basis-full snap-start flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-[0_12px_28px_rgba(15,23,42,0.10)] sm:p-7 md:basis-[275px]">
    <div className="flex items-start justify-between gap-4">
      <div className="flex min-w-0 items-center gap-3.5">
        {review.avatarUrl && !photoFailed ? <img src={review.avatarUrl} alt={`Ảnh đại diện của ${review.reviewerName}`} width={48} height={48} loading="lazy" referrerPolicy="no-referrer" onError={() => setPhotoFailed(true)} className="h-12 w-12 shrink-0 rounded-full object-cover" /> : <span aria-hidden="true" className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#edf4ef] text-xs font-extrabold text-forest-900">{initials(review.reviewerName)}</span>}
        <div className="min-w-0"><h3 className="truncate text-sm font-extrabold text-forest-950">{review.reviewerName}</h3><p className="mt-1 text-xs text-slate-600">{review.date}</p></div>
      </div>
      <img src="/brand/google-g.png" alt="Google" width={21} height={21} loading="lazy" className="h-[21px] w-[21px] shrink-0" />
    </div>
    <div className="mt-5"><StarRating rating={review.rating} /></div>
    {review.text ? <div data-trustindex-review-body className="mt-4"><p className={needsDialog ? "line-clamp-6 whitespace-pre-line text-sm leading-6 text-slate-700" : "whitespace-pre-line text-sm leading-6 text-slate-700"}>{review.text}</p>{needsDialog ? <button type="button" onClick={onReadMore} className="mt-3 text-xs font-extrabold text-forest-900 underline decoration-forest-900/35 underline-offset-4">Đọc toàn bộ đánh giá</button> : null}</div> : null}
    <a href={googleUrl} target="_blank" rel="noopener noreferrer" className="mt-auto inline-flex items-center gap-1.5 pt-6 text-xs font-bold text-slate-600 transition-colors hover:text-forest-900">Xem nguồn Google <ExternalLink size={13} aria-hidden="true" /></a>
  </article>;
}

export function TrustindexReviews({ data }: { data: TrustindexReviewData }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [autoplay, setAutoplay] = useState(true);
  const [selectedReview, setSelectedReview] = useState<TrustindexReview | null>(null);
  const cardRefs = useRef<Array<HTMLElement | null>>([]);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const reducedMotion = useRef(false);
  // Preserve the public aggregate count while keeping the carousel focused on written feedback.
  const reviews = data.reviews
    .filter((review) => review.text && review.rating >= 5)
    .sort((left, right) => right.text.length - left.text.length);
  const googleUrls = data.googleLinks.length ? data.googleLinks : [data.sourceUrl];
  const googleUrl = googleUrls[0];

  useEffect(() => {
    reducedMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion.current || !autoplay || reviews.length < 2) return;
    const timer = window.setInterval(() => setActiveIndex((value) => (value + 1) % reviews.length), 6000);
    return () => window.clearInterval(timer);
  }, [autoplay, reviews.length]);

  useEffect(() => {
    const viewport = viewportRef.current;
    const card = cardRefs.current[activeIndex];
    if (!viewport || !card) return;
    const viewportRect = viewport.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    viewport.scrollTo({
      left: viewport.scrollLeft + cardRect.left - viewportRect.left,
      behavior: reducedMotion.current ? "auto" : "smooth",
    });
  }, [activeIndex]);

  useEffect(() => {
    if (!selectedReview) return;
    closeButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setSelectedReview(null); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedReview]);

  function move(delta: number) {
    setAutoplay(false);
    setActiveIndex((value) => (value + delta + reviews.length) % reviews.length);
  }

  if (!reviews.length) return null;
  return <section id="google-reviews" data-trustindex-reviews aria-label="Đánh giá khách hàng" className="border-y border-forest-900/10 bg-[#f4f7f4] py-16 lg:py-24">
    <div className="container-shell">
      <div className="grid gap-7 lg:grid-cols-[13.75rem_minmax(0,1fr)] lg:items-stretch">
        <aside className="flex min-h-[21rem] flex-col rounded-xl bg-forest-950 p-7 text-white shadow-[0_14px_32px_rgba(6,43,29,0.18)]">
          <p className="text-xs font-extrabold tracking-[0.16em] text-white/70">XUẤT SẮC</p>
          <div className="mt-4"><StarRating rating={5} /></div>
          <p className="mt-4 text-4xl font-extrabold tracking-[-0.04em]">{data.rating.toFixed(1)}</p>
          <p className="mt-1 text-sm text-white/75">Dựa trên {data.reviewCount} đánh giá</p>
          <div className="mt-7 flex flex-wrap items-center gap-x-3 gap-y-2">
            {googleUrls.map((url, index) => <a key={url} href={url} target="_blank" rel="noopener noreferrer" aria-label={`Google - Chi nhánh ${index + 1}`} className="inline-flex items-center gap-2 text-sm font-extrabold text-white hover:text-[#f6b400]"><img src="/brand/google-g.png" alt={index === 0 ? "Google" : ""} width={20} height={20} className="h-5 w-5" aria-hidden={index > 0 ? "true" : undefined} />{`Tùng Phát ${index + 1}`} <ExternalLink size={13} aria-hidden="true" /></a>)}
          </div>
          {data.verified ? <a href={data.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-auto inline-flex items-center gap-1.5 pt-7 text-xs font-bold text-white/75 hover:text-white"><BadgeCheck size={15} aria-hidden="true" />Verified by Trustindex</a> : null}
        </aside>
        <div className="min-w-0">
          <div ref={viewportRef} data-trustindex-viewport className="trustindex-review-viewport" aria-label="Đánh giá khách hàng" aria-live="polite" onPointerDown={() => setAutoplay(false)}>
            <div data-trustindex-rail data-active-index={activeIndex} className="trustindex-review-rail">
              {reviews.map((review, index) => <div key={review.id} ref={(element) => { cardRefs.current[index] = element; }} className="basis-full shrink-0 snap-start md:basis-[275px]"><ReviewCard review={review} googleUrl={googleUrl} onReadMore={() => { setAutoplay(false); setSelectedReview(review); }} /></div>)}
            </div>
          </div>
          <div className="mt-5 flex items-center justify-between gap-4">
            <p className="text-xs text-slate-600"><span className="font-bold text-forest-950">{activeIndex + 1}</span> / {reviews.length}</p>
            <div className="flex gap-2"><button type="button" aria-label="Đánh giá trước" onClick={() => move(-1)} className="grid min-h-11 min-w-11 place-items-center rounded-full border border-forest-900/20 bg-white text-forest-950 transition-colors hover:border-forest-900 hover:bg-forest-900 hover:text-white"><ChevronLeft size={18} aria-hidden="true" /></button><button type="button" aria-label="Đánh giá tiếp theo" onClick={() => move(1)} className="grid min-h-11 min-w-11 place-items-center rounded-full border border-forest-900/20 bg-white text-forest-950 transition-colors hover:border-forest-900 hover:bg-forest-900 hover:text-white"><ChevronRight size={18} aria-hidden="true" /></button></div>
          </div>
        </div>
      </div>
    </div>
    {selectedReview ? <div role="dialog" aria-modal="true" aria-label={`Toàn bộ đánh giá của ${selectedReview.reviewerName}`} className="fixed inset-0 z-[1000] grid place-items-center bg-forest-950/65 p-4" onMouseDown={() => setSelectedReview(null)}><div className="relative max-h-[min(36rem,calc(100dvh-2rem))] w-full max-w-xl overflow-y-auto rounded-xl bg-white p-7 shadow-2xl" onMouseDown={(event) => event.stopPropagation()}><button ref={closeButtonRef} type="button" aria-label="Đóng đánh giá" onClick={() => setSelectedReview(null)} className="absolute right-4 top-4 grid min-h-11 min-w-11 place-items-center rounded-full text-forest-950 hover:bg-[#edf4ef]"><X size={19} aria-hidden="true" /></button><p className="pr-12 text-base font-extrabold text-forest-950">{selectedReview.reviewerName}</p><div className="mt-4"><StarRating rating={selectedReview.rating} /></div><p className="mt-5 whitespace-pre-line text-sm leading-7 text-slate-700">{selectedReview.text}</p></div></div> : null}
  </section>;
}
