"use client";

/* Reviewer photos come from Google and are not known at build time. */
/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import { Check, ChevronDown, ChevronUp, Star } from "lucide-react";
import type { Review } from "./google-review-types";
import { reviewerInitial, reviewDateLabel, safePhotoUrl } from "./google-review-utils";

export function ReviewCard({ review, duplicate = false }: { review: Review; duplicate?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const [photoFailed, setPhotoFailed] = useState(false);
  const comment = review.comment?.trim() || "";
  const hasLongComment = comment.length > 230;
  const photoUrl = safePhotoUrl(review.reviewer_photo_url);
  const naturalHeight = comment.length > 120 ? "min-h-[287px]" : comment ? "min-h-[230px]" : "min-h-[180px]";

  return (
    <article data-review-card aria-hidden={duplicate || undefined} className={`flex ${naturalHeight} w-[min(19rem,84vw)] shrink-0 flex-col rounded-[0.9rem] border border-forest-900/10 bg-white p-5 shadow-[0_8px_24px_rgba(7,59,40,.055)] transition duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(7,59,40,.09)]`}>
      <div className="flex items-start gap-3">
        {photoUrl && !photoFailed ? (
          <img src={photoUrl} alt={`Ảnh đại diện của ${review.reviewer_display_name}`} width={42} height={42} loading="lazy" referrerPolicy="no-referrer" onError={() => setPhotoFailed(true)} className="h-[42px] w-[42px] shrink-0 rounded-full object-cover" />
        ) : (
          <span data-review-initial aria-hidden="true" className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-full bg-[#eaf2ec] text-sm font-extrabold text-forest-900">{reviewerInitial(review.reviewer_display_name)}</span>
        )}
        <div className="min-w-0 flex-1"><h3 className="truncate text-sm font-extrabold text-forest-950">{review.reviewer_display_name}</h3><p className="mt-1 text-[11px] text-slate-500">{reviewDateLabel(review.update_time || review.create_time)}</p></div>
        <span aria-label={`${review.rating} trên 5 sao`} className="flex shrink-0 gap-0.5 pt-0.5">{Array.from({ length: 5 }, (_, index) => <Star key={index} size={14} fill={index < review.rating ? "currentColor" : "none"} className={index < review.rating ? "text-wood-500" : "text-slate-300"} aria-hidden="true" />)}</span>
      </div>
      {comment ? <div className="mt-4"><p className={hasLongComment && !expanded ? "line-clamp-5 text-sm leading-6 text-slate-700" : "text-sm leading-6 text-slate-700"}>{comment}</p>{hasLongComment ? <button type="button" tabIndex={duplicate ? -1 : undefined} onClick={() => setExpanded((value) => !value)} className="mt-2 inline-flex items-center gap-1 text-xs font-extrabold text-forest-900 underline decoration-forest-900/25 underline-offset-4">{expanded ? "Thu gọn" : "Xem thêm"}{expanded ? <ChevronUp size={13} aria-hidden="true" /> : <ChevronDown size={13} aria-hidden="true" />}</button> : null}</div> : null}
      {review.owner_reply ? <p className="mt-4 border-l-2 border-wood-500/50 pl-3 text-xs leading-5 text-slate-600"><strong className="text-forest-900">Tùng Phát trả lời:</strong> {review.owner_reply}</p> : null}
      <p className="mt-auto flex items-center gap-1.5 pt-5 text-[10px] font-bold uppercase tracking-[.1em] text-slate-400"><span className="grid h-4 w-4 place-items-center rounded-full bg-[#f2f5f3] text-[9px] font-black normal-case text-[#4285f4]">G</span><Check size={12} className="text-forest-700" aria-hidden="true" /> Đánh giá trên Google</p>
    </article>
  );
}
