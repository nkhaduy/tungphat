"use client";

import { Hash, MapPin, Phone } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useLang } from "@/lib/i18n-context";
import { translations } from "@/lib/i18n";

export function Footer() {
  const { lang } = useLang();
  const t = translations[lang];

  return (
    <footer className="bg-[#071f18] text-white">
      <div className="container-shell grid gap-12 py-16 sm:grid-cols-2 lg:grid-cols-[1.28fr_.8fr_.8fr_1fr] lg:py-20">
        <div>
          <Image
            src="/logo-vertical-white.png"
            alt="Tùng Phát"
            width={1400}
            height={1400}
            quality={95}
            className="h-auto w-[188px]"
          />
          <div className="mt-8 space-y-4 text-sm leading-relaxed text-white/72">
            <p className="max-w-[300px] font-bold uppercase leading-6 text-white">
              CÔNG TY TNHH TMDV GỖ TÙNG PHÁT
            </p>
            <a
              href="tel:0909259160"
              className="flex items-center gap-2 text-white transition hover:text-wood-500"
            >
              <Phone size={14} className="shrink-0 text-wood-500" />
              0909 259 160
            </a>
            <p className="flex items-center gap-2">
              <Hash size={14} className="shrink-0 text-white/50" />
              MST: 0319115830
            </p>
            <p className="flex items-start gap-2">
              <MapPin size={14} className="shrink-0 text-white/50" />
              <span>CN1:<br />14 Tam Bình,<br />Phường Hiệp Bình,<br />TP. Hồ Chí Minh</span>
            </p>
            <p className="flex items-start gap-2">
              <MapPin size={14} className="shrink-0 text-white/50" />
              <span>CN2:<br />81B Tam Bình,<br />Phường Hiệp Bình,<br />TP. Hồ Chí Minh</span>
            </p>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">
            {t.footerMaterials}
          </h3>
          <div className="mt-5 space-y-3 text-sm text-white/72">
            <Link href="/san-pham" className="block transition hover:text-white">
              MDF – MFC
            </Link>
            <Link href="/san-pham" className="block transition hover:text-white">
              Plywood
            </Link>
            <Link href="/san-pham" className="block transition hover:text-white">
              Melamine
            </Link>
            <Link href="/san-pham" className="block transition hover:text-white">
              Laminate
            </Link>
            <Link href="/san-pham" className="block transition hover:text-white">
              Acrylic
            </Link>
            <Link
              href="/san-pham#catalogue"
              className="block transition hover:text-white"
            >
              {t.footerCatalogue}
            </Link>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">
            {t.footerServices}
          </h3>
          <div className="mt-5 space-y-3 text-sm text-white/72">
            <a href="/#cnc" className="block transition hover:text-white">
              {t.footerCNC}
            </a>
            <a href="/#thu-vien" className="block transition hover:text-white">
              {t.footerLibrary}
            </a>
            <Link
              href="/san-pham#catalogue"
              className="block transition hover:text-white"
            >
              {t.footerCatalogue}
            </Link>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">
            {t.footerLegal}
          </h3>
          <div className="mt-5 space-y-3 text-sm text-white/72">
            <Link
              href="/chinh-sach-bao-mat"
              className="block transition hover:text-white"
            >
              {t.footerPrivacy}
            </Link>
            <Link
              href="/dieu-khoan-su-dung"
              className="block transition hover:text-white"
            >
              {t.footerTerms}
            </Link>
            <a href="/#bao-gia" className="block transition hover:text-white">
              {t.footerContact}
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 py-5">
        <div className="container-shell text-center text-xs text-white/40 sm:text-left">
          {t.footerCopyright}
        </div>
      </div>
    </footer>
  );
}
