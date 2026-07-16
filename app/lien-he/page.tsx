import Link from "next/link";
import { MapPin, MessageCircle, Phone } from "lucide-react";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { JsonLd } from "@/components/JsonLd";
import { TrackedLink } from "@/components/TrackedLink";
import { locations } from "@/lib/locations";
import { PHONE_DISPLAY, PHONE_HREF, SITE_URL, ZALO_URL, breadcrumbSchema, createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Liên hệ vật liệu gỗ và gia công CNC",
  description: "Gọi điện, nhắn Zalo hoặc xem bản đồ hai địa điểm Tùng Phát tại đường Tam Bình, phường Hiệp Bình, TP. Hồ Chí Minh để trao đổi nhu cầu.",
  path: "/lien-he"
});

const contactPageSchema = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  "@id": `${SITE_URL}/lien-he#webpage`,
  url: `${SITE_URL}/lien-he`,
  name: "Liên hệ Tùng Phát",
  about: { "@id": `${SITE_URL}/#organization` }
};

export default function ContactPage() {
  return (
    <>
      <JsonLd data={[breadcrumbSchema([{ name: "Trang chủ", path: "/" }, { name: "Liên hệ", path: "/lien-he" }]), contactPageSchema]} />
      <Header />
      <main className="bg-[#f6f7f5] pt-[72px]">
        <section className="bg-forest-950 py-14 text-white lg:py-20">
          <div className="container-shell">
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-white/70">
              <Link href="/" className="min-h-11 content-center hover:text-white">Trang chủ</Link>
              <span aria-hidden="true">/</span>
              <span aria-current="page" className="text-white">Liên hệ</span>
            </nav>
            <h1 className="mt-7 text-balance text-4xl font-extrabold sm:text-5xl">Liên hệ Tùng Phát</h1>
            <p className="mt-5 max-w-3xl leading-8 text-white/80">Trao đổi nhu cầu vật liệu, catalogue hoặc gia công CNC qua điện thoại và Zalo. Website chưa công bố email và giờ làm việc, vì vậy hãy liên hệ trực tiếp trước khi đến.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <TrackedLink href={PHONE_HREF} eventName="click_phone" eventProperties={{ location: "contact_hero" }} className="inline-flex min-h-14 items-center justify-center gap-2 bg-wood-700 px-7 text-sm font-bold text-white"><Phone size={18} /> Gọi {PHONE_DISPLAY}</TrackedLink>
              <TrackedLink href={ZALO_URL} target="_blank" rel="noopener noreferrer" eventName="click_zalo" eventProperties={{ location: "contact_hero" }} className="inline-flex min-h-14 items-center justify-center gap-2 border border-white/35 px-7 text-sm font-bold text-white"><MessageCircle size={18} /> Nhắn Zalo</TrackedLink>
            </div>
          </div>
        </section>

        <section className="py-16 lg:py-24">
          <div className="container-shell">
            <div className="grid gap-5 lg:grid-cols-2">
              {locations.map((location) => (
                <article id={location.id} key={location.id} className="scroll-mt-28 overflow-hidden rounded-2xl border border-forest-900/10 bg-white shadow-card">
                  <div className="p-6 sm:p-7">
                    <span className="text-xs font-extrabold uppercase tracking-[.16em] text-wood-700">{location.shortId}</span>
                    <h2 className="mt-2 text-2xl font-extrabold text-forest-950">{location.name}</h2>
                    <p className="mt-3 flex items-start gap-2 text-sm font-semibold leading-6 text-slate-600"><MapPin size={18} className="mt-0.5 shrink-0 text-wood-600" />{location.address}</p>
                    <TrackedLink href={location.directionsUrl} target="_blank" rel="noopener noreferrer" eventName="click_directions" eventProperties={{ location: location.shortId }} className="mt-5 inline-flex min-h-12 items-center justify-center gap-2 bg-forest-900 px-5 text-sm font-bold text-white">Xem chỉ đường <MapPin size={17} /></TrackedLink>
                  </div>
                  <div className="h-[300px] border-t border-forest-900/10 sm:h-[340px]">
                    <iframe src={location.embedSrc} title={`Bản đồ ${location.name}`} loading="lazy" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" className="h-full w-full" style={{ border: 0 }} />
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
