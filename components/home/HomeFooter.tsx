import Image from "next/image";
import Link from "next/link";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { TrackedLink } from "@/components/TrackedLink";
import business from "@/content/settings/business.json";
import { PHONE_HREF, ZALO_URL } from "@/lib/seo";

const materialLinks = [
  ["Ván MDF", "/van-mdf"],
  ["MDF chống ẩm", "/mdf-chong-am"],
  ["Ván gỗ công nghiệp", "/van-go-cong-nghiep"],
  ["Gỗ ghép", "/go-ghep"],
  ["Catalogue", "/san-pham#catalogue"]
] as const;

const serviceLinks = [
  ["Gia công CNC", "/gia-cong-cnc"],
  ["Cắt CNC gỗ", "/cat-cnc-go"],
  ["CNC MDF", "/gia-cong-cnc-mdf"],
  ["Thư viện xưởng", "/#thu-vien-xuong"],
  ["Liên hệ", "/lien-he"]
] as const;

export function HomeFooter() {
  return (
    <footer className="bg-[#061f17] pb-20 text-white md:pb-0">
      <div className="container-shell grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.25fr_.72fr_.72fr_1.05fr] lg:py-14">
        <div>
          <div className="inline-flex rounded-lg bg-white p-3">
            <Image src="/logo-horizontal.png" alt="Tùng Phát" width={899} height={250} sizes="220px" className="h-auto w-[210px]" />
          </div>
          <p className="mt-5 max-w-sm text-sm leading-6 text-white/70">{business.footerDescription}</p>
          <p className="mt-4 text-xs font-semibold text-white/60">MST: {business.taxId}</p>
        </div>

        <div>
          <h2 className="text-xs font-extrabold uppercase tracking-[.15em] text-orange-300">Vật liệu</h2>
          <nav aria-label="Danh mục vật liệu tại footer" className="mt-5 grid gap-2.5">
            {materialLinks.map(([label, href]) => <Link key={label} href={href} className="text-sm text-white/70 transition hover:text-white">{label}</Link>)}
          </nav>
        </div>

        <div>
          <h2 className="text-xs font-extrabold uppercase tracking-[.15em] text-orange-300">Dịch vụ</h2>
          <nav aria-label="Dịch vụ tại footer" className="mt-5 grid gap-2.5">
            {serviceLinks.map(([label, href]) => <Link key={label} href={href} className="text-sm text-white/70 transition hover:text-white">{label}</Link>)}
          </nav>
        </div>

        <div>
          <h2 className="text-xs font-extrabold uppercase tracking-[.15em] text-orange-300">Liên hệ</h2>
          <div className="mt-5 grid gap-3 text-sm text-white/70">
            <a href={PHONE_HREF} className="flex min-h-11 items-center gap-3 font-bold text-white hover:text-orange-200"><Phone size={17} className="text-orange-300" aria-hidden="true" />{business.phoneDisplay}</a>
            <a href={`mailto:${business.email}`} className="flex min-h-11 items-center gap-3 hover:text-white"><Mail size={17} className="shrink-0 text-orange-300" aria-hidden="true" /><span className="break-all">{business.email}</span></a>
            {business.locations.map((location) => <a key={location.id} href={location.directionsUrl} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 leading-6 hover:text-white"><MapPin size={17} className="mt-1 shrink-0 text-orange-300" aria-hidden="true" />{location.address}</a>)}
          </div>
          <TrackedLink href={ZALO_URL} target="_blank" rel="noopener noreferrer" eventName="click_zalo" eventProperties={{ location: "home_footer" }} className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-wood-500 px-5 text-sm font-extrabold text-white hover:bg-wood-600"><MessageCircle size={17} aria-hidden="true" />Liên hệ qua Zalo</TrackedLink>
        </div>
      </div>
      <div className="border-t border-white/10 py-5">
        <div className="container-shell flex flex-col gap-3 text-xs text-white/60 sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 {business.businessName}</span>
          <nav aria-label="Chính sách" className="flex flex-wrap gap-x-5 gap-y-2">
            <Link href="/chinh-sach-bao-mat" className="hover:text-white">Chính sách bảo mật</Link>
            <Link href="/dieu-khoan-su-dung" className="hover:text-white">Điều khoản sử dụng</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
