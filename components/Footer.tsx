"use client";

import { ExternalLink, Hash, MapPin, Phone } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useLang } from "@/lib/i18n-context";
import { translations } from "@/lib/i18n";

const branchMaps = [
  {
    id: "CN1",
    nameKey: "footerBranch1Name",
    address: "14 Tam Bình, phường Hiệp Bình, TP. Hồ Chí Minh",
    embedSrc:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3918.5370572533293!2d106.7289773!3d10.8466962!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x317527a60336dce9%3A0xe397be298b9a97af!2zQ-G7rWEgSMOgbmcgR-G7lyBHaMOpcCBUw7luZyBQaMOhdA!5e0!3m2!1svi!2s!4v1783761448496!5m2!1svi!2s",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=10.8466962,106.7289773",
    iframeTitle: "Google Maps – Tùng Phát CN1"
  },
  {
    id: "CN2",
    nameKey: "footerBranch2Name",
    address: "81B Tam Bình, phường Hiệp Bình, TP. Hồ Chí Minh",
    embedSrc:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3918.4493770330487!2d106.7307288!3d10.8533852!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x317527295201638d%3A0x96d9f4e833b55234!2zTURGIC0gQ05DIFTDmU5HIFBIw4FU!5e0!3m2!1svi!2s!4v1783761503530!5m2!1svi!2s",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=10.8533852,106.7307288",
    iframeTitle: "Google Maps – Tùng Phát CN2"
  }
] as const;

