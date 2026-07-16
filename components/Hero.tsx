"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, MessageCircle } from "lucide-react";
import Image from "next/image";
import { useLang } from "@/lib/i18n-context";
import { translations } from "@/lib/i18n";
import { TrackedLink } from "@/components/TrackedLink";
import { ZALO_URL } from "@/lib/seo";

export function Hero() {
  const { lang } = useLang();
  const t = translations[lang];
  const reduceMotion = useReducedMotion();
  return (
    <section id="trang-chu" className="relative min-h-[620px] overflow-hidden bg-forest-950 pt-[72px] text-white lg:min-h-[100svh] lg:pt-0">
      <Image src="/images/hero-workshop.webp" alt="Không gian nội thất sử dụng bề mặt gỗ" fill priority fetchPriority="high" sizes="100vw" className="object-cover" />
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
              Cung cấp MDF, MFC, plywood, laminate và các vật liệu gỗ liên quan; đồng thời nhận gia công CNC theo kích thước hoặc file kỹ thuật cho xưởng nội thất, thợ mộc, đơn vị thiết kế và doanh nghiệp.
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
    </section>
  );
}
