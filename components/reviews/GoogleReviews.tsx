"use client";

import { useEffect, useState } from "react";
import { BranchReviewRow } from "./BranchReviewRow";
import type { ReviewPayload } from "./google-review-types";
import { parseReviewPayload } from "./google-review-utils";

const CMS_ORIGIN = process.env.NEXT_PUBLIC_FORMS_API_BASE?.trim() || "https://cms.mdftungphat.com";

function ReviewsSkeleton() {
  return <div role="status" className="mt-10 space-y-5" aria-label="Đang tải đánh giá từ Google" aria-busy="true">{[0, 1].map((row) => <div key={row} className="grid min-h-[287px] animate-pulse gap-5 md:grid-cols-[minmax(13rem,16rem)_minmax(0,1fr)]"><div className="rounded-[0.9rem] border border-forest-900/5 bg-white p-5"><div className="h-9 w-9 rounded-full bg-slate-100" /><div className="mt-5 h-4 w-4/5 rounded bg-slate-100" /><div className="mt-8 h-10 w-20 rounded bg-slate-100" /></div><div className="flex gap-4 overflow-hidden"><div className="h-[287px] w-[19rem] shrink-0 rounded-[0.9rem] bg-white" /><div className="h-[287px] w-[19rem] shrink-0 rounded-[0.9rem] bg-white" /></div></div>)}</div>;
}

export function GoogleReviews() {
  const [payload, setPayload] = useState<ReviewPayload | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    try {
      const cached = window.sessionStorage.getItem("tp-google-reviews-v2");
      if (cached) setPayload(parseReviewPayload(JSON.parse(cached)));
    } catch { /* Cache is optional. */ }
    fetch(`${CMS_ORIGIN}/api/gbp/reviews`, { headers: { Accept: "application/json" } })
      .then((response) => response.ok ? response.json() as Promise<unknown> : Promise.reject(new Error("reviews_unavailable")))
      .then((value) => {
        if (!active) return;
        const parsed = parseReviewPayload(value);
        if (!parsed) throw new Error("reviews_invalid");
        setPayload(parsed);
        setFailed(false);
        try { window.sessionStorage.setItem("tp-google-reviews-v2", JSON.stringify(parsed)); } catch { /* Cache is optional. */ }
      })
      .catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, []);

  return <section id="google-reviews" aria-labelledby="google-reviews-title" className="border-y border-forest-900/10 bg-[#f4f7f4] py-16 lg:py-24">
    <div className="container-shell">
      <div className="max-w-2xl"><p className="eyebrow">Phản hồi thực tế</p><h2 id="google-reviews-title" className="text-balance mt-4 font-display text-3xl font-extrabold leading-tight tracking-[-.035em] text-forest-950 sm:text-4xl">Khách hàng nói gì về Tùng Phát</h2><p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">Đánh giá được đồng bộ trực tiếp từ hai hồ sơ doanh nghiệp Tùng Phát trên Google.</p></div>
      {!payload && !failed ? <ReviewsSkeleton /> : null}
      {failed && !payload ? <p role="status" className="mt-10 rounded-xl border border-forest-900/10 bg-white p-6 text-center text-sm font-semibold text-slate-500">Chưa thể tải đánh giá từ Google lúc này.</p> : null}
      {payload ? <div className="mt-10 space-y-5">{payload.branches.map((branch, index) => <BranchReviewRow key={branch.branchKey} branch={branch} direction={index % 2 === 0 ? "left" : "right"} />)}{!payload.branches.length ? <p className="rounded-xl border border-forest-900/10 bg-white p-6 text-center text-sm text-slate-500">Chưa có đánh giá được đồng bộ.</p> : null}</div> : null}
    </div>
  </section>;
}
