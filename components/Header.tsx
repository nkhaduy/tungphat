"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronDown, MessageCircle, Menu, Phone, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useLang } from "@/lib/i18n-context";
import { translations } from "@/lib/i18n";
import { trackEvent } from "@/lib/analytics";
import { PHONE_HREF, ZALO_URL } from "@/lib/seo";

type HeaderProps = {
  appearance?: "adaptive" | "dark" | "light";
};

export function Header({ appearance = "adaptive" }: HeaderProps) {
  const { lang, setLang } = useLang();
  const t = translations[lang];
  const [open, setOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const lightStyle = appearance === "light" || scrolled;
  const darkStyle = appearance === "dark" && !scrolled;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const productLinks: [string, string][] = [
    [t.navAllProducts, "/san-pham"],
    ["Gỗ ghép", "/go-ghep"],
    ["Gỗ ghép cao su", "/go-ghep-cao-su"],
    ["Gỗ ghép tràm", "/go-ghep-tram"],
    ["Ván MDF", "/van-mdf"],
    ["MDF chống ẩm", "/mdf-chong-am"],
    ["Mã màu Thanh Thuỳ", "/thuong-hieu/thanh-thuy/"],
    [t.navCatalogues, "/san-pham#catalogue"]
  ];

  const links: [string, string][] = [
    [t.navHome, "/#trang-chu"],
    [t.navCNC, "/#cnc"],
    [t.navLibrary, "/#thu-vien"],
    [t.navContact, "/lien-he"]
  ];

  const toggleLang = () => setLang(lang === "vi" ? "en" : "vi");

  return (
    <header
      className={[
        "site-header fixed inset-x-0 top-0 z-50 border-b transition-all duration-300",
        lightStyle
          ? "border-black/[0.08] bg-white/95 shadow-[0_1px_12px_rgba(0,0,0,0.07)] backdrop-blur-md"
          : darkStyle
            ? "border-white/10 bg-forest-950"
            : "border-transparent bg-transparent"
      ].join(" ")}
    >
      <div className="container-shell flex h-[76px] items-center justify-between gap-5 xl:h-[78px]">
        {/* Logo — switches between white and color based on scroll */}
        <Link href="/" className="relative h-[52px] w-[232px] shrink-0 sm:w-[282px] xl:h-[56px] xl:w-[318px]">
          <Image
            src="/logo-horizontal-white.png"
            alt="Tùng Phát"
            fill
            sizes="(min-width: 1280px) 318px, 282px"
            quality={95}
            className={`object-contain object-left transition-opacity duration-300 ${lightStyle ? "opacity-0" : "opacity-100"}`}
            priority
          />
          <Image
            src="/logo-horizontal.png"
            alt="Tùng Phát"
            fill
            sizes="(min-width: 1280px) 318px, 282px"
            quality={95}
            className={`object-contain object-left transition-opacity duration-300 ${lightStyle ? "opacity-100" : "opacity-0"}`}
            priority
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 xl:flex" aria-label="Điều hướng chính">
          <a
            href={links[0][1]}
            className={`text-[.8125rem] font-bold transition-colors duration-300 hover:text-wood-500 ${lightStyle ? "text-ink/70 hover:text-ink" : "text-white/80 hover:text-white"}`}
          >
            {links[0][0]}
          </a>
          <div className="group relative flex items-center">
            <Link
              href="/san-pham"
              onClick={() => trackEvent("view_product_category", { location: "header" })}
              className={`py-7 text-[.8125rem] font-bold transition-colors duration-300 hover:text-wood-500 ${lightStyle ? "text-ink/70 hover:text-ink" : "text-white/80 hover:text-white"}`}
            >
              {t.navProducts}
            </Link>
            <button
              type="button"
              aria-label={t.mobileOpenProducts}
              aria-haspopup="true"
              className={`grid h-11 w-7 place-items-center transition-colors duration-300 ${lightStyle ? "text-ink/70" : "text-white/80"}`}
            >
              <ChevronDown size={14} />
            </button>
            <div className="invisible absolute left-0 top-full w-60 translate-y-2 bg-white p-2 text-forest-950 opacity-0 shadow-lg transition duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
              {productLinks.map(([label, href]) => (
                <a key={href} href={href} onClick={() => trackEvent("view_product_category", { location: "header_menu", destination: href })} className="flex min-h-11 items-center px-4 text-sm font-bold transition hover:bg-[#eef1ed] focus:bg-[#eef1ed]">
                  {label}
                </a>
              ))}
            </div>
          </div>
          {links.slice(1).map(([label, href]) => (
            <a
              key={href}
              href={href}
              onClick={() => href === "/gia-cong-cnc" && trackEvent("view_cnc_service", { location: "header" })}
              className={`text-[.8125rem] font-bold transition-colors duration-300 ${lightStyle ? "text-ink/70 hover:text-ink" : "text-white/80 hover:text-white"}`}
            >
              {label}
            </a>
          ))}
        </nav>

        {/* Desktop actions */}
        <div className="hidden items-center gap-2 lg:flex">
          <button
            type="button"
            onClick={toggleLang}
            title="Chuyển ngôn ngữ"
            className={`inline-flex min-h-11 items-center gap-1 px-2 text-xs font-bold transition-colors duration-300 ${lightStyle ? "text-ink/60 hover:text-ink" : "text-white/70 hover:text-white"}`}
          >
            <span className={lang === "vi" ? "text-wood-500" : ""}>VI</span>
            <span className={`${lightStyle ? "text-ink/28" : "text-white/40"}`}>|</span>
            <span className={lang === "en" ? "text-wood-500" : ""}>EN</span>
          </button>
          <a
            href={PHONE_HREF}
            data-analytics-handled="1"
            data-track-event="click_phone"
            data-track-location="header"
            onClick={() => trackEvent("click_phone", { location: "header" })}
            className={`inline-flex min-h-11 items-center gap-2 px-3 text-sm font-bold transition-colors duration-300 ${lightStyle ? "text-ink hover:text-wood-500" : "text-white/90 hover:text-white"}`}
          >
            <Phone size={16} /> {t.phoneLabel}
          </a>
          <a href={ZALO_URL} target="_blank" rel="noopener noreferrer" data-analytics-handled="1" data-track-event="click_quote" data-track-location="header" onClick={() => trackEvent("request_quote", { location: "header", channel: "zalo" })} aria-label={t.ctaGetQuote} className="inline-flex min-h-11 items-center gap-2 bg-[#b84f05] px-4 text-sm font-bold text-white transition-colors hover:bg-[#963f04]">
            <MessageCircle aria-hidden="true" size={16} /> {t.ctaGetQuote}
          </a>
        </div>

        {/* Mobile menu toggle */}
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-label={open ? t.mobileCloseMenu : t.mobileOpenMenu}
          className={`grid h-11 w-11 place-items-center border transition-colors duration-300 lg:hidden ${lightStyle ? "border-ink/20 text-ink" : "border-white/25 text-white"}`}
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile drawer — always dark */}
      {open && (
        <div className="border-t border-white/10 bg-forest-950 px-4 pb-5 text-white lg:hidden">
          <a href={links[0][1]} onClick={() => setOpen(false)} className="block min-h-12 border-b border-white/10 py-4 text-sm font-bold">
            {links[0][0]}
          </a>
          <div className="border-b border-white/10">
            <div className="flex items-center">
              <Link href="/san-pham" onClick={() => { trackEvent("view_product_category", { location: "mobile_header" }); setOpen(false); }} className="flex min-h-12 flex-1 items-center py-4 text-sm font-bold">
                {t.navProducts}
              </Link>
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
                  <a key={href} href={href} onClick={() => { trackEvent("view_product_category", { location: "mobile_header_menu", destination: href }); setOpen(false); }} className="flex min-h-11 items-center text-sm text-white/75">
                    {label}
                  </a>
                ))}
              </div>
            )}
          </div>
          {links.slice(1).map(([label, href]) => (
            <a key={href} href={href} onClick={() => { if (href === "/gia-cong-cnc") trackEvent("view_cnc_service", { location: "mobile_header" }); setOpen(false); }} className="block min-h-12 border-b border-white/10 py-4 text-sm font-bold">
              {label}
            </a>
          ))}
          <div className="mt-4 flex items-center justify-between">
            <button type="button" onClick={toggleLang} title="Chuyển ngôn ngữ" className="inline-flex min-h-12 items-center gap-1 px-3 text-sm font-bold text-white/75">
              <span className={lang === "vi" ? "text-wood-500" : ""}>VI</span>
              <span className="text-white/40">|</span>
              <span className={lang === "en" ? "text-wood-500" : ""}>EN</span>
            </button>
            <a href={PHONE_HREF} data-analytics-handled="1" data-track-event="click_phone" data-track-location="mobile_bottom_bar" onClick={() => trackEvent("click_phone", { location: "mobile_header" })} className="flex min-h-12 items-center justify-center gap-2 bg-[#b84f05] px-4 font-bold text-white">
              <Phone aria-hidden="true" size={17} /> {t.callLabel}
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
