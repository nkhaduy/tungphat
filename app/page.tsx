"use client";

import Image from "next/image";
import { ArrowRight, Boxes, Check, FileUp, Layers3, MessageCircle, Phone, Ruler, ShieldCheck } from "lucide-react";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { ContactForm } from "@/components/ContactForm";
import { Footer } from "@/components/Footer";
import { Reveal } from "@/components/Reveal";
import { SectionTitle } from "@/components/SectionTitle";
import { Partners } from "@/components/Partners";
import { WorkshopMedia } from "@/components/WorkshopMedia";
import { ReviewSection } from "@/components/ReviewSection";
import { FloatingButtons } from "@/components/FloatingButtons";
import { useLang } from "@/lib/i18n-context";
import { translations } from "@/lib/i18n";

const categoryPositions = [
  "10% center",
  "26% center",
  "42% center",
  "58% center",
  "72% center",
  "88% center",
  "34% center",
  "64% center"
];

export default function Home() {
  const { lang } = useLang();
  const t = translations[lang];

  return (
    <main>
      <Header />
      <Hero />
      <Partners />

      {/* Product categories */}
      <section id="san-pham" className="bg-[#f6f7f5] py-20 lg:py-28">
        <div className="container-shell">
          <div className="flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
            <SectionTitle eyebrow={t.categoryEyebrow} title={t.categoryTitle} description={t.categoryDescription} />
            <a href="#bao-gia" className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-forest-900">{t.categoryCtaCheck} <ArrowRight size={17} className="text-wood-600" /></a>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {t.categories.map(([name, text]: string[], index: number) => (
              <Reveal key={name} delay={index * .035}>
                <article className="group relative min-h-[370px] overflow-hidden bg-forest-950 text-white">
                  <Image src="/images/wood-panels.png" alt={`Bề mặt ${name}`} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" quality={95} className="object-cover" style={{ objectPosition: categoryPositions[index] || "center" }} />
                  <div className="absolute inset-0 card-gradient-overlay" />
                  <div className="absolute inset-x-0 bottom-0 p-6">
                    <span className="text-xs font-bold text-orange-300">{String(index + 1).padStart(2, "0")}</span>
                    <h3 className="mt-2 text-xl font-extrabold">{name}</h3>
                    <p className="mt-3 text-sm leading-6 text-white/72">{text}</p>
                    <a href="#bao-gia" className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-bold">{t.categoryCtaRequest} <ArrowRight size={16} /></a>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CNC section */}
      <section id="cnc" className="technical-grid overflow-hidden bg-forest-950 py-20 text-white lg:py-28">
        <div className="container-shell grid items-center gap-12 lg:grid-cols-[1.1fr_.9fr]">
          <Reveal>
            <div className="relative aspect-[4/3] overflow-hidden">
              <Image src="/images/cnc-service.png" alt="Máy CNC của Tùng Phát đang gia công ván" fill sizes="(max-width: 1024px) 100vw, 55vw" quality={95} className="object-cover" />
              <div className="absolute bottom-0 left-0 bg-wood-500 px-5 py-4 text-sm font-bold">{t.cncOverlay}</div>
            </div>
          </Reveal>
          <Reveal delay={.08}>
            <div>
              <SectionTitle eyebrow={t.cncEyebrow} title={t.cncTitle} description={t.cncDescription} light />
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {t.cncItems.map((item: string) => (
                  <div key={item} className="flex min-h-12 items-center gap-3 border-b border-white/15 text-sm font-bold text-white/85"><Check size={17} className="text-wood-500" />{item}</div>
                ))}
              </div>
              <a href="#bao-gia" className="mt-8 inline-flex min-h-14 items-center gap-2 bg-wood-500 px-7 text-sm font-bold"><FileUp size={18} /> {t.cncCta}</a>
              <p className="mt-4 text-xs text-white/60">{t.cncFormats}</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Process */}
      <section className="bg-[#f6f7f5] py-20 lg:py-28">
        <div className="container-shell">
          <SectionTitle eyebrow={t.processEyebrow} title={t.processTitle} description={t.processDescription} />
          <ol className="mt-12 grid gap-px overflow-hidden bg-forest-900/15 sm:grid-cols-2 lg:grid-cols-5">
            {t.processSteps.map(([number, title]: string[]) => (
              <li key={number} className="min-h-[190px] bg-white p-6">
                <span className="text-3xl font-extrabold text-wood-500">{number}</span>
                <h3 className="mt-8 text-base font-extrabold leading-6 text-forest-950">{title}</h3>
              </li>
            ))}
          </ol>
          <p className="mt-7 max-w-5xl text-sm leading-7 text-slate-700"><strong>{t.processScope.split(":")[0]}:</strong>{t.processScope.includes(":") ? t.processScope.substring(t.processScope.indexOf(":") + 1) : ""}</p>
        </div>
      </section>

      <WorkshopMedia />

      {/* Why us */}
      <section className="bg-[#f6f7f5] py-20 lg:py-28">
        <div className="container-shell">
          <SectionTitle eyebrow={t.whyUsEyebrow} title={t.whyUsTitle} centered />
          <div className="mt-12 grid gap-px bg-forest-900/15 sm:grid-cols-2 lg:grid-cols-4">
            {[[ShieldCheck, t.whyUsItems[0]], [Layers3, t.whyUsItems[1]], [Ruler, t.whyUsItems[2]], [Boxes, t.whyUsItems[3]]].map(([Icon, title]) => {
              const I = Icon as typeof ShieldCheck;
              return (
                <article key={title as string} className="bg-white p-7">
                  <I className="text-wood-600" size={28} />
                  <h3 className="mt-7 text-lg font-extrabold text-forest-950">{title as string}</h3>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <ReviewSection />

      {/* Contact form */}
      <section id="bao-gia" className="bg-white py-20 lg:py-28">
        <div className="container-shell grid overflow-hidden border border-forest-900/15 lg:grid-cols-[.8fr_1.2fr]">
          <div className="relative min-h-[390px] bg-forest-950 p-8 text-white sm:p-12">
            <Image src="/images/hero-workshop2.png" alt="Vân gỗ và máy CNC tại Tùng Phát" fill sizes="(max-width: 1024px) 100vw, 40vw" quality={95} className="object-cover opacity-45" />
            <div className="relative">
              <h2 className="text-balance text-3xl font-extrabold leading-tight sm:text-4xl">{t.formTitle}</h2>
              <p className="mt-5 max-w-md text-sm leading-7 text-white/75">{t.formDescription}</p>
              <div className="mt-8 space-y-3">
                <a href="https://zalo.me/0909259160" target="_blank" rel="noreferrer" className="flex min-h-12 items-center gap-3 font-bold"><MessageCircle className="text-wood-500" /> {t.formZalo}</a>
                <a href="tel:0909259160" className="flex min-h-12 items-center gap-3 font-bold"><Phone className="text-wood-500" /> {t.formCall}</a>
              </div>
            </div>
          </div>
          <div className="p-7 sm:p-10 lg:p-12">
            <h3 className="text-2xl font-extrabold text-forest-950">{t.formHeading}</h3>
            <p className="mb-7 mt-2 text-sm text-slate-600">{t.formSubheading}</p>
            <ContactForm />
          </div>
        </div>
      </section>

      <Footer />
      <div className="fixed bottom-4 right-4 z-40 flex flex-col gap-2">
        <a href="#bao-gia" className="hidden min-h-12 items-center gap-2 bg-wood-500 px-4 text-sm font-bold text-white shadow-md sm:flex"><ClipboardList size={17} /> {t.floatingQuote}</a>
        <a href="https://zalo.me/0909259160" target="_blank" rel="noreferrer" aria-label="Mở Zalo Tùng Phát" className="grid h-12 w-12 place-items-center self-end rounded-full bg-[#0068ff] text-xs font-extrabold text-white shadow-md">Zalo</a>
        <a href="tel:0909259160" aria-label="Gọi Tùng Phát" className="grid h-12 w-12 place-items-center self-end rounded-full bg-wood-500 text-white shadow-md sm:hidden"><Phone size={20} /></a>
      </div>
    </main>
  );
}
