import Image from "next/image";
import Link from "next/link";
import { ExternalLink, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { TrackedLink } from "@/components/TrackedLink";
import { LocalizedText } from "@/components/site/LocalizedText";
import business from "@/content/settings/business.json";
import { branchPathForLocationId } from "@/lib/branch-pages";
import { PHONE_HREF, ZALO_URL } from "@/lib/seo";

const materialLinks = [
  ["Ván MDF", "/van-mdf"],
  ["MDF chống ẩm", "/mdf-chong-am"],
  ["MFC & Plywood", "/van-go-cong-nghiep"],
  ["Gỗ ghép", "/go-ghep"],
  ["Tất cả vật liệu", "/san-pham"],
] as const;

const navigationLinks = [
  ["Mã màu / Catalogue", "/catalogue"],
  ["Cắt & CNC", "/gia-cong-cnc"],
  ["Xưởng & chi nhánh", "/du-an"],
  ["Kiến thức", "/bai-viet"],
  ["Liên hệ", "/lien-he"],
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-forest-900/10 bg-[#f7f8f5] text-copy">
      <div className="container-shell grid gap-10 py-11 sm:grid-cols-2 lg:grid-cols-[1.3fr_.9fr_.9fr_1.2fr] lg:py-12">
        <div>
          <Image src="/logo-horizontal.webp" alt="Tùng Phát" width={800} height={240} sizes="210px" className="h-auto w-[200px]" />
          <p className="mt-5 max-w-sm text-sm leading-6 text-slate-700">
            <LocalizedText vi={business.footerDescription} en="Wood materials and CNC machining solutions for workshops, carpenters, architects, and business clients." />
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
            {navigationLinks.map(([label, href]) => <Link key={label} href={href} prefetch={href === "/catalogue" ? false : undefined} className="flex min-h-11 items-center text-sm text-slate-700 hover:text-wood-600">{label}</Link>)}
          </nav>
          <nav aria-label="Chính sách" className="mt-4 grid gap-1 text-xs text-slate-600">
            <Link href="/chinh-sach-bao-mat" className="flex min-h-10 items-center hover:text-wood-600"><LocalizedText vi="Chính sách bảo mật" en="Privacy Policy" /></Link>
            <Link href="/dieu-khoan-su-dung" className="flex min-h-10 items-center hover:text-wood-600"><LocalizedText vi="Điều khoản sử dụng" en="Terms of Use" /></Link>
          </nav>
        </div>

        <div>
          <h2 className="text-xs font-extrabold uppercase tracking-[.15em] text-forest-900"><LocalizedText vi="Chi nhánh và liên hệ" en="Branches and contact" /></h2>
          <div className="mt-4 grid gap-3">
            {business.locations.map((location) => (
              <div key={location.id} className="flex items-start gap-3 border border-forest-900/10 bg-white p-4 shadow-sm">
                <MapPin size={18} className="mt-0.5 shrink-0 text-wood-600" aria-hidden="true" />
                <span className="text-sm leading-6 text-slate-700">
                  <strong className="block text-forest-950">{location.name}</strong>
                  {location.address}
                  <span className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-extrabold">
                    <Link href={branchPathForLocationId(location.id)} className="text-forest-900 hover:text-wood-600">Xem chi tiết</Link>
                    <a href={location.directionsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-slate-600 hover:text-wood-600">Mở Maps <ExternalLink size={13} aria-hidden="true" /></a>
                  </span>
                </span>
              </div>
            ))}
          </div>
          <TrackedLink href={ZALO_URL} target="_blank" rel="noopener noreferrer" eventName="click_zalo" eventProperties={{ location: "site_footer" }} className="pressable mt-4 inline-flex min-h-12 items-center justify-center gap-2 bg-wood-500 px-5 text-sm font-extrabold text-white hover:bg-wood-600">
            <MessageCircle size={17} aria-hidden="true" />Liên hệ báo giá
          </TrackedLink>
        </div>
      </div>
      <div className="bg-forest-950 py-4 text-white">
        <div className="container-shell flex flex-col gap-2 text-xs text-white/85 sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 {business.businessName} · MST {business.taxId}</span>
          <Link href="/" className="min-h-11 content-center hover:text-orange-200">mdftungphat.com</Link>
        </div>
      </div>
    </footer>
  );
}
