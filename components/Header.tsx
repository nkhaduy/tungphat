"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronDown, FileText, Menu, Phone, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLang } from "@/lib/i18n-context";
import { translations } from "@/lib/i18n";

const productSlugs = ["an-cuong", "thanh-thuy", "ba-thanh"] as const;

// Premium easing — deceleration curve, no bounce
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

export function Header() {
  const { lang, setLang } = useLang();
  const t = translations[lang];
  const [open, setOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  // scrolled = hero has left the viewport → light header
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const hero = document.getElementById("trang-chu");

    // Pages without a hero (sub-pages, legal, products) default to light header
    if (!hero) {
      setScrolled(true);
      return;
    }

    // Sentinel element pinned to the bottom edge of the hero
    const sentinel = document.createElement("div");
    sentinel.setAttribute("aria-hidden", "true");
    sentinel.style.cssText =
      "position:absolute;bottom:0;left:0;width:1px;height:1px;pointer-events:none;";
    const heroPos = getComputedStyle(hero).position;
    if (heroPos === "static") hero.style.position = "relative";
    hero.appendChild(sentinel);

    // rootMargin: -82px from top creates hysteresis matching header height.
    // The sentinel is considered "visible" only when it clears the fixed header.
    // This prevents flicker when slowly scrolling near the hero boundary.
    const observer = new IntersectionObserver(
      ([entry]) => setScrolled(!entry.isIntersecting),
      { rootMargin: "-82px 0px 0px 0px", threshold: 0 }
    );
    observer.observe(sentinel);

    return () => {
      observer.disconnect();
      sentinel.remove();
    };
  }, []);

  const productLinks: [string, string][] = [
    [t.navAllProducts, "/san-pham"],
    ...productSlugs.map((slug) => [
      slug === "an-cuong" ? "An Cường" : slug === "thanh-thuy" ? "Thanh Thùy" : "Ba Thanh",
      `/san-pham/${slug}`,
    ] as [string, string]),
    [t.navCatalogues, "/san-pham#catalogue"],
  ];

  const links: [string, string][] = [
    [t.navHome, "/#trang-chu"],
    [t.navCNC, "/#cnc"],
    [t.navLibrary, "/#thu-vien"],
    [t.navContact, "/#bao-gia"],
  ];

  const toggleLang = () => setLang(lang === "vi" ? "en" : "vi");

  // ─── Inline style helpers for staggered transitions ──────────────────────────

  const bgStyle: React.CSSProperties = {
    backgroundColor: scrolled ? "rgba(255,255,255,0.96)" : "transparent",
    borderColor: scrolled ? "rgba(0,0,0,0.08)" : "transparent",
    boxShadow: scrolled ? "0 1px 18px rgba(0,0,0,0.07)" : "none",
    backdropFilter: scrolled ? "blur(12px)" : "none",
    WebkitBackdropFilter: scrolled ? "blur(12px)" : "none",
    // Header height: taller over hero, compact after scroll
    height: scrolled ? "72px" : "82px",
    transition: [
      `background-color 300ms ${EASE}`,
      `border-color 280ms ${EASE}`,
      `box-shadow 280ms ${EASE}`,
      `height 300ms ${EASE}`,
      `backdrop-filter 300ms ${EASE}`,
    ].join(", "),
  };

  const logoWhiteStyle: React.CSSProperties = {
    opacity: scrolled ? 0 : 1,
    transform: scrolled ? "scale(0.985)" : "scale(1)",
    transition: [
      `opacity 180ms ${EASE}`,
      `transform 200ms ${EASE}`,
    ].join(", "),
  };

  const logoColorStyle: React.CSSProperties = {
    opacity: scrolled ? 1 : 0,
    transform: scrolled ? "scale(1)" : "scale(1.015)",
    transition: [
      `opacity 180ms ${EASE}`,
      `transform 200ms ${EASE}`,
    ].join(", "),
  };

  const navTextClass = scrolled
    ? "text-ink/65 hover:text-ink"
    : "text-white/80 hover:text-white";

  const navTextStyle: React.CSSProperties = {
    transition: `color 220ms ${EASE}`,
  };

  const iconTextStyle: React.CSSProperties = {
    color: scrolled ? "rgba(22,33,27,0.7)" : "rgba(255,255,255,0.85)",
    transition: `color 220ms ${EASE}`,
  };

  return (
    <header
      className="site-header fixed inset-x-0 top-0 z-50 border-b"
      style={bgStyle}
    >
      <div className="container-shell flex h-full items-center justify-between gap-5">

        {/* ── Logo ── */}
        {/*
          Both images occupy the same fixed box.
          Color logo is at position absolute on top of white logo.
          object-contain + object-left keeps them aligned.
          w/h sized for the no-tagline aspect ratio (~3.3:1).
        */}
        <Link
          href="/"
          aria-label="Tùng Phát — Trang chủ"
          className="relative shrink-0"
          style={{ width: 210, height: 64 }}
        >
          {/* White logo — visible over hero */}
          <Image
            src="/logo-h-white.png"
            alt="Tùng Phát"
            fill
            sizes="210px"
            quality={95}
            className="object-contain object-left"
            style={logoWhiteStyle}
            priority
          />
          {/* Color logo — visible on light header */}
          <Image
            src="/logo-h-color.png"
            alt="Tùng Phát"
            fill
            sizes="210px"
            quality={95}
            className="object-contain object-left"
            style={logoColorStyle}
            priority
          />
        </Link>

        {/* ── Desktop nav ── */}
        <nav className="hidden items-center gap-6 xl:flex" aria-label="Điều hướng chính">
          <a
            href={links[0][1]}
            className={`text-[.8125rem] font-bold transition-none ${navTextClass}`}
            style={navTextStyle}
          >
            {links[0][0]}
          </a>

          <div className="group relative flex items-center">
            <a
              href="/san-pham"
              className={`py-7 text-[.8125rem] font-bold transition-none ${navTextClass}`}
              style={navTextStyle}
            >
              {t.navProducts}
            </a>
            <button
              type="button"
              aria-label={t.mobileOpenProducts}
              aria-haspopup="true"
              className="grid h-11 w-7 place-items-center"
              style={iconTextStyle}
            >
              <ChevronDown size={14} />
            </button>
            <div className="invisible absolute left-0 top-full w-60 translate-y-2 bg-white p-2 text-forest-950 opacity-0 shadow-lg transition duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
              {productLinks.map(([label, href]) => (
                <a
                  key={href}
                  href={href}
                  className="flex min-h-11 items-center px-4 text-sm font-bold transition hover:bg-[#eef1ed] focus:bg-[#eef1ed]"
                >
                  {label}
                </a>
              ))}
            </div>
          </div>

          {links.slice(1).map(([label, href]) => (
            <a
              key={href}
              href={href}
              className={`text-[.8125rem] font-bold transition-none ${navTextClass}`}
              style={navTextStyle}
            >
              {label}
            </a>
          ))}
        </nav>

        {/* ── Desktop actions ── */}
        <div className="hidden items-center gap-2 lg:flex">
          <button
            type="button"
            onClick={toggleLang}
            aria-label="Chuyển ngôn ngữ"
            className="inline-flex min-h-11 items-center gap-1 px-2 text-xs font-bold"
            style={iconTextStyle}
          >
            <span className={lang === "vi" ? "text-wood-500" : ""}
              style={{ transition: `color 220ms ${EASE}` }}
            >VI</span>
            <span style={{ ...iconTextStyle, opacity: 0.4 }}>|</span>
            <span className={lang === "en" ? "text-wood-500" : ""}
              style={{ transition: `color 220ms ${EASE}` }}
            >EN</span>
          </button>

          <a
            href="tel:0909259160"
            className="inline-flex min-h-11 items-center gap-2 px-3 text-sm font-bold"
            style={iconTextStyle}
          >
            <Phone size={16} /> {t.phoneLabel}
          </a>

          <a
            href="/#bao-gia"
            className="inline-flex min-h-11 items-center gap-2 bg-wood-500 px-4 text-sm font-bold text-white transition hover:bg-wood-600"
          >
            <FileText size={16} /> {t.ctaGetQuote}
          </a>
        </div>

        {/* ── Mobile hamburger ── */}
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-label={open ? t.mobileCloseMenu : t.mobileOpenMenu}
          className="grid h-11 w-11 place-items-center border lg:hidden"
          style={{
            borderColor: scrolled ? "rgba(22,33,27,0.18)" : "rgba(255,255,255,0.28)",
            color: scrolled ? "rgba(22,33,27,0.8)" : "rgba(255,255,255,0.9)",
            transition: `border-color 260ms ${EASE}, color 220ms ${EASE}`,
          }}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* ── Mobile drawer — always dark, always white logo ── */}
      {open && (
        <div className="border-t border-white/10 bg-forest-950 px-4 pb-5 text-white lg:hidden">
          {/* Drawer logo */}
          <div className="flex items-center py-4">
            <Image
              src="/logo-h-white.png"
              alt="Tùng Phát"
              width={794}
              height={246}
              quality={95}
              className="h-auto w-[148px]"
            />
          </div>
          <div className="h-px bg-white/10 mb-1" />

          <a href={links[0][1]} onClick={() => setOpen(false)} className="block min-h-12 border-b border-white/10 py-4 text-sm font-bold">
            {links[0][0]}
          </a>

          <div className="border-b border-white/10">
            <div className="flex items-center">
              <a href="/san-pham" onClick={() => setOpen(false)} className="flex min-h-12 flex-1 items-center py-4 text-sm font-bold">
                {t.navProducts}
              </a>
              <button
                type="button"
                onClick={() => setProductsOpen(!productsOpen)}
                aria-expanded={productsOpen}
                aria-controls="mobile-products"
                aria-label={productsOpen ? t.mobileCloseProducts : t.mobileOpenProducts}
                className="grid h-12 w-12 place-items-center"
              >
                <ChevronDown size={18} className={`transition-transform ${productsOpen ? "rotate-180" : ""}`} />
              </button>
            </div>
            {productsOpen && (
              <div id="mobile-products" className="mb-3 border-l border-white/20 pl-4">
                {productLinks.map(([label, href]) => (
                  <a key={href} href={href} onClick={() => setOpen(false)} className="flex min-h-11 items-center text-sm text-white/75">
                    {label}
                  </a>
                ))}
              </div>
            )}
          </div>

          {links.slice(1).map(([label, href]) => (
            <a key={href} href={href} onClick={() => setOpen(false)} className="block min-h-12 border-b border-white/10 py-4 text-sm font-bold">
              {label}
            </a>
          ))}

          <div className="mt-4 flex items-center justify-between">
            <button type="button" onClick={toggleLang} aria-label="Chuyển ngôn ngữ" className="inline-flex min-h-12 items-center gap-1 px-3 text-sm font-bold text-white/75">
              <span className={lang === "vi" ? "text-wood-500" : ""}>VI</span>
              <span className="text-white/40">|</span>
              <span className={lang === "en" ? "text-wood-500" : ""}>EN</span>
            </button>
            <a href="tel:0909259160" className="flex min-h-12 items-center justify-center gap-2 bg-wood-500 px-4 font-bold text-white">
              <Phone size={17} /> {t.callLabel}
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
