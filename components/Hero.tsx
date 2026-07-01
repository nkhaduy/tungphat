"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, FileUp } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useLang } from "@/lib/i18n-context";
import { translations } from "@/lib/i18n";

const slides = ["hero-workshop.png", "hero-workshop1.png", "hero-workshop2.png", "hero-workshop4.png", "hero-workshop5.png", "hero-workshop6.png"];

export function Hero() {
  const { lang } = useLang();
  const t = translations[lang];
  const [active, setActive] = useState(0);
  const reduceMotion = useReducedMotion();
  useEffect(() => {
    if (reduceMotion) return;
    const timer = window.setInterval(() => setActive((value) => (value + 1) % slides.length), 6500);
    return () => window.clearInterval(timer);
  }, [reduceMotion]);
  return (
    <section id="trang-chu" className="relative min-h-[620px] overflow-hidden bg-forest-950 pt-[72px] text-white lg:min-h-[100svh] lg:pt-0">
      <AnimatePresence initial={false}>
        <motion.div key={slides[active]} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduceMotion ? 0 : 0.5 }} className="absolute inset-0">
          <Image src={`/images/${slides[active]}`} alt="Kho vật liệu và xưởng gia công Tùng Phát" fill priority fetchPriority="high" sizes="100vw" quality={100} className="object-cover" style={{ imageRendering: "auto" }} />
        </motion.div>
      </AnimatePresence>
      <div className="absolute inset-0 hero-overlay" />

      <div className="hero-content container-shell relative flex min-h-[548px] flex-col justify-center py-14 lg:min-h-[100svh]">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduceMotion ? 0 : .65 }} className="max-w-[780px]">
          <p className="hero-eyebrow mb-5 flex items-center gap-3 text-xs font-bold uppercase tracking-[.16em] text-orange-300"><span className="h-0.5 w-10 bg-wood-500" /> {t.heroCompany}</p>
          <h1 className="hero-headline font-display font-extrabold leading-[1.05] tracking-[-.03em]">
            <span className="block">
              {t.heroTitle1} <strong className="font-extrabold text-wood-500">{t.heroTitle2}</strong>
            </span>
            <span className="block">
              {t.heroTitle3} <strong className="font-extrabold text-wood-500">{t.heroTitle4}</strong>
            </span>
          </h1>
          {lang === "vi" ? (
            <p className="hero-desc mt-6 max-w-[660px] text-pretty text-base leading-relaxed text-white/82 lg:text-[1.0625rem]">
              Phân phối <span className="font-semibold text-white">vật liệu gỗ từ các thương hiệu uy tín</span> và gia công <span className="font-semibold text-white">CNC theo kích thước, bản vẽ</span>, đáp ứng nhu cầu của xưởng nội thất, thợ mộc, kiến trúc sư và doanh nghiệp.
            </p>
          ) : (
            <p className="hero-desc mt-6 max-w-[660px] text-pretty text-base leading-relaxed text-white/82 lg:text-[1.0625rem]">{t.heroDescription}</p>
          )}
          <div className="hero-cta mt-7 flex flex-col gap-3 sm:flex-row">
            <a href="#san-pham" className="inline-flex min-h-[52px] items-center justify-center gap-2 bg-wood-500 px-6 text-[15px] font-bold transition hover:bg-wood-600">{t.heroCtaExplore} <ArrowRight size={16} /></a>
            <a href="#bao-gia" className="inline-flex min-h-[52px] items-center justify-center gap-2 border border-white/55 bg-white/[0.12] px-6 text-[15px] font-bold backdrop-blur-sm transition hover:bg-white hover:text-forest-950"><FileUp size={17} /> {t.heroCtaQuote}</a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}