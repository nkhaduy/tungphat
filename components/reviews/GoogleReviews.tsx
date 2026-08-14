"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";

type Review = { review_id: string; reviewer_display_name: string; rating: number; comment?: string | null; create_time?: string | null; update_time?: string | null; owner_reply?: string | null };
type ReviewPayload = { status: "ready" | "empty"; location?: string | null; mapsUrl?: string | null; count?: number; averageRating?: number; reviews?: Review[] };

const CMS_ORIGIN = process.env.NEXT_PUBLIC_FORMS_API_BASE?.trim() || "https://cms.mdftungphat.com";

function dateLabel(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value); return Number.isNaN(date.valueOf()) ? "" : new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(date);
}

function ReviewCard({ review }: { review: Review }) {
  return <article className="flex min-h-[230px] flex-col rounded-xl border border-forest-900/10 bg-white p-6 shadow-[0_10px_30px_rgba(7,59,40,.05)]">
    <div className="flex items-start justify-between gap-4">
      <div className="flex min-w-0 items-center gap-3">
        <span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#edf4ef] text-sm font-extrabold text-forest-900">{review.reviewer_display_name.slice(0, 1).toUpperCase()}</span>
        <div className="min-w-0"><h3 className="truncate text-sm font-extrabold text-forest-950">{review.reviewer_display_name}</h3><p className="mt-1 text-xs text-slate-500">{dateLabel(review.update_time || review.create_time)}</p></div>
      </div>
      <span className="shrink-0" aria-label={`${review.rating} trên 5 sao`}>{Array.from({ length: 5 }, (_, index) => <Star key={index} size={15} fill={index < review.rating ? "currentColor" : "none"} className={index < review.rating ? "inline text-wood-500" : "inline text-slate-300"} aria-hidden="true" />)}</span>
    </div>
    {review.comment ? <p className="mt-5 line-clamp-5 flex-1 text-sm leading-7 text-slate-700">{review.comment}</p> : <div className="flex-1" aria-hidden="true" />}
    {review.owner_reply ? <p className="mt-4 border-l-2 border-wood-500/50 pl-3 text-xs leading-5 text-slate-500"><strong className="text-forest-900">Tùng Phát trả lời:</strong> {review.owner_reply}</p> : null}
    <p className="mt-4 text-[11px] font-semibold uppercase tracking-[.12em] text-slate-400">Đánh giá trên Google</p>
  </article>;
}

export function GoogleReviews() {
  const [payload, setPayload] = useState<ReviewPayload | null>(null);
  useEffect(() => {
    let active = true;
    try {
      const cached = window.sessionStorage.getItem("tp-google-reviews");
      if (cached) setPayload(JSON.parse(cached) as ReviewPayload);
    } catch { /* Cache is optional. */ }
    fetch(`${CMS_ORIGIN}/api/gbp/reviews`, { headers: { Accept: "application/json" } })
      .then((response) => response.ok ? response.json() as Promise<ReviewPayload> : null)
      .then((value) => {
        if (!active || !value) return;
        setPayload(value);
        try { window.sessionStorage.setItem("tp-google-reviews", JSON.stringify(value)); } catch { /* Cache is optional. */ }
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);
  if (!payload || payload.status !== "ready" || !payload.reviews?.length) return null;
  return <section id="google-reviews" aria-labelledby="google-reviews-title" className="border-y border-forest-900/10 bg-[#f7f9f6] py-16 lg:py-24">
    <div className="container-shell">
      <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end"><div className="max-w-2xl"><p className="eyebrow">Phản hồi thực tế</p><h2 id="google-reviews-title" className="text-balance mt-4 font-display text-3xl font-extrabold leading-tight tracking-[-.035em] text-forest-950 sm:text-4xl">Khách hàng nói gì về Tùng Phát</h2><p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">Những chia sẻ được đồng bộ trực tiếp từ hồ sơ doanh nghiệp Tùng Phát trên Google.</p></div><div className="flex items-end gap-5"><div><p className="text-4xl font-extrabold tracking-tight text-forest-950">{payload.averageRating?.toFixed(1)}</p><div aria-label={`Điểm trung bình ${payload.averageRating?.toFixed(1)} trên 5`}><Star size={16} fill="currentColor" className="inline text-wood-500" /> <span className="text-xs font-semibold text-slate-500">{payload.count} đánh giá</span></div></div>{payload.mapsUrl ? <a href={payload.mapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center rounded-md border border-forest-900/15 bg-white px-4 text-xs font-extrabold text-forest-900 transition hover:border-wood-500/50">Xem trên Google</a> : null}</div></div>
      <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{payload.reviews.slice(0, 6).map((review) => <ReviewCard key={review.review_id} review={review} />)}</div>
    </div>
  </section>;
}
