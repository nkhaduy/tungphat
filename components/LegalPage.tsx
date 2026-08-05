"use client";

import { ChevronDown, MessageCircle } from "lucide-react";
import { useState } from "react";
import { PageHero } from "@/components/ui/PageHero";
import { TrackedLink } from "@/components/TrackedLink";
import { useLang } from "@/lib/i18n-context";
import { translations } from "@/lib/i18n";
import { ZALO_URL } from "@/lib/seo";

export function LegalPage({ type }: { type: "privacy" | "terms" }) {
  const { lang } = useLang();
  const t = translations[lang];
  const [tocOpen, setTocOpen] = useState(false);
  const title = type === "privacy" ? t.privacyTitle : t.termsTitle;
  const subtitle = type === "privacy" ? t.privacySubtitle : t.termsIntro;
  const sections = type === "privacy" ? t.privacySections : t.termsSections;

  return (
    <>
      <PageHero compact breadcrumbs={[{ label: t.breadcrumbHome, href: "/" }, { label: title }]} eyebrow="Thông tin pháp lý" title={title} description={subtitle} />
      <section className="section-space bg-[#f7f8f5]">
        <div className="container-shell grid gap-8 lg:grid-cols-[280px_minmax(0,760px)] lg:justify-center lg:gap-12">
          <aside>
            <button type="button" onClick={() => setTocOpen((value) => !value)} aria-expanded={tocOpen} aria-controls="legal-toc" className="flex min-h-12 w-full items-center justify-between border border-forest-900/10 bg-white px-5 text-sm font-extrabold text-forest-950 lg:hidden">{t.legalTOC}<ChevronDown size={18} className={tocOpen ? "rotate-180" : ""} aria-hidden="true" /></button>
            <nav id="legal-toc" aria-label={t.legalTOC} className={`${tocOpen ? "block" : "hidden"} mt-3 border border-forest-900/10 bg-white p-4 lg:sticky lg:top-32 lg:mt-0 lg:block`}><h2 className="mb-3 text-xs font-extrabold uppercase tracking-[.15em] text-slate-600">{t.legalTOC}</h2><ol className="grid gap-1">{sections.map((section: { id: string; title: string }) => <li key={section.id}><a href={`#${section.id}`} onClick={() => setTocOpen(false)} className="flex min-h-11 items-center px-3 text-sm font-bold leading-5 text-slate-700 hover:bg-[#f7f8f5] hover:text-wood-600">{section.title}</a></li>)}</ol></nav>
          </aside>
          <div className="min-w-0 space-y-5">
            {sections.map((section: { id: string; title: string; content: string[] }, index: number) => <section key={section.id} id={section.id} className="scroll-mt-32 border border-forest-900/10 bg-white p-6 sm:p-8"><p className="text-xs font-extrabold uppercase tracking-[.15em] text-wood-600">Mục {String(index + 1).padStart(2, "0")}</p><h2 className="mt-3 text-xl font-extrabold leading-tight text-forest-950 sm:text-2xl">{section.title.replace(/^\d+\.\s*/, "")}</h2><div className="mt-5 space-y-4 text-[15px] leading-8 text-slate-700">{section.content.map((paragraph: string, paragraphIndex: number) => <p key={paragraphIndex}>{paragraph}</p>)}</div></section>)}
            {type === "privacy" ? <div className="border border-forest-900/10 bg-[#edf4ef] p-6 sm:p-8"><h2 className="text-xl font-extrabold text-forest-950">Cần trao đổi về dữ liệu hoặc yêu cầu liên hệ?</h2><p className="mt-3 leading-7 text-slate-700">Liên hệ trực tiếp với Tùng Phát qua các kênh được công bố trên website.</p><TrackedLink href={ZALO_URL} target="_blank" rel="noopener noreferrer" eventName="click_zalo" eventProperties={{ location: "privacy_cta" }} className="pressable mt-5 inline-flex min-h-12 items-center gap-2 bg-wood-500 px-5 text-sm font-extrabold text-white"><MessageCircle size={17} aria-hidden="true" />Liên hệ qua Zalo</TrackedLink></div> : null}
          </div>
        </div>
      </section>
    </>
  );
}
