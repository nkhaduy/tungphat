"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronDown, MessageCircle, Phone } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useLang } from "@/lib/i18n-context";
import { translations } from "@/lib/i18n";

const LEGAL_HERO_IMAGES = [
  "/images/hero-workshop.png",
  "/images/hero-workshop4.png",
  "/images/hero-workshop5.png",
  "/images/hero-workshop6.png",
];

function getRandomLegalHero(): string {
  return LEGAL_HERO_IMAGES[Math.floor(Math.random() * LEGAL_HERO_IMAGES.length)];
}

type LegalPageProps = {
  type: "privacy" | "terms";
};

export function LegalPage({ type }: LegalPageProps) {
  const { lang } = useLang();
  const t = translations[lang];

  const title = type === "privacy" ? t.privacyTitle : t.termsTitle;
  const subtitle = type === "privacy" ? t.privacySubtitle : t.termsIntro;
  const sections = type === "privacy" ? t.privacySections : t.termsSections;
  const showCTA = type === "privacy";

  const heroImage = useMemo(() => getRandomLegalHero(), []);

  const [activeSection, setActiveSection] = useState("");
  const [tocOpen, setTocOpen] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    const ids = sections.map((s: { id: string }) => s.id);
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: "-120px 0px -50% 0px", threshold: 0 }
    );

    ids.forEach((id: string) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    observerRef.current = observer;
    return () => observer.disconnect();
  }, [sections]);

  const scrollToSection = (id: string) => {
    setTocOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <main className="bg-[#f6f7f5] pt-[72px]">
      {/* ── Hero ── */}
      <section className="relative flex min-h-[320px] items-center overflow-hidden sm:min-h-[380px] lg:min-h-[420px]">
        <Image
          src={heroImage}
          alt=""
          fill
          sizes="100vw"
          quality={95}
          className="object-cover"
          priority
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(4, 38, 28, 0.78), rgba(4, 38, 28, 0.48), rgba(4, 38, 28, 0.18))" }} />
        <div className="container-shell relative py-12 lg:py-16">
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-white/65">
            <Link href="/" className="min-h-9 content-center transition hover:text-white">{t.breadcrumbHome}</Link>
            <span aria-hidden="true" className="text-white/35">/</span>
            <span className="text-white/90" aria-current="page">{title}</span>
          </nav>
          <h1 className="mt-5 text-balance font-display text-3xl font-extrabold leading-[1.12] text-white sm:text-4xl lg:text-[3.25rem] lg:leading-[1.08]">
            {title}
          </h1>
          <p className="mt-4 max-w-2xl text-pretty text-sm leading-7 text-white/90 sm:text-base">
            {subtitle}
          </p>
        </div>
      </section>

      {/* ── Two-column content ── */}
      <section className="py-12 sm:py-16 lg:py-24">
        <div className="container-shell grid gap-10 lg:grid-cols-[300px_1fr] lg:gap-12 xl:grid-cols-[320px_1fr] xl:gap-16">
          {/* Mobile TOC toggle */}
          <div className="lg:hidden">
            <button
              type="button"
              onClick={() => setTocOpen(!tocOpen)}
              className="flex w-full min-h-12 items-center justify-between rounded-2xl border border-forest-900/12 bg-white px-5 text-sm font-bold text-forest-950 shadow-sm"
            >
              {t.legalTOC}
              <ChevronDown size={18} className={`transition-transform ${tocOpen ? "rotate-180" : ""}`} />
            </button>
            {tocOpen && (
              <nav className="mt-3 rounded-2xl border border-forest-900/12 bg-white p-4 shadow-sm">
                <ul className="space-y-1">
                  {sections.map((section: { id: string; title: string }, idx: number) => (
                    <li key={section.id}>
                      <button
                        type="button"
                        onClick={() => scrollToSection(section.id)}
                        className={`block w-full rounded-xl px-4 py-2.5 text-left text-sm font-bold transition ${
                          activeSection === section.id
                            ? "bg-[#eef1ed] text-wood-600"
                            : "text-forest-900 hover:bg-[#f6f7f5]"
                        }`}
                      >
                        {section.title}
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>
            )}
          </div>

          {/* Desktop TOC — sticky sidebar */}
          <aside className="hidden lg:block">
            <nav aria-label={t.legalTOC} className="sticky top-[100px]">
              <div className="rounded-2xl border border-forest-900/10 bg-white p-6 shadow-sm">
                <h2 className="mb-5 text-xs font-extrabold uppercase tracking-[0.16em] text-slate-500">{t.legalTOC}</h2>
                <ul className="space-y-1.5">
                  {sections.map((section: { id: string; title: string }, idx: number) => (
                    <li key={section.id}>
                      <button
                        type="button"
                        onClick={() => scrollToSection(section.id)}
                        className={`block w-full rounded-xl px-4 py-2.5 text-left text-sm font-bold transition ${
                          activeSection === section.id
                            ? "bg-[#eef1ed] text-wood-600"
                            : "text-forest-900/80 hover:bg-[#f6f7f5] hover:text-forest-950"
                        }`}
                      >
                        {section.title}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </nav>
          </aside>

          {/* Content */}
          <div className="min-w-0 space-y-10">
            {sections.map((section: { id: string; title: string; content: string[] }, idx: number) => (
              <motion.section
                key={section.id}
                id={section.id}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: idx * 0.06 }}
                className="scroll-mt-32 rounded-2xl border border-forest-900/10 bg-white p-6 shadow-sm sm:p-8 lg:p-10"
              >
                <div className="flex items-start gap-5">
                  <span className="shrink-0 mt-1 text-3xl font-extrabold text-wood-500/25 lg:text-4xl">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h2 className="text-xl font-extrabold text-forest-950 sm:text-2xl">{section.title.replace(/^\d+\.\s*/, "")}</h2>
                    <div className="mt-5 space-y-4 text-[15px] leading-[1.82] text-slate-600">
                      {section.content.map((paragraph: string, pIdx: number) => (
                        <p key={pIdx}>{paragraph}</p>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.section>
            ))}

            {/* CTA block */}
            {showCTA && (
              <motion.div
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="overflow-hidden rounded-2xl bg-forest-950 text-white"
              >
                <div className="grid lg:grid-cols-[1fr_auto]">
                  <div className="p-8 sm:p-10 lg:p-12">
                    <h2 className="text-2xl font-extrabold sm:text-3xl">{t.legalCTAHeading}</h2>
                    <p className="mt-3 max-w-md text-sm leading-7 text-white/72">{t.legalCTAText}</p>
                    <div className="mt-6 flex flex-wrap gap-3">
                      <Link
                        href="/#bao-gia"
                        className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-wood-500 px-6 text-sm font-bold text-white transition hover:bg-wood-600"
                      >
                        {t.legalCTAQuote}
                        <ArrowRight size={17} />
                      </Link>
                      <a
                        href="https://zalo.me/0909259160"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 text-sm font-bold transition hover:bg-white hover:text-forest-950"
                      >
                        <MessageCircle size={17} />
                        {t.legalCTAZalo}
                      </a>
                    </div>
                  </div>
                  <div className="relative hidden min-h-[200px] w-[320px] lg:block">
                    <Image
                      src="/images/cnc-service.png"
                      alt=""
                      fill
                      sizes="320px"
                      quality={95}
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-forest-950/20" />
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}