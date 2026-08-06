import { Mail, MessageCircle, Phone } from "lucide-react";
import { BranchLocation, type ContactPhone } from "@/components/contact/BranchLocation";
import { JsonLd } from "@/components/JsonLd";
import { SiteShell } from "@/components/site/SiteShell";
import { TrackedLink } from "@/components/TrackedLink";
import { PageHero } from "@/components/ui/PageHero";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ViewTracker } from "@/components/ViewTracker";
import business from "@/content/settings/business.json";
import staticPages from "@/content/settings/static-pages.json";
import { locations } from "@/lib/locations";
import { BUSINESS_NAME, PHONE_DISPLAY, PHONE_HREF, SITE_URL, TAX_ID, ZALO_URL, breadcrumbSchema, createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({ title: "Liên hệ", description: "Liên hệ Tùng Phát qua Zalo, email hoặc điện thoại; xem địa chỉ và chỉ đường đến hai chi nhánh tại đường Tam Bình, phường Hiệp Bình, TP. Hồ Chí Minh.", path: "/lien-he" });
const contactPageSchema = { "@context": "https://schema.org", "@type": "ContactPage", "@id": `${SITE_URL}/lien-he#webpage`, url: `${SITE_URL}/lien-he`, name: "Liên hệ Tùng Phát", about: { "@id": `${SITE_URL}/#organization` } };
const phones: ContactPhone[] = [{ display: `${PHONE_DISPLAY} (Mr. Tùng)`, href: PHONE_HREF }];

export default function ContactPage() {
  return (
    <>
      <JsonLd data={[breadcrumbSchema([{ name: "Trang chủ", path: "/" }, { name: "Liên hệ", path: "/lien-he" }]), contactPageSchema]} />
      <SiteShell>
        <PageHero breadcrumbs={[{ label: "Trang chủ", href: "/" }, { label: "Liên hệ" }]} eyebrow="Trao đổi vật liệu và CNC" title="Liên hệ Tùng Phát" description={staticPages.contactIntro} image={{ src: locations[0].image, alt: locations[0].imageAlt, priority: true }} actions={<><TrackedLink href={ZALO_URL} target="_blank" rel="noopener noreferrer" eventName="click_zalo" eventProperties={{ location: "contact_hero" }} className="pressable inline-flex min-h-14 items-center justify-center gap-2 bg-wood-500 px-6 text-sm font-extrabold text-white"><MessageCircle size={18} aria-hidden="true" />Liên hệ Zalo</TrackedLink><a href="#branch-locations" className="pressable inline-flex min-h-14 items-center justify-center gap-2 border border-forest-900/20 bg-white px-6 text-sm font-extrabold text-forest-950">Xem hai chi nhánh</a></>} />
        <ViewTracker event="view_contact_page" contentType="contact" />
        <section className="section-space bg-white">
          <div className="container-shell grid gap-10 lg:grid-cols-[.9fr_1.1fr]"><div><SectionHeader eyebrow="Thông tin doanh nghiệp" title="Đầu mối liên hệ thống nhất" description="Thông tin trên trang được đọc từ cấu hình doanh nghiệp dùng chung, tránh sai khác giữa header, footer và từng chi nhánh." /><dl className="mt-7 grid gap-4 border-t border-forest-900/10 pt-6 text-sm"><div><dt className="font-bold text-slate-600">Tên công ty</dt><dd className="mt-2 text-lg font-extrabold text-forest-950">{BUSINESS_NAME.toUpperCase()}</dd></div><div><dt className="font-bold text-slate-600">Mã số thuế</dt><dd className="mt-2 font-extrabold tabular-nums text-forest-950">{TAX_ID}</dd></div></dl></div><div className="grid gap-4 sm:grid-cols-2"><a href={PHONE_HREF} className="pressable flex min-h-32 flex-col justify-between border border-forest-900/10 bg-[#f7f8f5] p-6 hover:border-wood-500/40"><Phone size={23} className="text-wood-600" aria-hidden="true" /><span><strong className="block text-sm text-slate-600">Điện thoại / Zalo</strong><span className="mt-2 block text-lg font-extrabold text-forest-950">{PHONE_DISPLAY}</span></span></a><a href={`mailto:${business.email}`} className="pressable flex min-h-32 flex-col justify-between border border-forest-900/10 bg-[#f7f8f5] p-6 hover:border-wood-500/40"><Mail size={23} className="text-wood-600" aria-hidden="true" /><span><strong className="block text-sm text-slate-600">Email</strong><span className="mt-2 block break-all font-extrabold text-forest-950">{business.email}</span></span></a></div></div>
        </section>
        <section id="branch-locations" className="section-space scroll-mt-32 bg-[#f7f8f5]"><div className="container-shell"><SectionHeader eyebrow="Hệ thống tại Tam Bình" title="Hai chi nhánh tại TP.HCM" description="Xem ảnh mặt tiền thật, địa chỉ và mở chỉ đường bằng Google Maps. Website không nhúng bản đồ nặng trên trang liên hệ." /><div className="mt-9 grid gap-6 lg:grid-cols-2">{locations.map((location) => <BranchLocation key={location.id} location={location} phones={phones} />)}</div></div></section>
      </SiteShell>
    </>
  );
}
