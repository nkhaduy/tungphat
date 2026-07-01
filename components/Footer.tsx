"use client";

import { MapPin, Phone, Hash } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useLang } from "@/lib/i18n-context";
import { translations } from "@/lib/i18n";

export function Footer() {
  const { lang } = useLang();
  const t = translations[lang];

  return (
    <footer className="bg-[#071f18] text-white">
      <div className="container-shell py-16 lg:py-20">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_.75fr_.75fr_1fr]">

          {/* Brand block */}
          <div>
            <Image
              src="/logo-vertical-white.png"
              alt="Tùng Phát"
              width={560}
              height={680}
              quality={95}
              className="h-auto w-[140px] sm:w-[156px]"
            />
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
      </div>

      <div className="border-t border-white/[0.07] py-5">
        <div className="container-shell flex flex-col gap-2 text-xs text-white/30 sm:flex-row sm:items-center sm:justify-between">
          <span>{t.footerCopyright}</span>
          <span className="text-white/20">tungphatwood.vn</span>
        </div>
      </div>
    </footer>
  );
}
