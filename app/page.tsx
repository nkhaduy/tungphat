"use client";

import Image from "next/image";
import { ArrowRight, Boxes, Check, Layers3, MapPin, MessageCircle, Phone, Ruler, ShieldCheck } from "lucide-react";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Footer } from "@/components/Footer";
import { Reveal } from "@/components/Reveal";
import { SectionTitle } from "@/components/SectionTitle";
import { Partners } from "@/components/Partners";
import { WorkshopMedia } from "@/components/WorkshopMedia";
import { TrackedLink } from "@/components/TrackedLink";
import { TrustindexReviews } from "@/components/reviews/TrustindexReviews";
import { useLang } from "@/lib/i18n-context";
import { translations } from "@/lib/i18n";
import { locations } from "@/lib/locations";
import { GOOGLE_REVIEWS_URL, PHONE_DISPLAY, PHONE_HREF, ZALO_URL } from "@/lib/seo";

const categoryImages = [
  "/wood/mdfmfc.png",
  "/wood/vanchongam.png",
  "/wood/plywood.png",
  "/wood/melamine.png",
  "/wood/laminate.png",
  "/wood/arcrylic.png",
  "/wood/veneer.png",
  "/wood/tamtrangtri.png",
];

export default function Home() {
  const { lang } = useLang();
  const t = translations[lang];

  return (
    <>
      <Header />
      <main>
        <Hero />
        <Partners />

      {/* Product categories */}
      <section id="san-pham" className="bg-[#f6f7f5] py-20 lg:py-28">
        <div className="container-shell">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <SectionTitle eyebrow={t.categoryEyebrow} title={t.categoryTitle} />
            <TrackedLink href={ZALO_URL} target="_blank" rel="noopener noreferrer" eventName="click_zalo" eventProperties={{ location: "product_categories" }} aria-label={t.categoryCtaCheck} className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-forest-900">{t.categoryCtaCheck} <MessageCircle size={17} className="text-wood-600" /></TrackedLink>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {t.categories.map(([name, text]: string[], index: number) => (
              <Reveal key={name} delay={index * .035}>
                <article className="group relative min-h-[370px] overflow-hidden bg-forest-950 text-white">
                  <Image src={categoryImages[index]} alt={`Bề mặt ${name}`} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" quality={95} className="object-cover" />
                  <div className="absolute inset-0 card-gradient-overlay" />
                  <div className="absolute inset-x-0 bottom-0 p-6">
                    <span className="text-xs font-bold text-orange-300">{String(index + 1).padStart(2, "0")}</span>
                    <h3 className="mt-2 text-xl font-extrabold">{name}</h3>
                    <p className="mt-3 text-sm leading-6 text-white/72">{text}</p>
                    <TrackedLink href={ZALO_URL} target="_blank" rel="noopener noreferrer" eventName="request_quote" eventProperties={{ location: "product_card", category: name }} aria-label={t.categoryCtaRequest} className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-bold">{t.categoryCtaRequest} <ArrowRight size={16} /></TrackedLink>
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
              <TrackedLink href={ZALO_URL} target="_blank" rel="noopener noreferrer" eventName="click_zalo" eventProperties={{ location: "home_cnc" }} aria-label={t.cncCta} className="mt-8 inline-flex min-h-14 items-center gap-2 bg-wood-500 px-7 text-sm font-bold transition hover:-translate-y-0.5 hover:bg-wood-600"><MessageCircle size={18} /> {t.cncCta}</TrackedLink>
            </div>
          </Reveal>
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

      {/* Google reviews */}
      <section className="bg-white py-20 lg:py-28">
        <div className="container-shell">
          <SectionTitle
            eyebrow="ĐÁNH GIÁ TỪ GOOGLE"
            title="Khách hàng nói gì về Tùng Phát"
            description="Những chia sẻ thực tế từ khách hàng đã sử dụng sản phẩm và dịch vụ tại Tùng Phát."
            centered
            wide
          />
          <div className="mx-auto mt-12 w-full max-w-5xl min-w-0">
            <TrustindexReviews />
          </div>
          <div className="mt-8 text-center">
            <TrackedLink
              href={GOOGLE_REVIEWS_URL}
              target="_blank"
              rel="noopener noreferrer"
              eventName="click_directions"
              eventProperties={{ location: "home_reviews" }}
              className="inline-flex min-h-12 items-center justify-center gap-2 border border-forest-900/20 px-6 text-sm font-bold text-forest-950 transition hover:border-wood-600 hover:text-wood-700"
            >
              Xem đánh giá trên Google <ArrowRight size={17} />
            </TrackedLink>
          </div>
        </div>
      </section>

      {/* Branch maps */}
      <section className="bg-[#f6f7f5] py-16 lg:py-24">
        <div className="container-shell">
          <SectionTitle
            eyebrow={t.footerBranchesEyebrow}
            title={t.footerBranchesTitle}
            centered
          />
          <div className="mt-10 grid gap-5 lg:grid-cols-2">
            {locations.map((branch) => (
              <article
                key={branch.id}
                id={branch.id}
                className="overflow-hidden rounded-[20px] border border-forest-900/12 bg-[#fffdf8] text-forest-950 shadow-[0_1px_2px_rgba(10,42,28,.05),0_18px_46px_rgba(10,42,28,.08)]"
              >
                <div className="p-5 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <span className="text-xs font-extrabold uppercase tracking-[.18em] text-wood-600">{branch.shortId}</span>
                      <h3 className="mt-2 text-lg font-extrabold">{branch.name}</h3>
                    </div>
                    <MapPin size={22} className="text-wood-600" aria-hidden="true" />
                  </div>
                  <p className="mt-3 text-sm font-semibold leading-6 text-forest-900/86">{branch.address}</p>
                </div>
                <div className="h-[230px] border-t border-forest-900/10 bg-forest-950/5 sm:h-[270px] lg:h-[300px]">
                  <iframe
                    src={branch.embedSrc}
                    title={`Google Maps – ${branch.name}`}
                    loading="lazy"
                    allowFullScreen
                    referrerPolicy="strict-origin-when-cross-origin"
                    className="h-full w-full"
                    style={{ border: 0 }}
                  />
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section id="bao-gia" className="bg-white py-20 lg:py-28">
        <div className="container-shell">
          <div className="relative min-h-[420px] overflow-hidden rounded-[18px] border border-white/20 bg-forest-950 px-6 py-14 text-white shadow-[0_1px_0_rgba(255,255,255,0.12)_inset,0_18px_48px_rgba(6,43,29,0.10)] sm:min-h-[460px] sm:rounded-[24px] sm:px-10 lg:px-14 lg:py-16">
            <Image
              src="/images/hero-workshop2.png"
              alt="Vân gỗ và máy CNC tại Tùng Phát"
              fill
              sizes="100vw"
              quality={95}
              className="pointer-events-none scale-[1.006] object-cover blur-[0.45px] saturate-[.9] contrast-[1.03] brightness-[.86]"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-forest-950/88 via-forest-950/66 to-forest-900/28" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_46%,rgba(6,43,29,0.76)_0%,rgba(6,43,29,0.46)_34%,rgba(6,43,29,0)_66%)]" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-forest-950/10 via-transparent to-forest-950/22" />
            <div className="relative z-10 flex min-h-[300px] max-w-3xl flex-col justify-center sm:min-h-[330px]">
              <span className="eyebrow text-orange-300">{t.contactEyebrow}</span>
              <h2 className="text-balance mt-5 font-display text-3xl font-extrabold leading-tight tracking-[-0.035em] sm:text-4xl lg:text-[3.1rem] lg:leading-[1.22]">{t.contactTitle}</h2>
              <p className="text-pretty mt-5 max-w-2xl text-sm leading-7 text-white/78 sm:text-base">{t.contactDescription}</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <TrackedLink href={ZALO_URL} target="_blank" rel="noopener noreferrer" eventName="click_zalo" eventProperties={{ location: "home_contact" }} aria-label={t.contactCta} className="inline-flex min-h-14 items-center justify-center gap-2 bg-wood-500 px-7 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-wood-600">
                  <MessageCircle size={18} /> {t.contactCta}
                </TrackedLink>
                <TrackedLink href={PHONE_HREF} eventName="click_phone" eventProperties={{ location: "home_contact" }} className="inline-flex min-h-12 items-center gap-2 text-sm font-bold text-white/90 transition hover:text-white">
                  <Phone size={17} className="text-wood-500" /> {PHONE_DISPLAY}
                </TrackedLink>
              </div>
            </div>
          </div>
        </div>
      </section>

      </main>
      <Footer />
      <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-3">
        <TrackedLink
          href={ZALO_URL}
          target="_blank"
          rel="noopener noreferrer"
          eventName="click_zalo"
          eventProperties={{ location: "floating" }}
          aria-label="Mở Zalo Tùng Phát"
          className="grid h-[54px] w-[54px] place-items-center rounded-full bg-[#0068ff] text-[14px] font-extrabold text-white shadow-[0_6px_20px_rgba(0,0,0,0.22)] transition-transform hover:scale-[1.06] sm:h-[58px] sm:w-[58px] lg:h-[62px] lg:w-[62px] lg:text-[15px]"
        >
          Zalo
        </TrackedLink>
        <TrackedLink href={PHONE_HREF} eventName="click_phone" eventProperties={{ location: "floating" }} aria-label="Gọi Tùng Phát" className="grid h-[52px] w-[52px] place-items-center rounded-full bg-wood-500 text-white shadow-md sm:hidden"><Phone size={20} /></TrackedLink>
      </div>
    </>
  );
}
