import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { JsonLd } from "@/components/JsonLd";
import {
  BranchLocation,
  type ContactPhone,
} from "@/components/contact/BranchLocation";
import { ContactHero } from "@/components/contact/ContactHero";
import { TrackedLink } from "@/components/TrackedLink";
import { ViewTracker } from "@/components/ViewTracker";
import business from "@/content/settings/business.json";
import staticPages from "@/content/settings/static-pages.json";
import { locations } from "@/lib/locations";
import {
  BUSINESS_NAME,
  PHONE_DISPLAY,
  PHONE_HREF,
  TAX_ID,
  ZALO_URL,
  absolutePageUrl,
  breadcrumbSchema,
  createPageMetadata,
  schemaPageId,
} from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Liên hệ",
  description:
    "Liên hệ Tùng Phát qua Zalo, email hoặc điện thoại; xem địa chỉ và bản đồ hai chi nhánh tại đường Tam Bình, phường Hiệp Bình, TP. Hồ Chí Minh.",
  path: "/lien-he",
});

const contactPageSchema = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  "@id": schemaPageId("/lien-he", "webpage"),
  url: absolutePageUrl("/lien-he"),
  name: "Liên hệ Tùng Phát",
  about: { "@id": schemaPageId("/", "organization") },
};

const phones: ContactPhone[] = [
  { display: `${PHONE_DISPLAY} (Mr. Tùng)`, href: PHONE_HREF },
];

export default function ContactPage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Trang chủ", path: "/" },
            { name: "Liên hệ", path: "/lien-he" },
          ]),
          contactPageSchema,
        ]}
      />
      <Header />
      <main className="bg-white">
        <ContactHero
          description={staticPages.contactIntro}
          zaloUrl={ZALO_URL}
        />

        <ViewTracker event="view_contact_page" contentType="contact" />
        <section
          aria-labelledby="contact-details-title"
          className="bg-white py-16 lg:py-24"
        >
          <div className="container-shell">
            <h2
              id="contact-details-title"
              className="text-balance text-3xl font-extrabold tracking-[-.02em] text-forest-950 sm:text-4xl"
            >
              Thông tin liên hệ
            </h2>

            <div className="mt-10 grid gap-10 lg:grid-cols-[.9fr_1.1fr] lg:gap-16">
              <div>
                <p className="text-sm font-bold text-slate-500">Tên công ty</p>
                <p className="mt-3 max-w-[34rem] text-xl font-extrabold leading-8 text-forest-950">
                  {BUSINESS_NAME.toUpperCase()}
                </p>
                <dl className="mt-7 border-t border-forest-900/12 pt-5">
                  <div className="grid gap-1 sm:grid-cols-[9rem_1fr] sm:items-baseline">
                    <dt className="text-sm font-bold text-slate-500">
                      Mã số thuế
                    </dt>
                    <dd className="font-bold tabular-nums text-forest-950">
                      {TAX_ID}
                    </dd>
                  </div>
                </dl>
              </div>

              <dl className="divide-y divide-forest-900/12 border-y border-forest-900/12">
                <div className="grid gap-2 py-5 sm:grid-cols-[9rem_1fr] sm:items-center">
                  <dt className="text-sm font-bold text-slate-500">
                    Điện thoại
                  </dt>
                  <dd className="flex flex-col items-start gap-1 sm:flex-row sm:flex-wrap sm:gap-x-6">
                    {phones.map((phone) => (
                      <TrackedLink
                        key={phone.href}
                        href={phone.href}
                        eventName="click_phone"
                        eventProperties={{ location: "contact_details" }}
                        className="inline-flex min-h-11 items-center font-bold tabular-nums text-forest-900 transition-colors hover:text-wood-600"
                      >
                        {phone.display}
                      </TrackedLink>
                    ))}
                  </dd>
                </div>
                <div className="grid gap-2 py-5 sm:grid-cols-[9rem_1fr] sm:items-center">
                  <dt className="text-sm font-bold text-slate-500">Email</dt>
                  <dd>
                    <a
                      href={`mailto:${business.email}`}
                      className="inline-flex min-h-11 items-center font-bold text-forest-900 transition-colors hover:text-wood-600"
                    >
                      {business.email}
                    </a>
                  </dd>
                </div>
              </dl>
            </div>

            <div
              id="branch-locations"
              className="mt-12 scroll-mt-24 border-t border-forest-900/12 pt-8"
            >
              <p className="text-sm font-bold text-slate-500">
                Hệ thống chi nhánh
              </p>
              <div className="mt-5 grid gap-5 md:grid-cols-2 md:gap-10">
                {locations.map((location) => (
                  <a
                    key={location.id}
                    href={`#${location.id}`}
                    className="group block border-b border-forest-900/12 pb-5"
                  >
                    <span className="text-sm font-extrabold text-forest-950 transition-colors group-hover:text-wood-600">
                      {location.name}
                    </span>
                    <span className="mt-2 block text-sm font-medium leading-6 text-slate-600">
                      {location.address}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>

        {locations.map((location) => (
          <BranchLocation
            key={location.id}
            location={location}
            phones={phones}
          />
        ))}
      </main>
      <Footer showBranchMapEmbeds={false} />
    </>
  );
}
