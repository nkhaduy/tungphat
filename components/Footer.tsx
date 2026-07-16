"use client";

import { Hash, MapPin, Phone } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useLang } from "@/lib/i18n-context";
import { translations } from "@/lib/i18n";

const compactBranchMaps = [
  {
    id: "CN1",
    nameKey: "footerBranch1Name",
    address: "14 Tam Bình, phường Hiệp Bình, TP. Hồ Chí Minh",
    embedSrc:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3918.5370572533293!2d106.7289773!3d10.8466962!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x317527a60336dce9%3A0xe397be298b9a97af!2zQ-G7rWEgSMOgbmcgR-G7lyBHaMOpcCBUw7luZyBQaMOhdA!5e0!3m2!1svi!2s!4v1783761448496!5m2!1svi!2s",
    iframeTitle: "Google Maps – Tùng Phát CN1"
  },
  {
    id: "CN2",
    nameKey: "footerBranch2Name",
    address: "81B Tam Bình, phường Hiệp Bình, TP. Hồ Chí Minh",
    embedSrc:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3918.4493770330487!2d106.7307288!3d10.8533852!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x317527295201638d%3A0x96d9f4e833b55234!2zTURGIC0gQ05DIFTDmU5HIFBIw4FU!5e0!3m2!1svi!2s!4v1783761503530!5m2!1svi!2s",
    iframeTitle: "Google Maps – Tùng Phát CN2"
  }
] as const;

export function Footer() {
  const { lang } = useLang();
  const t = translations[lang];

  return (
    <footer className="bg-[#071f18] text-white">
      <div className="container-shell py-16 lg:py-20">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-[1.2fr_.68fr_.68fr_.78fr_1.25fr] xl:grid-cols-[1.28fr_.68fr_.68fr_.78fr_1.35fr]">

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
                  <div className="space-y-4">
                    <p>
                      <span className="mb-1 block text-[.7rem] font-bold uppercase tracking-widest text-wood-500/90">CN1</span>
                      <span className="font-semibold leading-6 text-white/92">14 Tam Bình, phường Hiệp Bình,<br />TP. Hồ Chí Minh</span>
                    </p>
                    <p>
                      <span className="mb-1 block text-[.7rem] font-bold uppercase tracking-widest text-wood-500/90">CN2</span>
                      <span className="font-semibold leading-6 text-white/92">81B Tam Bình, phường Hiệp Bình,<br />TP. Hồ Chí Minh</span>
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

          {/* Compact maps */}
          <div className="sm:col-span-2 lg:col-span-1">
            <p className="text-xs font-bold uppercase tracking-[.12em] text-white/40">
              {t.footerBranchesEyebrow}
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {compactBranchMaps.map((branch) => (
                <article key={branch.id} className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.045]">
                  <div className="px-4 py-3">
                    <span className="text-[.68rem] font-extrabold uppercase tracking-[.16em] text-wood-500">{t[branch.nameKey]}</span>
                    <p className="mt-1 text-xs font-semibold leading-5 text-white/88">{branch.address}</p>
                  </div>
                  <div className="h-[140px] border-t border-white/10 bg-white/5 sm:h-[150px] lg:h-[145px]">
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
                </article>
              ))}
            </div>
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
