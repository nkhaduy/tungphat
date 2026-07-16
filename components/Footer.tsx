"use client";

import { Hash, MapPin, Phone } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useLang } from "@/lib/i18n-context";
import { translations } from "@/lib/i18n";
import { TrackedLink } from "@/components/TrackedLink";
import { locations } from "@/lib/locations";
import { PHONE_DISPLAY, PHONE_HREF } from "@/lib/seo";

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
                src="/footer-logo-tung-phat.webp"
                alt="Tùng Phát"
                width={1326}
                height={1099}
                quality={95}
                className="h-auto w-[142px] sm:w-[158px]"
              />
            </div>
            <div className="mt-8 space-y-4">
              <p className="text-xs font-bold uppercase tracking-[.12em] text-white/60">
                {lang === "vi" ? "Về chúng tôi" : "About us"}
              </p>
              <p className="text-[.8125rem] font-bold leading-6 text-white">
                CÔNG TY TNHH TMDV GỖ TÙNG PHÁT
              </p>
              <div className="h-px w-8 bg-wood-500/60" />
              <div className="space-y-3 text-sm text-white/60">
                <TrackedLink
                  href={PHONE_HREF}
                  eventName="click_phone"
                  eventProperties={{ location: "footer" }}
                  className="flex min-h-11 items-center gap-3 font-bold text-white transition-colors hover:text-wood-500"
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
                  MST: 0319115830
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

          {/* Materials */}
          <div>
            <p className="text-xs font-bold uppercase tracking-[.12em] text-white/60">
              {t.footerMaterials}
            </p>
            <div className="mt-5 space-y-2.5 text-sm text-white/60">
              <Link href="/go-ghep" className="flex min-h-11 items-center transition-colors hover:text-white">Gỗ ghép</Link>
              <Link href="/go-ghep-cao-su" className="flex min-h-11 items-center transition-colors hover:text-white">Gỗ ghép cao su</Link>
              <Link href="/go-ghep-tram" className="flex min-h-11 items-center transition-colors hover:text-white">Gỗ ghép tràm</Link>
              <Link href="/van-mdf" className="flex min-h-11 items-center transition-colors hover:text-white">Ván MDF</Link>
              <Link href="/mdf-chong-am" className="flex min-h-11 items-center transition-colors hover:text-white">MDF chống ẩm</Link>
              <Link href="/san-pham#catalogue" className="flex min-h-11 items-center transition-colors hover:text-white">
                {t.footerCatalogue}
              </Link>
            </div>
          </div>

          {/* Services */}
          <div>
            <p className="text-xs font-bold uppercase tracking-[.12em] text-white/60">
              {t.footerServices}
            </p>
            <div className="mt-5 space-y-2.5 text-sm text-white/60">
              <Link href="/gia-cong-cnc" className="block min-h-11 content-center transition-colors hover:text-white">
                {t.footerCNC}
              </Link>
              <Link href="/cat-cnc-go" className="block min-h-11 content-center transition-colors hover:text-white">Cắt CNC gỗ</Link>
              <Link href="/gia-cong-cnc-mdf" className="block min-h-11 content-center transition-colors hover:text-white">CNC MDF</Link>
              <Link href="/du-an" className="block min-h-11 content-center transition-colors hover:text-white">Dự án</Link>
              <Link href="/bai-viet" className="block min-h-11 content-center transition-colors hover:text-white">Bài viết</Link>
              <Link href="/#thu-vien" className="block min-h-11 content-center transition-colors hover:text-white">
                {t.footerLibrary}
              </Link>
              <Link href="/san-pham#catalogue" className="flex min-h-11 items-center transition-colors hover:text-white">
                {t.footerCatalogue}
              </Link>
            </div>
          </div>

          {/* Legal */}
          <div>
            <p className="text-xs font-bold uppercase tracking-[.12em] text-white/60">
              {t.footerLegal}
            </p>
            <div className="mt-5 space-y-2.5 text-sm text-white/60">
              <Link href="/chinh-sach-bao-mat" className="flex min-h-11 items-center transition-colors hover:text-white">
                {t.footerPrivacy}
              </Link>
              <Link href="/dieu-khoan-su-dung" className="flex min-h-11 items-center transition-colors hover:text-white">
                {t.footerTerms}
              </Link>
              <Link href="/lien-he" className="block min-h-11 content-center transition-colors hover:text-white">
                {t.footerContact}
              </Link>
            </div>
          </div>

          {/* Compact maps */}
          <div className="sm:col-span-2 lg:col-span-1">
            <p className="text-xs font-bold uppercase tracking-[.12em] text-white/60">
              {t.footerBranchesEyebrow}
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {locations.map((branch) => (
                <article key={branch.id} className="rounded-xl border border-white/10 bg-white/[0.045]">
                  <div className="px-4 py-3">
                    <span className="text-[.68rem] font-extrabold uppercase tracking-[.16em] text-wood-500">{branch.shortId}</span>
                    <p className="mt-1 text-xs font-semibold leading-5 text-white/88">{branch.address}</p>
                    <TrackedLink href={branch.directionsUrl} target="_blank" rel="noopener noreferrer" eventName="click_directions" eventProperties={{ location: `footer_${branch.shortId}` }} className="mt-2 inline-flex min-h-11 items-center text-xs font-bold text-white hover:text-wood-500">
                      {lang === "vi" ? "Xem chỉ đường" : "Get directions"}
                    </TrackedLink>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>

      </div>

      <div className="border-t border-white/[0.07] py-5">
        <div className="container-shell flex flex-col gap-2 text-xs text-white/60 sm:flex-row sm:items-center sm:justify-between">
          <span>{t.footerCopyright}</span>
          <Link href="/" className="min-h-11 content-center text-white/60 transition hover:text-white">mdftungphat.com</Link>
        </div>
      </div>
    </footer>
  );
}
