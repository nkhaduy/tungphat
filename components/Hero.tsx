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
    <section id="trang-chu" className="relative min-h-[620px] overflow-hidden bg-forest-950 pt-[72px] text-white lg:min-h-[860px]">
      <AnimatePresence initial={false}>
        <motion.div key={slides[active]} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduceMotion ? 0 : 0.5 }} className="absolute inset-0">
          <Image src={`/images/${slides[active]}`} alt="Kho vật liệu và xưởng gia công Tùng Phát" fill priority fetchPriority="high" sizes="100vw" quality={100} className="object-cover" style={{ imageRendering: "auto" }} />
        </motion.div>
      </AnimatePresence>
      <div className="absolute inset-0 hero-overlay" />

      <div className="container-shell relative flex min-h-[548px] items-center py-16 lg:min-h-[788px]">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduceMotion ? 0 : .65 }} className="max-w-[820px]">
          <p className="mb-6 flex items-center gap-3 text-xs font-bold uppercase tracking-[.16em] text-orange-300"><span className="h-0.5 w-10 bg-wood-500" /> {t.heroCompany}</p>
          <h1 className="text-balance font-display text-[2.65rem] font-bold leading-[1.06] tracking-[-.035em] sm:text-6xl lg:text-[4.75rem]">
            {t.heroTitle1} <strong className="font-extrabold text-wood-500">{t.heroTitle2}</strong> {t.heroTitle3}
            <br className="hidden sm:block" /> <strong className="font-extrabold text-wood-500">{t.heroTitle4}</strong>
          </h1>
          <p className="mt-7 max-w-2xl text-pretty text-base leading-7 text-white/82 sm:text-lg">{t.heroDescription}</p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <a href="#san-pham" className="inline-flex min-h-14 items-center justify-center gap-2 bg-wood-500 px-7 text-sm font-bold transition hover:bg-wood-600">{t.heroCtaExplore} <ArrowRight size={17} /></a>
            <a href="#bao-gia" className="inline-flex min-h-14 items-center justify-center gap-2 border border-white/40 bg-white/10 px-7 text-sm font-bold transition hover:bg-white hover:text-forest-950"><FileUp size={18} /> {t.heroCtaQuote}</a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}