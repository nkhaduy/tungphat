import Image from "next/image";
import Link from "next/link";
import { ExternalLink, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { TrackedLink } from "@/components/TrackedLink";
import { LocalizedText } from "@/components/site/LocalizedText";
import business from "@/content/settings/business.json";
import { branchPathForLocationId } from "@/lib/branch-pages";
import { PHONE_HREF, ZALO_URL } from "@/lib/seo";

import { COMPANY_DESCRIPTION, DEFAULT_CATALOGUE_URL } from "@/lib/site-content";
import { homeProductCards } from "@/lib/product-taxonomy";

const materialLinks = [...homeProductCards.map((card) => [card.title, card.href] as const), ["Tất cả vật liệu", "/san-pham/"] as const];

const navigationLinks = [
  ["Mã màu", DEFAULT_CATALOGUE_URL],
  ["Cắt CNC", "/gia-cong-cnc"],
  ["Bài viết", "/bai-viet"],
  ["Liên hệ", "/lien-he"],
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white text-copy">
      <div className="container-shell grid gap-10 py-11 sm:grid-cols-2 lg:grid-cols-[1.3fr_.9fr_.9fr_1.2fr] lg:py-12">
        <div>
          <Image src="/logo-horizontal.webp" alt="Tùng Phát" width={800} height={240} sizes="210px" className="h-auto w-[200px]" />
          <p className="mt-5 max-w-sm text-sm leading-6 text-slate-700">
            <LocalizedText vi={COMPANY_DESCRIPTION} en="Wood materials and CNC machining solutions for workshops, carpenters, architects, and business clients." />
          </p>
          <div className="mt-5 grid gap-2 text-sm text-slate-700">
            <a href={PHONE_HREF} className="inline-flex min-h-11 items-center gap-3 font-extrabold text-forest-950 hover:text-wood-600"><Phone size={17} className="text-wood-600" aria-hidden="true" />{business.phoneDisplay}</a>
            <a href={`mailto:${business.email}`} className="inline-flex min-h-11 items-center gap-3 hover:text-wood-600"><Mail size={17} className="text-wood-600" aria-hidden="true" />{business.email}</a>
          </div>
          <p className="mt-4 text-xs leading-5 text-slate-600">{business.businessName} · MST {business.taxId}</p>
        </div>

        <div>
          <h2 className="text-xs font-extrabold uppercase tracking-[.15em] text-forest-900"><LocalizedText vi="Vật liệu" en="Materials" /></h2>
          <nav aria-label="Danh mục vật liệu tại footer" className="mt-4 grid gap-1.5">
            {materialLinks.map(([label, href]) => <Link key={label} href={href} className="flex min-h-11 items-center text-sm text-slate-700 hover:text-wood-600">{label}</Link>)}
          </nav>
        </div>

        <div>
          <h2 className="text-xs font-extrabold uppercase tracking-[.15em] text-forest-900"><LocalizedText vi="Đi đến nhanh" en="Explore" /></h2>
          <nav aria-label="Điều hướng nhanh tại footer" className="mt-4 grid gap-1.5">
            {navigationLinks.map(([label, href]) => <Link key={label} href={href} prefetch={href === DEFAULT_CATALOGUE_URL ? false : undefined} className="flex min-h-11 items-center text-sm text-slate-700 hover:text-wood-600">{label}</Link>)}
          </nav>
          <nav aria-label="Chính sách" className="mt-4 grid gap-1 text-xs text-slate-600">
            <Link href="/chinh-sach-bao-mat" className="flex min-h-11 items-center hover:text-wood-600"><LocalizedText vi="Chính sách bảo mật" en="Privacy Policy" /></Link>
            <Link href="/dieu-khoan-su-dung" className="flex min-h-11 items-center hover:text-wood-600"><LocalizedText vi="Điều khoản sử dụng" en="Terms of Use" /></Link>
          </nav>
        </div>

        <div>
          <h2 className="text-xs font-extrabold uppercase tracking-[.15em] text-forest-900"><LocalizedText vi="Chi nhánh và liên hệ" en="Branches and contact" /></h2>
          <div className="mt-4 grid gap-3">
            {business.locations.map((location) => (
              <section key={location.id} className="overflow-hidden border border-forest-900/10 bg-white">
                <div className="flex items-start justify-between gap-3 p-4">
                  <div className="flex min-w-0 items-start gap-3">
                    <MapPin size={18} className="mt-0.5 shrink-0 text-wood-600" aria-hidden="true" />
                    <div className="min-w-0 text-sm leading-6 text-slate-700">
                      <strong className="block text-forest-950">{location.name}</strong>
                      <p className="mt-1">{location.address}</p>
                      <Link href={branchPathForLocationId(location.id)} className="mt-1 inline-flex min-h-9 items-center text-xs font-extrabold text-forest-900 hover:text-wood-600">Xem chi tiết</Link>
                    </div>
                  </div>
                  <a href={location.directionsUrl} target="_blank" rel="noopener noreferrer" aria-label={`Mở Maps ${location.name}`} className="inline-flex min-h-11 shrink-0 items-center gap-1 text-xs font-extrabold text-wood-600 hover:text-wood-700">Mở Maps <ExternalLink size={13} aria-hidden="true" /></a>
                </div>
                <iframe title={`Google Maps - ${location.name}`} aria-label={`Bản đồ ${location.name}`} src={location.embedSrc} loading="lazy" className="aspect-[2.4/1] w-full border-0 bg-[#f7f8f5]" referrerPolicy="no-referrer-when-downgrade" />
              </section>
            ))}
          </div>
          <TrackedLink href={ZALO_URL} target="_blank" rel="noopener noreferrer" eventName="click_zalo" eventProperties={{ location: "site_footer" }} className="pressable mt-4 inline-flex min-h-12 items-center justify-center gap-2 bg-wood-500 px-5 text-sm font-extrabold text-white hover:bg-wood-600">
            <MessageCircle size={17} aria-hidden="true" />Liên hệ báo giá
          </TrackedLink>
        </div>
      </div>
      <div className="border-t border-slate-200 bg-white py-4 text-slate-600">
        <div className="container-shell flex flex-col gap-2 text-xs sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 {business.businessName} · MST {business.taxId}</span>
          <Link href="/" className="min-h-11 content-center hover:text-slate-950">mdftungphat.com</Link>
        </div>
      </div>
    </footer>
  );
}
