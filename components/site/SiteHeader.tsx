"use client";

import Image from "next/image";
import Link from "next/link";
import { Mail, MapPin, Menu, MessageCircle, Phone } from "lucide-react";
import { usePathname } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import {
  MobileNavigation,
  type NavigationItem,
} from "@/components/site/MobileNavigation";
import { TrackedLink } from "@/components/TrackedLink";
import business from "@/content/settings/business.json";
import { useLang } from "@/lib/i18n-context";
import { PHONE_HREF, ZALO_URL } from "@/lib/seo";

const productSlugs = [
  "/go-ghep",
  "/go-ghep-cao-su",
  "/go-ghep-tram",
  "/van-mdf",
  "/mdf-chong-am",
  "/van-go-cong-nghiep",
];

export function SiteHeader() {
  const { lang, setLang } = useLang();
  const pathname = (usePathname() || "/").replace(/\/$/, "") || "/";
  const [menuOpen, setMenuOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const languageLabel = lang === "vi" ? "Chuyển ngôn ngữ" : "Switch language";
  const navConfig = [
    {
      label: lang === "vi" ? "Vật liệu" : "Materials",
      href: "/san-pham",
      match: (path: string) =>
        path === "/san-pham" || productSlugs.includes(path),
    },
    {
      label: lang === "vi" ? "Gia công CNC" : "CNC machining",
      href: "/gia-cong-cnc",
      match: (path: string) =>
        path === "/gia-cong-cnc" ||
        path === "/cat-cnc-go" ||
        path === "/gia-cong-cnc-mdf",
    },
    {
      label: lang === "vi" ? "Thương hiệu" : "Brands",
      href: "/san-pham#thuong-hieu",
      match: (path: string) => path.startsWith("/san-pham/"),
    },
    {
      label: lang === "vi" ? "Xưởng thực tế" : "Workshop",
      href: "/du-an",
      match: (path: string) => path.startsWith("/du-an"),
    },
    {
      label: "Catalogue",
      href: "/catalogue",
      match: (path: string) =>
        path === "/catalogue" ||
        path.startsWith("/catalogue/") ||
        path.startsWith("/ma-mau-melamine/"),
    },
    {
      label: lang === "vi" ? "Kiến thức" : "Insights",
      href: "/bai-viet",
      match: (path: string) => path.startsWith("/bai-viet"),
    },
    {
      label: lang === "vi" ? "Liên hệ" : "Contact",
      href: "/lien-he",
      match: (path: string) => path === "/lien-he" || path === "/bao-gia",
    },
  ] as const;
  const items: NavigationItem[] = navConfig.map((item) => ({
    label: item.label,
    href: item.href,
    active: item.match(pathname),
  }));

  const closeMenu = useCallback((restoreFocus = false) => {
    setMenuOpen(false);
    if (restoreFocus) requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-forest-900/10 bg-white shadow-header">
        <div className="hidden border-b border-forest-900/10 bg-[#f7f8f5] md:block">
          <div className="container-shell flex min-h-11 items-center justify-between gap-5 text-xs font-semibold text-slate-700">
            <div className="flex min-w-0 items-center gap-5">
              {business.locations.map((location) => (
                <a
                  key={location.id}
                  href={location.directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden min-w-0 items-center gap-2 hover:text-wood-600 xl:inline-flex"
                >
                  <MapPin
                    size={13}
                    className="shrink-0 text-wood-600"
                    aria-hidden="true"
                  />
                  <span className="truncate">{location.address}</span>
                </a>
              ))}
              <span className="inline-flex items-center gap-2 xl:hidden">
                <MapPin
                  size={13}
                  className="text-wood-600"
                  aria-hidden="true"
                />
                2 chi nhánh tại TP.HCM
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-5">
              <a
                href={PHONE_HREF}
                className="inline-flex min-h-11 items-center gap-2 font-bold text-forest-950 hover:text-wood-600"
              >
                <Phone size={14} className="text-wood-600" aria-hidden="true" />
                {business.phoneDisplay}
              </a>
              <a
                href={`mailto:${business.email}`}
                className="hidden min-h-11 items-center gap-2 hover:text-wood-600 lg:inline-flex"
              >
                <Mail size={14} className="text-wood-600" aria-hidden="true" />
                {business.email}
              </a>
              <button
                type="button"
                onClick={() => setLang(lang === "vi" ? "en" : "vi")}
                aria-label={languageLabel}
                className="inline-flex min-h-11 items-center gap-1.5 px-1 font-extrabold text-slate-600 hover:text-forest-950"
              >
                <span className={lang === "vi" ? "text-wood-600" : ""}>VI</span>
                <span aria-hidden="true" className="text-slate-300">
                  |
                </span>
                <span className={lang === "en" ? "text-wood-600" : ""}>EN</span>
              </button>
            </div>
          </div>
        </div>
        <div className="container-shell flex h-[72px] items-center justify-between gap-4">
          <Link
            href="/"
            aria-label="Tùng Phát - Trang chủ"
            className="relative block h-[46px] w-[196px] shrink-0 sm:w-[220px]"
          >
            <Image
              src="/logo-horizontal.webp"
              alt="Tùng Phát"
              fill
              sizes="220px"
              loading="eager"
              className="object-contain object-left"
            />
          </Link>
          <nav
            aria-label="Điều hướng chính"
            className="hidden items-center gap-4 xl:flex"
          >
            {items.map((item) => (
              <Link
                key={`${item.label}-${item.href}`}
                href={item.href}
                aria-current={item.active ? "page" : undefined}
                className={`relative inline-flex min-h-11 items-center text-[12px] font-extrabold transition-colors 2xl:text-[13px] ${item.active ? "text-wood-600 after:absolute after:inset-x-0 after:bottom-1 after:h-0.5 after:bg-wood-500" : "text-forest-950 hover:text-wood-600"}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <TrackedLink
            href={ZALO_URL}
            target="_blank"
            rel="noopener noreferrer"
            eventName="request_quote"
            eventProperties={{ location: "site_header", channel: "zalo" }}
            className="pressable hidden min-h-12 items-center justify-center gap-2 bg-wood-500 px-5 text-xs font-extrabold text-white shadow-[0_8px_20px_rgba(184,77,0,.2)] hover:bg-wood-600 xl:inline-flex"
          >
            <MessageCircle size={16} aria-hidden="true" />
            Gửi quy cách nhận báo giá
          </TrackedLink>
          <button
            ref={triggerRef}
            type="button"
            aria-label="Mở menu"
            aria-expanded={menuOpen}
            aria-controls="site-mobile-navigation"
            onClick={() => setMenuOpen(true)}
            className="pressable grid h-11 w-11 place-items-center border border-forest-900/20 text-forest-950 hover:border-wood-500 hover:text-wood-600 xl:hidden"
          >
            <Menu size={22} aria-hidden="true" />
          </button>
        </div>
      </header>
      <div id="site-mobile-navigation">
        <MobileNavigation
          open={menuOpen}
          items={items}
          lang={lang}
          languageLabel={languageLabel}
          onClose={closeMenu}
          onToggleLanguage={() => setLang(lang === "vi" ? "en" : "vi")}
        />
      </div>
    </>
  );
}