export function Footer() {
  const { lang } = useLang();
  const t = translations[lang];

  return (
    <footer className="bg-[#071f18] text-white">
      <div className="container-shell py-16 lg:py-20">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-[1.25fr_.8fr_.8fr_.9fr] xl:grid-cols-[1.35fr_.75fr_.75fr_1fr]">

          {/* Brand block */}
          <div>
            <div className="inline-flex rounded-md border border-white/20 bg-[#f8f5ef] p-4 shadow-[0_1px_0_rgba(255,255,255,0.08)_inset] sm:p-5">
              <Image
                src="/footer-logo-tung-phat.png"
                alt="Tùng Phát"
                width={1326}
                height={1099}
                quality={95}
                loading="eager"
                className="h-auto w-[142px] sm:w-[158px]"
              />
            </div>
            <div className="mt-8 space-y-4">
              <p className="text-xs font-bold uppercase tracking-[.12em] text-white/40">
                {lang === "vi" ? "Về chúng tôi" : "About us"}
              </p>
              <p className="text-[.8125rem] font-bold leading-6 text-white">
                CÔNG TY TNHH TMDV GỖ TÙNG PHÁT
              </p>
              <div className="h-px w-8 bg-wood-500/60" />
              <div className="space-y-3 text-sm text-white/60">
                <a
                  href="tel:0909259160"
                  className="flex items-center gap-3 font-bold text-white transition-colors hover:text-wood-500"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5">
                    <Phone size={12} className="text-wood-500" />
                  </span>
                  0909 259 160
                </a>
                <p className="flex items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5">
                    <Hash size={12} className="text-white/40" />
                  </span>
                  MST: 0319115830
                </p>
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5">
                    <MapPin size={12} className="text-white/40" />
                  </span>
                  <div className="space-y-3">
                    <p>
                      <span className="mb-0.5 block text-[.7rem] font-bold uppercase tracking-widest text-white/30">CN1</span>
                      14 Tam Bình, Phường Hiệp Bình,<br />TP. Hồ Chí Minh
                    </p>
                    <p>
                      <span className="mb-0.5 block text-[.7rem] font-bold uppercase tracking-widest text-white/30">CN2</span>
                      81B Tam Bình, Phường Hiệp Bình,<br />TP. Hồ Chí Minh
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Materials */}
          <div>
            <p className="text-xs font-bold uppercase tracking-[.12em] text-white/40">
              {t.footerMaterials}
            </p>
            <div className="mt-5 space-y-2.5 text-sm text-white/60">
              {["MDF – MFC", "Plywood", "Melamine", "Laminate", "Acrylic"].map((item) => (
                <Link key={item} href="/san-pham" className="block transition-colors hover:text-white">
                  {item}
                </Link>
              ))}
              <Link href="/san-pham#catalogue" className="block transition-colors hover:text-white">
                {t.footerCatalogue}
              </Link>
            </div>
          </div>

          {/* Services */}
          <div>
            <p className="text-xs font-bold uppercase tracking-[.12em] text-white/40">
              {t.footerServices}
            </p>
            <div className="mt-5 space-y-2.5 text-sm text-white/60">
              <a href="/#cnc" className="block transition-colors hover:text-white">
                {t.footerCNC}
              </a>
              <a href="/#thu-vien" className="block transition-colors hover:text-white">
                {t.footerLibrary}
              </a>
              <Link href="/san-pham#catalogue" className="block transition-colors hover:text-white">
                {t.footerCatalogue}
              </Link>
            </div>
          </div>

          {/* Legal */}
          <div>
            <p className="text-xs font-bold uppercase tracking-[.12em] text-white/40">
              {t.footerLegal}
            </p>
            <div className="mt-5 space-y-2.5 text-sm text-white/60">
              <Link href="/chinh-sach-bao-mat" className="block transition-colors hover:text-white">
                {t.footerPrivacy}
              </Link>
              <Link href="/dieu-khoan-su-dung" className="block transition-colors hover:text-white">
                {t.footerTerms}
              </Link>
              <a href="/#bao-gia" className="block transition-colors hover:text-white">
                {t.footerContact}
              </a>
            </div>
          </div>
        </div>

        <div className="mt-14 border-t border-white/[0.08] pt-12 lg:mt-16 lg:pt-14">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div className="max-w-2xl">
              <span className="eyebrow text-orange-300">{t.footerBranchesEyebrow}</span>
              <h2 className="mt-4 text-balance font-display text-2xl font-extrabold leading-tight text-white sm:text-3xl lg:text-[2.35rem]">
                {t.footerBranchesTitle}
              </h2>
              <p className="mt-4 text-sm leading-7 text-white/62 sm:text-base">
                {t.footerBranchesDescription}
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            {branchMaps.map((branch) => (
              <article
                key={branch.id}
                className="overflow-hidden rounded-[20px] border border-white/12 bg-[#f7f3eb] text-forest-950 shadow-[0_18px_50px_rgba(0,0,0,0.16)]"
              >
                <div className="p-5 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <span className="text-xs font-extrabold uppercase tracking-[.18em] text-wood-600">{branch.id}</span>
                      <h3 className="mt-2 text-lg font-extrabold">{t[branch.nameKey]}</h3>
                    </div>
                    <MapPin size={22} className="text-wood-600" aria-hidden="true" />
                  </div>
                  <p className="mt-3 text-sm leading-6 text-forest-900/72">{branch.address}</p>
                </div>
                <div className="h-[230px] border-y border-forest-900/10 bg-forest-950/5 sm:h-[260px] lg:h-[300px]">
                  <iframe
                    src={branch.embedSrc}
                    title={branch.iframeTitle}
                    loading="lazy"
                    allowFullScreen
                    referrerPolicy="strict-origin-when-cross-origin"
                    className="h-full w-full"
                    style={{ border: 0 }}
                  />
                </div>
                <div className="p-5 sm:p-6">
                  <a
                    href={branch.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-12 items-center justify-center gap-2 bg-wood-500 px-5 text-sm font-bold text-white transition hover:bg-wood-600"
                  >
                    {t.footerOpenGoogleMaps}
                    <ExternalLink size={16} aria-hidden="true" />
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-white/[0.07] py-5">
        <div className="container-shell flex flex-col gap-2 text-xs text-white/30 sm:flex-row sm:items-center sm:justify-between">
          <span>{t.footerCopyright}</span>
          <a href="https://mdftungphat.com" className="text-white/20 transition hover:text-white/45">mdftungphat.com</a>
        </div>
      </div>
    </footer>
  );
}
