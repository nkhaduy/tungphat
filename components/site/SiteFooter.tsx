import Image from "next/image";
import Link from "next/link";
import { ExternalLink, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { TrackedLink } from "@/components/TrackedLink";
import { LocalizedText } from "@/components/site/LocalizedText";
import business from "@/content/settings/business.json";
import { PHONE_HREF, ZALO_URL } from "@/lib/seo";

const materialLinks = [["Ván MDF", "/van-mdf"], ["MDF chống ẩm", "/mdf-chong-am"], ["Ván gỗ công nghiệp", "/van-go-cong-nghiep"], ["Gỗ ghép", "/go-ghep"], ["Gỗ ghép cao su", "/go-ghep-cao-su"]] as const;
const serviceLinks = [["Gia công CNC", "/gia-cong-cnc"], ["Cắt CNC gỗ", "/cat-cnc-go"], ["Xưởng thực tế", "/du-an"], ["Catalogue", "/san-pham#catalogue"], ["Kiến thức", "/bai-viet"]] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-forest-900/10 bg-[#f7f8f5] text-copy">
      <div className="container-shell grid gap-10 py-11 sm:grid-cols-2 lg:grid-cols-[1.25fr_.7fr_.7fr_1.1fr] lg:py-12">
        <div>
          <Image src="/logo-horizontal.webp" alt="Tùng Phát" width={800} height={240} sizes="210px" className="h-auto w-[200px]" />
          <p className="mt-5 max-w-sm text-sm leading-6 text-slate-700"><LocalizedText vi={business.footerDescription} en="Wood materials and CNC machining solutions for workshops, carpenters, architects, and business clients." /></p>
          <div className="mt-5 grid gap-2 text-sm text-slate-700">
            <a href={PHONE_HREF} className="inline-flex min-h-11 items-center gap-3 font-extrabold text-forest-950 hover:text-wood-600"><Phone size={17} className="text-wood-600" aria-hidden="true" />{business.phoneDisplay}</a>
            <a href={`mailto:${business.email}`} className="inline-flex min-h-11 items-center gap-3 hover:text-wood-600"><Mail size={17} className="text-wood-600" aria-hidden="true" />{business.email}</a>
          </div>
        </div>
        <div>
          <h2 className="text-xs font-extrabold uppercase tracking-[.15em] text-forest-900"><LocalizedText vi="Vật liệu" en="Materials" /></h2>
          <nav aria-label="Danh mục vật liệu tại footer" className="mt-4 grid gap-1.5">
            {materialLinks.map(([label, href]) => <Link key={label} href={href} className="flex min-h-11 items-center text-sm text-slate-700 hover:text-wood-600">{label}</Link>)}
          </nav>
        </div>
        <div>
          <h2 className="text-xs font-extrabold uppercase tracking-[.15em] text-forest-900"><LocalizedText vi="Dịch vụ" en="Services" /></h2>
          <nav aria-label="Dịch vụ tại footer" className="mt-4 grid gap-1.5">
            {serviceLinks.map(([label, href]) => <Link key={label} href={href} className="flex min-h-11 items-center text-sm text-slate-700 hover:text-wood-600">{label}</Link>)}
          </nav>
          <nav aria-label="Chính sách" className="mt-5 grid gap-1 text-xs text-slate-600">
            <Link href="/chinh-sach-bao-mat" className="flex min-h-11 items-center hover:text-wood-600"><LocalizedText vi="Chính sách bảo mật" en="Privacy Policy" /></Link>
            <Link href="/dieu-khoan-su-dung" className="flex min-h-11 items-center hover:text-wood-600"><LocalizedText vi="Điều khoản sử dụng" en="Terms of Use" /></Link>
          </nav>
        </div>
        <div>
          <h2 className="text-xs font-extrabold uppercase tracking-[.15em] text-forest-900"><LocalizedText vi="Hệ thống chi nhánh" en="Branch locations" /></h2>
          <div className="mt-4 grid gap-3">
            {business.locations.map((location) => (
              <a key={location.id} href={location.directionsUrl} target="_blank" rel="noopener noreferrer" className="pressable group flex min-h-20 items-start gap-3 border border-forest-900/10 bg-white p-4 shadow-sm hover:border-wood-500/50">
                <MapPin size={18} className="mt-0.5 shrink-0 text-wood-600" aria-hidden="true" />
                <span className="text-sm leading-6 text-slate-700"><strong className="block text-forest-950">{location.name}</strong>{location.address}</span>
                <ExternalLink size={15} className="ml-auto mt-1 shrink-0 text-slate-500 group-hover:text-wood-600" aria-hidden="true" />
              </a>
            ))}
          </div>
          <TrackedLink href={ZALO_URL} target="_blank" rel="noopener noreferrer" eventName="click_zalo" eventProperties={{ location: "site_footer" }} className="pressable mt-4 inline-flex min-h-12 items-center justify-center gap-2 bg-wood-500 px-5 text-sm font-extrabold text-white hover:bg-wood-600"><MessageCircle size={17} aria-hidden="true" />Liên hệ qua Zalo</TrackedLink>
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
