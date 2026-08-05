"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronDown, MessageCircle, Menu, Phone, X } from "lucide-react";
import { useEffect, useState } from "react";
import { SupplierLinkList } from "@/components/catalog/shared/SupplierLinkList";
import { trackEvent } from "@/lib/analytics";
import { supplierNavigation } from "@/lib/catalog/core/navigation";
import { vi as t } from "@/lib/i18n";
import { PHONE_HREF, ZALO_URL } from "@/lib/seo";

type HeaderProps = {
  appearance?: "adaptive" | "dark" | "light";
};

type NavigationLink = {
  label: string;
  href: string;
};

const productLinks: NavigationLink[] = [
  { label: t.navAllProducts, href: "/san-pham/" },
  { label: "Gỗ ghép", href: "/go-ghep/" },
  { label: "Gỗ ghép cao su", href: "/go-ghep-cao-su/" },
  { label: "Gỗ ghép tràm", href: "/go-ghep-tram/" },
  { label: "Ván MDF", href: "/van-mdf/" },
  { label: "MDF chống ẩm", href: "/mdf-chong-am/" },
];

function desktopLinkClass(lightStyle: boolean) {
  return `py-7 text-[.8125rem] font-bold transition-colors duration-300 hover:text-wood-500 ${
    lightStyle ? "text-ink/70 hover:text-ink" : "text-white/80 hover:text-white"
  }`;
}

type DesktopDropdownProps = {
  label: string;
  href: string;
  lightStyle: boolean;
  children: React.ReactNode;
};

function DesktopDropdown({
  label,
  href,
  lightStyle,
  children,
}: DesktopDropdownProps) {
  return (
    <div className="group relative flex items-center">
      <Link href={href} className={desktopLinkClass(lightStyle)}>
        {label}
      </Link>
      <button
        type="button"
        aria-label={`Mở menu ${label}`}
        aria-haspopup="true"
        className={`grid h-11 w-7 place-items-center transition-colors duration-300 ${
          lightStyle ? "text-ink/70" : "text-white/80"
        }`}
      >
        <ChevronDown size={14} />
      </button>
      <div className="invisible absolute left-0 top-full w-64 translate-y-2 bg-white p-2 text-forest-950 opacity-0 shadow-lg transition duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
        {children}
      </div>
    </div>
  );
}

type MobileSectionProps = {
  id: string;
  label: string;
  href: string;
  expanded: boolean;
  onToggle: () => void;
  onNavigate: () => void;
  children: React.ReactNode;
};

function MobileSection({
  id,
  label,
  href,
  expanded,
  onToggle,
  onNavigate,
  children,
}: MobileSectionProps) {
  return (
    <div className="border-b border-white/10">
      <div className="flex items-center">
        <Link
          href={href}
          onClick={onNavigate}
          className="flex min-h-12 flex-1 items-center py-4 text-sm font-bold"
        >
          {label}
        </Link>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          aria-controls={id}
          aria-label={`${expanded ? "Đóng" : "Mở"} menu ${label}`}
          className="grid h-12 w-12 place-items-center"
        >
          <ChevronDown
            size={18}
            className={`transition-transform ${expanded ? "rotate-180" : ""}`}
          />
        </button>
      </div>
      {expanded ? (
        <div id={id} className="mb-3 border-l border-white/20 pl-4">
          {children}
        </div>
      ) : null}
    </div>
  );
}

