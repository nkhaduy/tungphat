"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronDown, Menu, MessageCircle } from "lucide-react";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  MobileNavigation,
  type NavigationChild,
  type NavigationItem,
} from "@/components/site/MobileNavigation";
import { TrackedLink } from "@/components/TrackedLink";
import { useLang } from "@/lib/i18n-context";
import {
  getSiteHeaderClasses,
  type SiteHeaderTone,
} from "@/lib/site-header";
import { ZALO_URL } from "@/lib/seo";

export function SiteHeader({ tone = "light" }: { tone?: SiteHeaderTone }) {
  const { lang, setLang } = useLang();
  const pathname = (usePathname() || "/").replace(/\/$/, "") || "/";
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const languageLabel =
    lang === "vi"
      ? "Chuyển ngôn ngữ VI | EN"
      : "Switch language VI | EN";
  const materialChildren: NavigationChild[] = [
    { label: lang === "vi" ? "MDF" : "MDF", href: "/van-mdf", active: pathname === "/van-mdf" },
    { label: lang === "vi" ? "MDF chống ẩm" : "Moisture-resistant MDF", href: "/mdf-chong-am", active: pathname === "/mdf-chong-am" },
    { label: lang === "vi" ? "MFC & Plywood" : "MFC & Plywood", href: "/van-go-cong-nghiep", active: pathname === "/van-go-cong-nghiep" },
    { label: lang === "vi" ? "Gỗ ghép" : "Joined wood", href: "/go-ghep", active: pathname === "/go-ghep" || pathname === "/go-ghep-cao-su" || pathname === "/go-ghep-tram" },
  ];
  const catalogueChildren: NavigationChild[] = [
    { label: lang === "vi" ? "Tìm mã màu" : "Find a surface code", href: "/catalogue", active: pathname === "/catalogue", prefetch: false },
    { label: "An Cường", href: "/catalogue/an-cuong", active: pathname.startsWith("/catalogue/an-cuong"), prefetch: false },
    { label: "Thanh Thuỳ", href: "/catalogue/thanh-thuy", active: pathname.startsWith("/catalogue/thanh-thuy"), prefetch: false },
    { label: "Ba Thanh", href: "/catalogue/ba-thanh", active: pathname.startsWith("/catalogue/ba-thanh"), prefetch: false },
  ];
  const items: NavigationItem[] = [
    {
      label: lang === "vi" ? "Vật liệu" : "Materials",
      href: "/san-pham",
      active: pathname === "/san-pham" || materialChildren.some((child) => child.active),
      children: materialChildren,
    },
    {
      label: lang === "vi" ? "Mã màu / Catalogue" : "Surface codes / Catalogue",
      href: "/catalogue",
      prefetch: false,
      active: pathname === "/catalogue" || pathname.startsWith("/catalogue/") || pathname.startsWith("/ma-mau-melamine/"),
      children: catalogueChildren,
    },
    {
      label: lang === "vi" ? "Cắt & CNC" : "Cutting & CNC",
      href: "/gia-cong-cnc",
      active: pathname === "/gia-cong-cnc" || pathname === "/cat-cnc-go" || pathname === "/gia-cong-cnc-mdf",
    },
    {
      label: lang === "vi" ? "Xưởng & chi nhánh" : "Workshop & branches",
      href: "/du-an",
      active: pathname.startsWith("/du-an") || pathname.startsWith("/chi-nhanh"),
    },
    {
      label: lang === "vi" ? "Kiến thức" : "Insights",
      href: "/bai-viet",
      active: pathname.startsWith("/bai-viet"),
    },
    {
      label: lang === "vi" ? "Liên hệ" : "Contact",
      href: "/lien-he",
      active: pathname === "/lien-he" || pathname === "/bao-gia",
    },
  ];

  const closeMenu = useCallback((restoreFocus = false) => {
    setMenuOpen(false);
    if (restoreFocus) requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);

  useEffect(() => {
    const updateScrolled = () => setScrolled(window.scrollY > 12);
    updateScrolled();
    window.addEventListener("scroll", updateScrolled, { passive: true });
    return () => window.removeEventListener("scroll", updateScrolled);
  }, []);

  return (
    <>
      <header
        className={`site-header sticky top-0 z-50 ${getSiteHeaderClasses(scrolled, tone)}`}
        data-scrolled={scrolled ? "true" : "false"}
        data-tone={tone}
      >
        <div className="container-shell flex h-[80px] items-center justify-between gap-4">
          <Link
            href="/"
            aria-label="Tùng Phát - Trang chủ"
            className="relative block h-[50px] w-[210px] shrink-0 sm:w-[236px]"
          >
            <Image
              src="/logo-horizontal.webp"
              alt="Tùng Phát"
              fill
              sizes="236px"
              priority
              className="site-header-logo site-header-logo--default object-contain object-left"
            />
            <Image
              src="/logo-horizontal-white.png"
              alt=""
              fill
              sizes="236px"
              loading="eager"
              className="site-header-logo site-header-logo--inverse object-contain object-left"
              aria-hidden="true"
            />
          </Link>
          <nav
            aria-label="Điều hướng chính"
            className="hidden items-center gap-3 xl:flex"
          >
            {items.map((item) => (
              item.children?.length ? (
                <details key={`${item.label}-${item.href}`} className="site-header-nav-group group relative">
                  <summary className={`site-header-nav-link inline-flex min-h-11 cursor-pointer list-none items-center gap-1 text-[13px] font-extrabold transition-colors marker:hidden ${item.active ? "site-header-nav-link--active text-wood-600" : "hover:text-wood-600"}`}>
                    {item.label}<ChevronDown size={15} aria-hidden="true" className="transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="absolute left-1/2 top-full z-20 mt-1 min-w-56 -translate-x-1/2 border border-forest-900/10 bg-white p-2 shadow-[0_16px_40px_rgba(7,59,40,.14)]">
                    <Link href={item.href} prefetch={item.prefetch} className="flex min-h-10 items-center px-3 text-sm font-extrabold text-forest-950 hover:bg-[#f7f9f6] hover:text-wood-600">
                      {lang === "vi" ? `Tổng quan ${item.label.toLowerCase()}` : `Overview ${item.label}`}
                    </Link>
                    {item.children.map((child) => (
                      <Link key={`${child.label}-${child.href}`} href={child.href} prefetch={child.prefetch} aria-current={child.active ? "page" : undefined} className={`flex min-h-10 items-center px-3 text-sm font-bold ${child.active ? "bg-[#edf4ef] text-wood-600" : "text-slate-700 hover:bg-[#f7f9f6] hover:text-wood-600"}`}>
                        {child.label}
                      </Link>
                    ))}
                  </div>
                </details>
              ) : (
                <Link
                  key={`${item.label}-${item.href}`}
                  href={item.href}
                  prefetch={item.prefetch}
                  aria-current={item.active ? "page" : undefined}
                  className={`site-header-nav-link relative inline-flex min-h-11 items-center text-[13px] font-extrabold transition-colors ${item.active ? "site-header-nav-link--active after:absolute after:inset-x-0 after:bottom-1 after:h-0.5 after:bg-wood-500" : "hover:text-wood-600"}`}
                >
                  {item.label}
                </Link>
              )
            ))}
          </nav>
          <button
            type="button"
            onClick={() => setLang(lang === "vi" ? "en" : "vi")}
            aria-label={languageLabel}
            className="site-header-language hidden min-h-11 shrink-0 items-center gap-1 px-1 text-[11px] font-extrabold xl:inline-flex"
          >
            <span className={lang === "vi" ? "text-wood-500" : ""}>VI</span>
            <span aria-hidden="true" className="site-header-language-divider">|</span>
            <span className={lang === "en" ? "text-wood-500" : ""}>EN</span>
          </button>
          <TrackedLink
            href={ZALO_URL}
            target="_blank"
            rel="noopener noreferrer"
            eventName="request_quote"
            eventProperties={{ location: "site_header", channel: "zalo" }}
            aria-label="Liên hệ Zalo qua số 0909 259 160"
            className="pressable hidden min-h-[52px] items-center justify-center gap-2 bg-wood-500 px-5 text-sm font-extrabold tabular-nums text-white shadow-[0_8px_20px_rgba(184,77,0,.2)] hover:bg-wood-600 xl:inline-flex"
          >
            <MessageCircle size={16} aria-hidden="true" />
            0909 259 160
          </TrackedLink>
          <button
            ref={triggerRef}
            type="button"
            aria-label="Mở menu"
            aria-expanded={menuOpen}
            aria-controls="site-mobile-navigation"
            onClick={() => setMenuOpen(true)}
            className="site-header-menu pressable grid h-12 w-12 place-items-center border hover:border-wood-500 hover:text-wood-600 xl:hidden"
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
