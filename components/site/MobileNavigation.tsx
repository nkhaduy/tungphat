"use client";

import Image from "next/image";
import Link from "next/link";
import { MessageCircle, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { TrackedLink } from "@/components/TrackedLink";
import { ZALO_URL } from "@/lib/seo";

export type NavigationItem = {
  label: string;
  href: string;
  active: boolean;
  prefetch?: boolean;
};

type MobileNavigationProps = {
  open: boolean;
  items: NavigationItem[];
  lang: "vi" | "en";
  languageLabel: string;
  onClose: (restoreFocus?: boolean) => void;
  onToggleLanguage: () => void;
};

export function MobileNavigation({ open, items, lang, languageLabel, onClose, onToggleLanguage }: MobileNavigationProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => firstLinkRef.current?.focus());

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose(true);
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label="Điều hướng di động"
      className="fixed inset-0 z-[80] overflow-y-auto bg-white text-copy xl:hidden"
    >
      <div className="container-shell flex min-h-[72px] items-center justify-between border-b border-forest-900/10">
        <Link href="/" onClick={() => onClose(false)} className="relative block h-11 w-[190px]">
          <Image src="/logo-horizontal.webp" alt="Tùng Phát" fill sizes="190px" className="object-contain object-left" />
        </Link>
        <button type="button" onClick={() => onClose(true)} aria-label="Đóng menu" className="pressable grid h-11 w-11 place-items-center border border-forest-900/15 text-forest-950">
          <X size={22} aria-hidden="true" />
        </button>
      </div>
      <nav aria-label="Điều hướng trên thiết bị di động" className="container-shell py-4">
        {items.map((item, index) => (
          <Link
            key={`${item.label}-${item.href}`}
            ref={index === 0 ? firstLinkRef : undefined}
            href={item.href}
            prefetch={item.prefetch}
            aria-current={item.active ? "page" : undefined}
            onClick={() => onClose(false)}
            className={`flex min-h-14 items-center justify-between border-b border-forest-900/10 px-1 text-base font-bold ${item.active ? "text-wood-600" : "text-forest-950"}`}
          >
            {item.label}
            {item.active ? <span className="text-xs font-extrabold uppercase tracking-[.14em] text-wood-600">Đang xem</span> : null}
          </Link>
        ))}
        <TrackedLink
          href={ZALO_URL}
          target="_blank"
          rel="noopener noreferrer"
          eventName="request_quote"
          eventProperties={{ location: "site_mobile_menu", channel: "zalo" }}
          className="pressable mt-6 flex min-h-14 items-center justify-center gap-2 bg-wood-500 px-5 text-sm font-extrabold text-white hover:bg-wood-600"
        >
          <MessageCircle size={18} aria-hidden="true" />
          Gửi quy cách nhận báo giá
        </TrackedLink>
        <button
          type="button"
          onClick={onToggleLanguage}
          aria-label={languageLabel}
          className="mt-3 inline-flex min-h-12 w-full items-center justify-center gap-2 border border-forest-900/15 px-5 text-sm font-extrabold text-forest-950"
        >
          <span className={lang === "vi" ? "text-wood-600" : "text-slate-500"}>VI</span>
          <span aria-hidden="true" className="text-slate-300">|</span>
          <span className={lang === "en" ? "text-wood-600" : "text-slate-500"}>EN</span>
        </button>
      </nav>
    </div>
  );
}