export function Header({ appearance = "adaptive" }: HeaderProps) {
  const [open, setOpen] = useState(false);
  const [mobileSection, setMobileSection] = useState<string>();
  const [scrolled, setScrolled] = useState(false);
  const lightStyle = appearance === "light" || scrolled;
  const darkStyle = appearance === "dark" && !scrolled;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const closeMobileMenu = () => setOpen(false);
  const toggleMobileSection = (section: string) => {
    setMobileSection((current) => (current === section ? undefined : section));
  };

  const supplierDesktopClass =
    "flex min-h-11 items-center px-4 text-sm font-bold transition hover:bg-[#eef1ed] focus:bg-[#eef1ed]";
  const supplierMobileClass =
    "flex min-h-11 items-center text-sm text-white/75";

  return (
    <header
      className={[
        "site-header fixed inset-x-0 top-0 z-50 border-b transition-all duration-300",
        lightStyle
          ? "border-black/[0.08] bg-white/95 shadow-[0_1px_12px_rgba(0,0,0,0.07)] backdrop-blur-md"
          : darkStyle
            ? "border-white/10 bg-forest-950"
            : "border-transparent bg-transparent",
      ].join(" ")}
    >
      <div className="container-shell flex h-[76px] items-center justify-between gap-4 xl:h-[78px]">
        <Link
          href="/"
          className="relative h-[52px] w-[232px] shrink-0 sm:w-[282px] xl:h-[56px] xl:w-[286px]"
        >
          <Image
            src="/logo-horizontal-white.png"
            alt="Tùng Phát"
            fill
            sizes="(min-width: 1280px) 286px, 282px"
            quality={95}
            className={`object-contain object-left transition-opacity duration-300 ${lightStyle ? "opacity-0" : "opacity-100"}`}
            priority
          />
          <Image
            src="/logo-horizontal.png"
            alt=""
            fill
            sizes="(min-width: 1280px) 286px, 282px"
            quality={95}
            className={`object-contain object-left transition-opacity duration-300 ${lightStyle ? "opacity-100" : "opacity-0"}`}
            priority
          />
        </Link>

        <nav
          className="hidden items-center gap-4 xl:flex"
          aria-label="Điều hướng chính"
        >
          <DesktopDropdown
            label={t.navProducts}
            href="/san-pham/"
            lightStyle={lightStyle}
          >
            {productLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() =>
                  trackEvent("view_product_category", {
                    location: "header_menu",
                    destination: link.href,
                  })
                }
                className={supplierDesktopClass}
              >
                {link.label}
              </Link>
            ))}
          </DesktopDropdown>
          <DesktopDropdown
            label="Catalogue nhà cung cấp"
            href="/catalogue/"
            lightStyle={lightStyle}
          >
            <SupplierLinkList
              links={supplierNavigation.catalogue}
              className={supplierDesktopClass}
              onNavigate={(href) =>
                trackEvent("click_catalogue", {
                  location: "header_menu",
                  destination: href,
                })
              }
            />
          </DesktopDropdown>
          <Link
            href="/gia-cong-cnc/"
            onClick={() =>
              trackEvent("view_cnc_service", { location: "header" })
            }
            className={desktopLinkClass(lightStyle)}
          >
            {t.navCNC}
          </Link>
          <Link href="/lien-he/" className={desktopLinkClass(lightStyle)}>
            {t.navContact}
          </Link>
        </nav>

        <div className="hidden items-center gap-1 xl:flex">
          <a
            href={PHONE_HREF}
            data-analytics-handled="1"
            data-track-event="click_phone"
            data-track-location="header"
            onClick={() => trackEvent("click_phone", { location: "header" })}
            className={`inline-flex min-h-11 items-center gap-2 px-2 text-sm font-bold transition-colors duration-300 ${lightStyle ? "text-ink hover:text-wood-500" : "text-white/90 hover:text-white"}`}
          >
            <Phone size={16} /> {t.phoneLabel}
          </a>
          <a
            href={ZALO_URL}
            target="_blank"
            rel="noopener noreferrer"
            data-analytics-handled="1"
            data-track-event="click_quote"
            data-track-location="header"
            onClick={() =>
              trackEvent("request_quote", {
                location: "header",
                channel: "zalo",
              })
            }
            aria-label={t.ctaGetQuote}
            className="inline-flex min-h-11 items-center gap-2 bg-[#b84f05] px-3 text-sm font-bold text-white transition-colors hover:bg-[#963f04]"
          >
            <MessageCircle aria-hidden="true" size={16} /> {t.ctaGetQuote}
          </a>
        </div>

        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
          aria-label={open ? t.mobileCloseMenu : t.mobileOpenMenu}
          className={`grid h-11 w-11 place-items-center border transition-colors duration-300 xl:hidden ${lightStyle ? "border-ink/20 text-ink" : "border-white/25 text-white"}`}
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {open ? (
        <div className="border-t border-white/10 bg-forest-950 px-4 pb-5 text-white xl:hidden">
          <MobileSection
            id="mobile-products"
            label={t.navProducts}
            href="/san-pham/"
            expanded={mobileSection === "products"}
            onToggle={() => toggleMobileSection("products")}
            onNavigate={closeMobileMenu}
          >
            {productLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => {
                  trackEvent("view_product_category", {
                    location: "mobile_header_menu",
                    destination: link.href,
                  });
                  closeMobileMenu();
                }}
                className={supplierMobileClass}
              >
                {link.label}
              </Link>
            ))}
          </MobileSection>
          <MobileSection
            id="mobile-catalogues"
            label="Catalogue nhà cung cấp"
            href="/catalogue/"
            expanded={mobileSection === "catalogue"}
            onToggle={() => toggleMobileSection("catalogue")}
            onNavigate={closeMobileMenu}
          >
            <SupplierLinkList
              links={supplierNavigation.catalogue}
              className={supplierMobileClass}
              onNavigate={(href) => {
                trackEvent("click_catalogue", {
                  location: "mobile_header_menu",
                  destination: href,
                });
                closeMobileMenu();
              }}
            />
          </MobileSection>
          <Link
            href="/gia-cong-cnc/"
            onClick={() => {
              trackEvent("view_cnc_service", { location: "mobile_header" });
              closeMobileMenu();
            }}
            className="block min-h-12 border-b border-white/10 py-4 text-sm font-bold"
          >
            {t.navCNC}
          </Link>
          <Link
            href="/lien-he/"
            onClick={closeMobileMenu}
            className="block min-h-12 border-b border-white/10 py-4 text-sm font-bold"
          >
            {t.navContact}
          </Link>
          <div className="mt-4 flex justify-end">
            <a
              href={PHONE_HREF}
              data-analytics-handled="1"
              data-track-event="click_phone"
              data-track-location="mobile_bottom_bar"
              onClick={() =>
                trackEvent("click_phone", { location: "mobile_header" })
              }
              className="flex min-h-12 items-center justify-center gap-2 bg-wood-700 px-4 font-bold text-white"
            >
              <Phone size={17} /> {t.callLabel}
            </a>
          </div>
        </div>
      ) : null}
    </header>
  );
}
