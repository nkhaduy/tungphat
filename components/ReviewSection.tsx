"use client";

import { useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, MapPin, MessageCircle, Star } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { useLang } from "@/lib/i18n-context";
import { translations } from "@/lib/i18n";

type ReviewSource = "Google Maps" | "Facebook";

const sourceStyles: Record<ReviewSource, string> = {
  "Google Maps": "border-[#4285f4]/25 bg-[#4285f4]/10 text-[#1f5fbf]",
  Facebook: "border-[#1877f2]/25 bg-[#1877f2]/10 text-[#1259b1]"
};

const sourceIcons: Record<ReviewSource, typeof MapPin> = {
  "Google Maps": MapPin,
  Facebook: MessageCircle
};

export function ReviewSection() {
  const { lang } = useLang();
  const t = translations[lang];
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeSource, setActiveSource] = useState<string>(t.reviewFilterAll);

  const filters = [t.reviewFilterAll, "Google Maps", "Facebook"];
  const visibleReviews = useMemo(
    () => t.reviews.filter((review) => activeSource === t.reviewFilterAll || review.source === activeSource),
    [activeSource, t.reviewFilterAll, t.reviews]
  );

  const scrollCards = (direction: "left" | "right") => {
    const viewport = scrollRef.current;
    if (!viewport) return;
    viewport.scrollBy({
      left: direction === "left" ? -viewport.clientWidth * 0.86 : viewport.clientWidth * 0.86,
      behavior: "smooth"
    });
  };

  return (
    <section className="bg-white py-20 lg:py-28">
      <div className="container-shell">
        <div className="grid gap-10 lg:grid-cols-[340px_minmax(0,1fr)] lg:items-end">
          <Reveal>
            <div className="max-w-xl">
              <span className="eyebrow">{t.reviewEyebrow}</span>
              <h2 className="mt-4 text-balance font-display text-3xl font-bold leading-[1.15] tracking-[-0.035em] text-forest-950 sm:text-4xl lg:text-[3.1rem]">
                {t.reviewTitle}
              </h2>
              <p className="mt-5 text-pretty leading-7 text-slate-600">{t.reviewSubtitle}</p>
            </div>
          </Reveal>

          <Reveal delay={0.06}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="rounded-2xl border border-forest-900/10 bg-[#f8faf7] p-6 shadow-[0_6px_14px_rgba(10,42,28,.06)]">
                <p className="text-sm font-extrabold uppercase tracking-[.12em] text-forest-900">{t.reviewSummaryTitle}</p>
                <div className="mt-4 flex items-end gap-3">
                  <span className="text-5xl font-extrabold leading-none text-forest-950">{t.reviewRating}</span>
                  <span className="pb-1 text-sm font-bold text-slate-500">/5</span>
                </div>
                <div className="mt-4 flex text-wood-500" aria-label={t.reviewFiveStars}>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star key={index} size={20} fill="currentColor" strokeWidth={1.8} />
                  ))}
                </div>
                <p className="mt-4 max-w-[280px] text-sm leading-6 text-slate-600">{t.reviewSummaryText}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {["Google Maps", "Facebook"].map((source) => {
                    const SourceIcon = sourceIcons[source as ReviewSource];
                    return (
                      <span key={source} className={`inline-flex min-h-9 items-center gap-2 rounded-full border px-3 text-xs font-extrabold ${sourceStyles[source as ReviewSource]}`}>
                        <SourceIcon size={14} />
                        {source}
                      </span>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
                <div className="flex rounded-full border border-forest-900/10 bg-white p-1 shadow-[0_4px_10px_rgba(10,42,28,.05)]">
                  {filters.map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setActiveSource(filter)}
                      className={`min-h-10 rounded-full px-4 text-xs font-extrabold transition ${
                        activeSource === filter
                          ? "bg-forest-900 text-white"
                          : "text-slate-600 hover:bg-forest-900/5 hover:text-forest-950"
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
                <div className="hidden gap-2 md:flex">
                  <button type="button" onClick={() => scrollCards("left")} aria-label={t.reviewPrevious} className="grid h-11 w-11 place-items-center rounded-full border border-forest-900/15 bg-white text-forest-950 transition hover:border-wood-500 hover:text-wood-600">
                    <ChevronLeft size={20} />
                  </button>
                  <button type="button" onClick={() => scrollCards("right")} aria-label={t.reviewNext} className="grid h-11 w-11 place-items-center rounded-full border border-forest-900/15 bg-white text-forest-950 transition hover:border-wood-500 hover:text-wood-600">
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.1}>
          <div ref={scrollRef} className="review-scroll mt-8 flex gap-4 overflow-x-auto pb-4 pt-1" aria-label={t.reviewCarouselLabel}>
            {visibleReviews.map((review) => {
              const SourceIcon = sourceIcons[review.source as ReviewSource];
              return (
                <article key={`${review.name}-${review.source}`} className="review-card group flex min-h-[286px] w-[86vw] shrink-0 flex-col rounded-2xl border border-forest-900/10 bg-white p-5 shadow-[0_4px_10px_rgba(10,42,28,.06)] transition duration-200 hover:-translate-y-1 hover:shadow-card sm:w-[360px] lg:w-[340px] xl:w-[360px]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-forest-900 text-base font-extrabold text-white">
                        {review.initials}
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate text-base font-extrabold text-forest-950">{review.name}</h3>
                        <p className="mt-1 truncate text-xs font-bold text-slate-500">{review.role}</p>
                      </div>
                    </div>
                    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-extrabold ${sourceStyles[review.source as ReviewSource]}`}>
                      <SourceIcon size={12} />
                      {review.source}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div className="flex text-wood-500" aria-label={t.reviewFiveStars}>
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Star key={index} size={17} fill="currentColor" strokeWidth={1.7} />
                      ))}
                    </div>
                    <span className="text-xs font-semibold text-slate-500">{review.time}</span>
                  </div>

                  <p className="review-text mt-4 text-sm leading-6 text-slate-700">“{review.content}”</p>
                  <button type="button" className="mt-auto inline-flex min-h-10 items-center self-start text-sm font-extrabold text-forest-900 transition hover:text-wood-600">
                    {t.reviewReadMore}
                  </button>
                </article>
              );
            })}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
