import Image from "next/image";
import { MessageCircle, Phone } from "lucide-react";
import { BranchLocation, type ContactPhone } from "@/components/contact/BranchLocation";
import { JsonLd } from "@/components/JsonLd";
import { SiteShell } from "@/components/site/SiteShell";
import { TrackedLink } from "@/components/TrackedLink";
import { ViewTracker } from "@/components/ViewTracker";
import { locations } from "@/lib/locations";
import { SITE_URL, ZALO_URL, breadcrumbSchema, createPageMetadata, webPageSchema } from "@/lib/seo";

export const metadata = createPageMetadata({ title: "Liên hệ tại Thủ Đức", description: "Liên hệ Tùng Phát qua Zalo hoặc điện thoại; xem địa chỉ và chỉ đường đến hai chi nhánh tại Tam Bình, Thủ Đức, TP.HCM.", path: "/lien-he" });
const contactPageSchema = { ...webPageSchema({ path: "/lien-he", name: "Liên hệ Tùng Phát tại Thủ Đức", description: "Thông tin liên hệ và địa chỉ hai chi nhánh Tùng Phát tại Tam Bình, Thủ Đức.", type: "ContactPage", primaryEntityId: `${SITE_URL}/#organization` }), "@type": "ContactPage" };
const contactIntro = "Tùng Phát cung cấp các loại vật liệu gồm gỗ ghép, MDF, MFC, Plywood và chỉ dán cạnh; đồng thời nhận cắt và gia công CNC theo yêu cầu.";
const contactPhoneHref = "tel:0909259160";
const phones: ContactPhone[] = [{ display: "0909 259 160 (Mr Tùng)", href: contactPhoneHref }];

export default function ContactPage() {
  return (
    <>
      <JsonLd data={[breadcrumbSchema([{ name: "Trang chủ", path: "/" }, { name: "Liên hệ", path: "/lien-he" }]), contactPageSchema]} />
      <SiteShell headerTone="dark">
        <section className="contact-hero relative isolate overflow-hidden bg-forest-950 text-white">
          <Image src="/images/cnc-service.webp" alt="Máy CNC gia công tấm ván" fill priority sizes="100vw" className="contact-hero-image object-cover" />
          <div className="contact-hero-overlay absolute inset-0" aria-hidden="true" />
          <div className="container-shell relative z-10 flex min-h-[35rem] items-end pb-12 pt-[calc(var(--site-header-height)+7rem)] sm:min-h-[39rem] sm:pb-16 sm:pt-[calc(var(--site-header-height)+9rem)]">
            <div className="max-w-3xl">
              <h1 className="text-balance font-display text-[clamp(2.55rem,6vw,5rem)] font-extrabold leading-[.98] tracking-[-.04em] text-white">Liên hệ Tùng Phát</h1>
              <p className="mt-5 max-w-2xl text-pretty text-base leading-7 text-white/90 sm:text-lg sm:leading-8">{contactIntro}</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <TrackedLink href={contactPhoneHref} eventName="click_phone" eventProperties={{ location: "contact_hero" }} className="pressable inline-flex min-h-14 items-center justify-center gap-2 bg-white px-6 text-sm font-extrabold text-forest-950 hover:bg-[#fff4e8]">
                  <Phone size={18} aria-hidden="true" />0909 259 160 (Mr Tùng)
                </TrackedLink>
                <TrackedLink href={ZALO_URL} target="_blank" rel="noopener noreferrer" eventName="click_zalo" eventProperties={{ location: "contact_hero" }} className="pressable inline-flex min-h-14 items-center justify-center gap-2 border border-white/55 bg-forest-950/50 px-6 text-sm font-extrabold text-white hover:bg-forest-950/75">
                  <MessageCircle size={18} aria-hidden="true" />Liên hệ Zalo
                </TrackedLink>
              </div>
            </div>
          </div>
        </section>
        <ViewTracker event="view_contact_page" contentType="contact" />
        <section id="branch-locations" className="section-space scroll-mt-32 bg-white">
          <div className="container-shell">
            <h2 className="text-balance text-3xl font-extrabold tracking-[-.03em] text-forest-950 sm:text-4xl">Địa chỉ</h2>
            <div className="mt-9 grid gap-8 lg:grid-cols-2">{locations.map((location) => <BranchLocation key={location.id} location={location} phones={phones} />)}</div>
          </div>
        </section>
      </SiteShell>
    </>
  );
}
