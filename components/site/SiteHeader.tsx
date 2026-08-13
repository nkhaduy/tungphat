"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, MessageCircle } from "lucide-react";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  MobileNavigation,
  type NavigationItem,
} from "@/components/site/MobileNavigation";
import { TrackedLink } from "@/components/TrackedLink";
import { useLang } from "@/lib/i18n-context";
import {
  getSiteHeaderClasses,
  type SiteHeaderTone,
} from "@/lib/site-header";
import { ZALO_URL } from "@/lib/seo";

const productSlugs = [
  "/go-ghep",
  "/go-ghep-cao-su",
  "/go-ghep-tram",
  "/van-mdf",
  "/mdf-chong-am",
  "/van-go-cong-nghiep",
];

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
      label: "Mã màu",
      href: "/catalogue",
      prefetch: false,
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
    prefetch: "prefetch" in item ? item.prefetch : undefined,
  }));

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
              loading="eager"
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
            className="hidden items-center gap-4 xl:flex"
          >
            {items.map((item) => (
              <Link
                key={`${item.label}-${item.href}`}
                href={item.href}
                prefetch={item.prefetch}
                aria-current={item.active ? "page" : undefined}
                className={`site-header-nav-link relative inline-flex min-h-11 items-center text-[14px] font-extrabold transition-colors ${item.active ? "site-header-nav-link--active after:absolute after:inset-x-0 after:bottom-1 after:h-0.5 after:bg-wood-500" : "hover:text-wood-600"}`}
              >
                {item.label}
              </Link>
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
