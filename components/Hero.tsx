"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useLang } from "@/lib/i18n-context";
import { translations } from "@/lib/i18n";
import { TrackedLink } from "@/components/TrackedLink";
import { ZALO_URL } from "@/lib/seo";
import staticPages from "@/content/settings/static-pages.json";

export function Hero() {
  const { lang } = useLang();
  const t = translations[lang];
  const reduceMotion = useReducedMotion();
  const slides = [
    { src: "/images/hero-workshop.webp", mobileSrc: "/images/hero-workshop-mobile.webp", alt: "Kho vật liệu và xưởng gia công Tùng Phát" },
    { src: "/images/hero-workshop1.webp", mobileSrc: "/images/hero-workshop1-mobile.webp", alt: "Bề mặt vật liệu gỗ tại Tùng Phát" },
    { src: "/images/hero-workshop4.webp", mobileSrc: "/images/hero-workshop4-mobile.webp", alt: "Không gian trưng bày vật liệu gỗ" },
    { src: "/images/hero-workshop6.webp", mobileSrc: "/images/hero-workshop6-mobile.webp", alt: "Khu vực gia công CNC tại xưởng Tùng Phát" }
  ];
  const [activeSlide, setActiveSlide] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const interval = window.setInterval(() => {
      setActiveSlide((current) => {
        const next = (current + 1) % slides.length;
        return next;
      });
    }, 5500);
    return () => window.clearInterval(interval);
  }, [paused, slides.length]);

  return (
    <section id="trang-chu" className="relative min-h-[620px] overflow-hidden bg-forest-950 pt-[72px] text-white lg:min-h-[100svh] lg:pt-0" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false); }}>
      <picture className="absolute inset-0 block">
        <source media="(max-width: 767px)" srcSet={slides[0].mobileSrc} />
        <img src={slides[0].src} alt={activeSlide === 0 ? slides[0].alt : ""} aria-hidden={activeSlide !== 0} width="1916" height="821" loading="eager" fetchPriority="high" decoding="sync" className="h-full w-full object-cover" />
      </picture>
      {activeSlide > 0 && (
        <>
          <motion.div key={`${slides[activeSlide].mobileSrc}-mobile`} role="img" aria-label={slides[activeSlide].alt} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: reduceMotion ? 0 : 1 }} className="absolute inset-0 bg-cover bg-center md:hidden" style={{ backgroundImage: `url(${slides[activeSlide].mobileSrc})` }} />
          <motion.div key={`${slides[activeSlide].src}-desktop`} role="img" aria-label={slides[activeSlide].alt} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: reduceMotion ? 0 : 1 }} className="absolute inset-0 hidden bg-cover bg-center md:block" style={{ backgroundImage: `url(${slides[activeSlide].src})` }} />
        </>
      )}
      <div className="absolute inset-0 hero-overlay" />

      <div className="hero-content container-shell relative flex min-h-[548px] flex-col justify-center py-14 lg:min-h-[100svh]">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduceMotion ? 0 : .65 }} className="max-w-[780px]">
          <p className="hero-eyebrow mb-5 flex items-center gap-3 text-xs font-bold uppercase tracking-[.16em] text-orange-300"><span className="h-0.5 w-10 bg-wood-500" /> {t.heroCompany}</p>
          <h1 className="hero-headline font-display font-extrabold tracking-[-.03em]">
            <span className="block">
              {t.heroTitle1} <strong className="font-extrabold text-wood-500">{t.heroTitle2}</strong>
            </span>
            <span className="block">
              {t.heroTitle3} <strong className="font-extrabold text-wood-500">{t.heroTitle4}</strong>
            </span>
          </h1>
          {lang === "vi" ? (
            <p className="hero-desc mt-6 max-w-[660px] text-pretty text-base leading-relaxed text-white/82 lg:text-[1.0625rem]">
              {staticPages.homeHeroDescription}
            </p>
          ) : (
            <p className="hero-desc mt-6 max-w-[660px] text-pretty text-base leading-relaxed text-white/82 lg:text-[1.0625rem]">{t.heroDescription}</p>
          )}
          <div className="hero-cta mt-7 flex flex-col gap-3 sm:flex-row">
            <TrackedLink href="#san-pham" eventName="view_product_category" eventProperties={{ location: "hero" }} className="inline-flex min-h-[52px] items-center justify-center gap-2 bg-wood-700 px-6 text-[15px] font-bold transition hover:bg-wood-800">{t.heroCtaExplore} <ArrowRight size={16} /></TrackedLink>
            <TrackedLink href={ZALO_URL} target="_blank" rel="noopener noreferrer" eventName="request_quote" eventProperties={{ location: "hero", channel: "zalo" }} aria-label={t.heroCtaQuote} className="inline-flex min-h-[52px] items-center justify-center gap-2 border border-white/55 bg-white/[0.12] px-6 text-[15px] font-bold backdrop-blur-sm transition hover:bg-white hover:text-forest-950"><MessageCircle size={17} /> {t.heroCtaQuote}</TrackedLink>
          </div>
        </motion.div>
      </div>
      <div className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 gap-2" aria-label="Chọn ảnh slideshow">
        {slides.map((slide, index) => <button key={slide.src} type="button" onClick={() => setActiveSlide(index)} aria-label={`Xem ảnh ${index + 1}`} aria-current={index === activeSlide ? "true" : undefined} className={`h-11 w-11 p-[17px] ${index === activeSlide ? "text-white" : "text-white/55"}`}><span className="block h-1.5 w-1.5 rounded-full bg-current" /></button>)}
      </div>
    </section>
  );
}
