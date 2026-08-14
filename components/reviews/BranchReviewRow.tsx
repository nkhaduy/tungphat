"use client";

import { useMemo } from "react";
import type { ReviewBranch } from "./google-review-types";
import { sortReviews } from "./google-review-utils";
import { RatingSummary } from "./RatingSummary";
import { ReviewCard } from "./ReviewCard";

export function BranchReviewRow({ branch, direction }: { branch: ReviewBranch; direction: "left" | "right" }) {
  const reviews = useMemo(() => sortReviews(branch.reviews).slice(0, 6), [branch.reviews]);
  const canLoop = reviews.length >= 4;
  const railClass = direction === "right" ? "google-review-rail google-review-rail--right" : "google-review-rail";
  if (branch.status === "error") return <div data-review-branch={branch.branchKey} className="grid min-h-[287px] gap-5 md:grid-cols-[minmax(13rem,16rem)_minmax(0,1fr)]"><RatingSummary branch={branch} /><div className="grid place-items-center rounded-[0.9rem] border border-dashed border-forest-900/15 bg-white/60 p-6 text-center text-sm text-slate-500">Chưa thể tải đánh giá của chi nhánh này lúc này.</div></div>;
  if (!reviews.length) return <div data-review-branch={branch.branchKey} className="grid min-h-[287px] gap-5 md:grid-cols-[minmax(13rem,16rem)_minmax(0,1fr)]"><RatingSummary branch={branch} /><div className="grid place-items-center rounded-[0.9rem] border border-dashed border-forest-900/15 bg-white/60 p-6 text-center text-sm text-slate-500">Chưa có đánh giá được đồng bộ. Bạn có thể xem hồ sơ Google để biết thêm.</div></div>;
  const cards = canLoop ? [...reviews, ...reviews] : reviews;
  const rail = <div className="google-review-rail-wrap" tabIndex={0} aria-label={`Các đánh giá của ${branch.location}`}><div className={railClass} data-loop={canLoop ? "true" : "false"}>{cards.map((review, index) => <ReviewCard key={`${review.review_id}-${index}`} review={review} duplicate={canLoop && index >= reviews.length} />)}</div></div>;
  return <div data-review-branch={branch.branchKey} className={`grid min-h-[287px] gap-5 md:grid-cols-[minmax(13rem,16rem)_minmax(0,1fr)] ${direction === "right" ? "md:[&>div:first-child]:order-1" : ""}`}><RatingSummary branch={branch} />{rail}</div>;
}
