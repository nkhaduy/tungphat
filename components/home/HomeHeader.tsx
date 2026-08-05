import Image from "next/image";
import Link from "next/link";
import { Mail, MapPin, Menu, MessageCircle, Phone, X } from "lucide-react";
import { TrackedLink } from "@/components/TrackedLink";
import business from "@/content/settings/business.json";
import { PHONE_HREF, ZALO_URL } from "@/lib/seo";

const navigation = [
  ["Vật liệu", "/san-pham"],
  ["Gia công CNC", "/gia-cong-cnc"],
  ["Thương hiệu", "/san-pham#catalogue"],
  ["Thư viện xưởng", "/#thu-vien-xuong"],
  ["Catalogue", "/san-pham#catalogue"],
  ["Kiến thức", "/bai-viet"],
  ["Liên hệ", "/lien-he"]
] as const;

export function HomeHeader() {
  return (
    <>
      <a
        href="#noi-dung-chinh"
        className="fixed left-3 top-3 z-[70] -translate-y-24 bg-white px-4 py-3 text-sm font-bold text-forest-950 shadow-card transition-transform focus:translate-y-0"
      >
        Bỏ qua điều hướng
      </a>

      <div className="bg-forest-950 text-white">
        <div className="container-shell flex min-h-9 items-center justify-between gap-3 py-2 text-[11px] font-semibold leading-4 sm:text-xs">
          <div className="flex min-w-0 items-center gap-2 text-white/80 xl:hidden">
            <MapPin size={14} className="shrink-0 text-orange-300" aria-hidden="true" />
            <span className="truncate">2 chi nhánh tại TP.HCM</span>
          </div>
          <div className="hidden min-w-0 items-center gap-6 xl:flex">
            {business.locations.map((location) => (
              <a
                key={location.id}
                href={location.directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-white/80 transition hover:text-white"
              >
                <MapPin size={13} className="text-orange-300" aria-hidden="true" />
                {location.address}
              </a>
            ))}
          </div>
          <div className="flex shrink-0 items-center gap-3 sm:gap-5">
            <a href={PHONE_HREF} className="inline-flex items-center gap-1.5 text-white transition hover:text-orange-200">
              <Phone size={13} className="text-orange-300" aria-hidden="true" />
              <span className="hidden sm:inline">Hotline:</span> {business.phoneDisplay}
            </a>
            <a href={`mailto:${business.email}`} className="hidden items-center gap-1.5 text-white/80 transition hover:text-white lg:inline-flex">
              <Mail size={13} className="text-orange-300" aria-hidden="true" />
              {business.email}
            </a>
          </div>
        </div>
      </div>

      <header className="sticky top-0 z-50 border-b border-forest-900/10 bg-white/95 shadow-[0_8px_28px_rgba(7,59,40,.06)] backdrop-blur-lg">
        <div className="container-shell flex h-[72px] items-center justify-between gap-4 lg:h-[76px]">
          <Link href="/" aria-label="Tùng Phát - Trang chủ" className="relative block h-[46px] w-[196px] shrink-0 sm:w-[220px]">
            <Image src="/logo-horizontal.png" alt="Tùng Phát" fill sizes="220px" priority className="object-contain object-left" />
          </Link>

          <nav aria-label="Điều hướng chính" className="hidden items-center gap-4 xl:flex">
            {navigation.map(([label, href]) => (
              <Link
                key={`${label}-${href}`}
                href={href}
                className="inline-flex min-h-11 items-center text-[12px] font-extrabold text-forest-950 transition-colors hover:text-wood-600 focus-visible:text-wood-600 2xl:text-[13px]"
              >
                {label}
              </Link>
            ))}
          </nav>

          <TrackedLink
            href={ZALO_URL}
            target="_blank"
            rel="noopener noreferrer"
            eventName="request_quote"
            eventProperties={{ location: "home_header", channel: "zalo" }}
            className="hidden min-h-12 shrink-0 items-center justify-center gap-2 rounded-md bg-wood-500 px-4 text-[12px] font-extrabold text-white shadow-[0_8px_20px_rgba(237,118,16,.22)] transition hover:bg-wood-600 xl:inline-flex 2xl:px-5"
          >
            <MessageCircle size={16} aria-hidden="true" />
            Gửi quy cách nhận báo giá
          </TrackedLink>

          <details className="group relative xl:hidden">
            <summary className="grid h-11 w-11 cursor-pointer list-none place-items-center rounded-md border border-forest-900/20 text-forest-950 transition hover:border-wood-500 hover:text-wood-600 [&::-webkit-details-marker]:hidden">
              <span className="sr-only">Mở hoặc đóng menu</span>
              <Menu className="group-open:hidden" size={22} aria-hidden="true" />
              <X className="hidden group-open:block" size={22} aria-hidden="true" />
            </summary>
            <div className="absolute right-0 top-[calc(100%+14px)] w-[min(88vw,360px)] overflow-hidden rounded-lg border border-forest-900/10 bg-white p-3 shadow-[0_24px_60px_rgba(7,59,40,.18)]">
              <nav aria-label="Điều hướng trên thiết bị di động" className="grid">
                {navigation.map(([label, href]) => (
                  <Link key={`${label}-${href}`} href={href} className="flex min-h-12 items-center border-b border-forest-900/10 px-3 text-sm font-bold text-forest-950 last:border-0 hover:bg-[#f5f8f5]">
                    {label}
                  </Link>
                ))}
              </nav>
              <TrackedLink
                href={ZALO_URL}
                target="_blank"
                rel="noopener noreferrer"
                eventName="request_quote"
                eventProperties={{ location: "home_mobile_menu", channel: "zalo" }}
                className="mt-3 flex min-h-12 items-center justify-center gap-2 rounded-md bg-wood-500 px-4 text-sm font-extrabold text-white"
              >
                <MessageCircle size={17} aria-hidden="true" />
                Gửi quy cách nhận báo giá
              </TrackedLink>
            </div>
          </details>
        </div>
      </header>
    </>
  );
}
