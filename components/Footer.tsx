"use client";

import { Hash, MapPin, Phone } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { TrackedLink } from "@/components/TrackedLink";
import { translations } from "@/lib/i18n";
import { useLang } from "@/lib/i18n-context";
import { locations } from "@/lib/locations";
import { BUSINESS_NAME, PHONE_DISPLAY, PHONE_HREF, TAX_ID } from "@/lib/seo";

export function Footer() {
  const { lang } = useLang();
  const t = translations[lang];

  return (
    <footer className="bg-[#071f18] text-white">
      <div className="container-shell py-16 lg:py-20">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-[1.2fr_.68fr_.68fr_.78fr_1.25fr] xl:grid-cols-[1.28fr_.68fr_.68fr_.78fr_1.35fr]">
          <div>
            <div className="inline-flex rounded-md border border-white/20 bg-[#f8f5ef] p-4 shadow-[0_1px_0_rgba(255,255,255,0.08)_inset] sm:p-5">
              <Image
                src="/logo-vertical.png"
                alt="Tùng Phát"
                width={512}
                height={412}
                quality={95}
                loading="eager"
                className="h-auto w-[142px] sm:w-[158px]"
              />
            </div>
            <div className="mt-8 space-y-4">
              <p className="text-xs font-bold uppercase tracking-[.12em] text-white/40">
                {lang === "vi" ? "Về chúng tôi" : "About us"}
              </p>
              <p className="text-[.8125rem] font-bold leading-6 text-white">{BUSINESS_NAME.toUpperCase()}</p>
              <div className="h-px w-8 bg-wood-500/60" />
              <div className="space-y-3 text-sm text-white/60">
                <TrackedLink
                  href={PHONE_HREF}
                  eventName="click_phone"
                  eventProperties={{ location: "footer" }}
                  className="flex items-center gap-3 font-bold text-white transition-colors hover:text-wood-500"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5">
                    <Phone size={12} className="text-wood-500" />
                  </span>
                  {PHONE_DISPLAY}
                </TrackedLink>
                <p className="flex items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5">
                    <Hash size={12} className="text-white/40" />
                  </span>
                  MST: {TAX_ID}
                </p>
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5">
                    <MapPin size={12} className="text-white/40" />
                  </span>
                  <div className="space-y-4">
                    {locations.map((location) => (
                      <p key={location.id}>
                        <span className="mb-1 block text-[.7rem] font-bold uppercase tracking-widest text-wood-500/90">{location.shortId}</span>
                        <span className="font-semibold leading-6 text-white/92">{location.address}</span>
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[.12em] text-white/40">{t.footerMaterials}</p>
            <div className="mt-5 space-y-2.5 text-sm text-white/60">
              <Link href="/go-ghep" className="block transition-colors hover:text-white">Gỗ ghép</Link>
              <Link href="/go-ghep-cao-su" className="block transition-colors hover:text-white">Gỗ ghép cao su</Link>
              <Link href="/go-ghep-tram" className="block transition-colors hover:text-white">Gỗ ghép tràm</Link>
              <Link href="/van-mdf" className="block transition-colors hover:text-white">Ván MDF</Link>
              <Link href="/mdf-chong-am" className="block transition-colors hover:text-white">MDF chống ẩm</Link>
              <Link href="/san-pham#catalogue" className="block transition-colors hover:text-white">{t.footerCatalogue}</Link>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[.12em] text-white/40">{t.footerServices}</p>
            <div className="mt-5 space-y-2.5 text-sm text-white/60">
              <Link href="/gia-cong-cnc" className="block transition-colors hover:text-white">{t.footerCNC}</Link>
              <Link href="/du-an" className="block transition-colors hover:text-white">Dự án</Link>
              <Link href="/bai-viet" className="block transition-colors hover:text-white">Bài viết</Link>
              <Link href="/#thu-vien" className="block transition-colors hover:text-white">{t.footerLibrary}</Link>
              <Link href="/san-pham#catalogue" className="block transition-colors hover:text-white">{t.footerCatalogue}</Link>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[.12em] text-white/40">{t.footerLegal}</p>
            <div className="mt-5 space-y-2.5 text-sm text-white/60">
              <Link href="/chinh-sach-bao-mat" className="block transition-colors hover:text-white">{t.footerPrivacy}</Link>
              <Link href="/dieu-khoan-su-dung" className="block transition-colors hover:text-white">{t.footerTerms}</Link>
              <Link href="/lien-he" className="block transition-colors hover:text-white">{t.footerContact}</Link>
            </div>
          </div>

          <div className="sm:col-span-2 lg:col-span-1">
            <p className="text-xs font-bold uppercase tracking-[.12em] text-white/40">{t.footerBranchesEyebrow}</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {locations.map((location) => (
                <article key={location.id} className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.045]">
                  <div className="px-4 py-3">
                    <span className="text-[.68rem] font-extrabold uppercase tracking-[.16em] text-wood-500">{location.name}</span>
                    <p className="mt-1 text-xs font-semibold leading-5 text-white/88">{location.address}</p>
                  </div>
                  <div className="h-[140px] border-t border-white/10 bg-white/5 sm:h-[150px] lg:h-[145px]">
                    <iframe
                      src={location.embedSrc}
                      title={`Google Maps – ${location.name}`}
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
          <Link href="/" className="text-white/20 transition hover:text-white/45">mdftungphat.com</Link>
        </div>
      </div>
    </footer>
  );
}
