"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, MessageCircle } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { TrackedLink } from "@/components/TrackedLink";
import staticPages from "@/content/settings/static-pages.json";
import { translations } from "@/lib/i18n";
import { useLang } from "@/lib/i18n-context";
import { secureRandomIndex } from "@/lib/random";
import { ZALO_URL } from "@/lib/seo";

const slides = [
  {
    desktop: "/images/hero-workshop.png",
    mobile: "/images/hero-workshop-mobile.webp",
    alt: "Kho vật liệu và xưởng gia công Tùng Phát"
  },
  {
    desktop: "/images/hero-workshop1.png",
    mobile: "/images/hero-workshop1-mobile.webp",
    alt: "Bề mặt vật liệu gỗ tại Tùng Phát"
  },
  {
    desktop: "/images/hero-workshop2.png",
    mobile: "/images/hero-workshop2-mobile.webp",
    alt: "Không gian ứng dụng vật liệu gỗ"
  },
  {
    desktop: "/images/hero-workshop4.png",
    mobile: "/images/hero-workshop4-mobile.webp",
    alt: "Không gian trưng bày vật liệu gỗ"
  },
  {
    desktop: "/images/hero-workshop5.png",
    mobile: "/images/hero-workshop5-mobile.webp",
    alt: "Ứng dụng bề mặt gỗ trong nội thất"
  },
  {
    desktop: "/images/hero-workshop6.png",
    mobile: "/images/hero-workshop6-mobile.webp",
    alt: "Khu vực gia công CNC tại xưởng Tùng Phát"
  }
] as const;

export function Hero() {
  const { lang } = useLang();
  const t = translations[lang];
  const [active, setActive] = useState(0);
  const [initialActive, setInitialActive] = useState(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const firstSlide = secureRandomIndex(slides.length);
    setActive(firstSlide);
    setInitialActive(firstSlide);
  }, []);

  useEffect(() => {
    if (reduceMotion) return;
    const timer = window.setInterval(() => setActive((value) => (value + 1) % slides.length), 6500);
    return () => window.clearInterval(timer);
  }, [reduceMotion]);

  const slide = slides[active];

  return (
    <section id="trang-chu" className="relative min-h-[620px] overflow-hidden bg-forest-950 pt-[72px] text-white lg:min-h-[100svh] lg:pt-0">
      <AnimatePresence initial={false}>
        <motion.picture
          key={slide.desktop}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.5 }}
          className="absolute inset-0 block"
        >
          <source media="(max-width: 767px)" srcSet={slide.mobile} />
          <Image
            src={slide.desktop}
            alt={slide.alt}
            fill
            sizes="100vw"
            quality={100}
            priority={active === initialActive}
            fetchPriority={active === initialActive ? "high" : "auto"}
            className="object-cover"
          />
        </motion.picture>
      </AnimatePresence>
      <div className="absolute inset-0 hero-overlay" />

      <div className="hero-content container-shell relative flex min-h-[548px] flex-col justify-center py-14 lg:min-h-[100svh]">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduceMotion ? 0 : 0.65 }} className="max-w-[780px]">
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
            <TrackedLink href="#san-pham" eventName="view_product_category" eventProperties={{ location: "hero" }} className="inline-flex min-h-[52px] items-center justify-center gap-2 bg-wood-500 px-6 text-[15px] font-bold transition hover:bg-wood-600">{t.heroCtaExplore} <ArrowRight size={16} /></TrackedLink>
            <TrackedLink href={ZALO_URL} target="_blank" rel="noopener noreferrer" eventName="click_zalo" eventProperties={{ location: "hero" }} aria-label={t.heroCtaQuote} className="inline-flex min-h-[52px] items-center justify-center gap-2 border border-white/55 bg-white/[0.12] px-6 text-[15px] font-bold backdrop-blur-sm transition hover:bg-white hover:text-forest-950"><MessageCircle size={17} /> {t.heroCtaQuote}</TrackedLink>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
