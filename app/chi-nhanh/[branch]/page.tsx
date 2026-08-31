import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ExternalLink, MapPin, MessageCircle, Phone } from "lucide-react";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { LocalIntentLinks } from "@/components/content/LocalIntentLinks";
import { SiteShell } from "@/components/site/SiteShell";
import { TrackedLink } from "@/components/TrackedLink";
import { ContactCTA } from "@/components/ui/ContactCTA";
import { PageHero } from "@/components/ui/PageHero";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { branchPageSlugs, branchPathForLocationId, getBranchPageConfig } from "@/lib/branch-pages";
import { buildLocalBusinessSchema } from "@/lib/entity-schema";
import { locations } from "@/lib/locations";
import { PHONE_DISPLAY, PHONE_HREF, ZALO_URL, breadcrumbSchema, createPageMetadata, schemaPageId, webPageSchema } from "@/lib/seo";

type BranchRouteProps = { params: Promise<{ branch: string }> };

export const dynamicParams = false;

function getBranchPage(branch: string) {
  const config = getBranchPageConfig(branch);
  const location = config ? locations.find((candidate) => candidate.id === config.locationId) : undefined;
  return config && location ? { config, location, path: branchPathForLocationId(location.id) } : undefined;
}

export function generateStaticParams() {
  return branchPageSlugs.map((branch) => ({ branch }));
}

export async function generateMetadata({ params }: BranchRouteProps): Promise<Metadata> {
  const { branch } = await params;
  const page = getBranchPage(branch);
  if (!page) return {};
  return createPageMetadata({ title: page.config.seoTitle, description: page.config.seoDescription, path: page.path });
}

export default async function BranchPage({ params }: BranchRouteProps) {
  const { branch } = await params;
  const page = getBranchPage(branch);
  if (!page) notFound();

  const { config, location, path } = page;
  const branchEntityId = schemaPageId(path, "local-business");
  const description = config.intro;
  const localBusinessSchema = buildLocalBusinessSchema(location, path);
  const pageSchema = webPageSchema({ path, name: config.h1, description, primaryEntityId: branchEntityId });

  return (
    <>
      <JsonLd data={[pageSchema, breadcrumbSchema([{ name: "Trang chủ", path: "/" }, { name: "Liên hệ", path: "/lien-he" }, { name: config.h1, path }]), localBusinessSchema]} />
      <SiteShell>
        <PageHero
          breadcrumbs={[{ label: "Trang chủ", href: "/" }, { label: "Liên hệ", href: "/lien-he" }, { label: config.h1 }]}
          eyebrow="Điểm liên hệ tại Thủ Đức"
          title={config.h1}
          description={description}
          image={{ src: location.image, alt: location.imageAlt, priority: true }}
          actions={
            <>
              <TrackedLink href={PHONE_HREF} eventName="click_phone" eventProperties={{ location: branch }} className="pressable inline-flex min-h-14 items-center justify-center gap-2 bg-forest-900 px-6 text-sm font-extrabold text-white hover:bg-forest-800"><Phone size={18} aria-hidden="true" />Gọi {PHONE_DISPLAY}</TrackedLink>
              <TrackedLink href={ZALO_URL} target="_blank" rel="noopener noreferrer" eventName="click_zalo" eventProperties={{ location: branch }} className="pressable inline-flex min-h-14 items-center justify-center gap-2 border border-forest-900/20 bg-white px-6 text-sm font-extrabold text-forest-950 hover:border-forest-900"><MessageCircle size={18} aria-hidden="true" />Nhắn Zalo</TrackedLink>
            </>
          }
        />

        <section data-answer-block className="border-b border-forest-900/10 bg-[#edf4ef] py-8" aria-labelledby="branch-answer-title">
          <div className="container-shell max-w-4xl">
            <p className="text-xs font-extrabold uppercase tracking-[.15em] text-wood-600">Thông tin nhanh</p>
            <h2 id="branch-answer-title" className="mt-2 text-2xl font-extrabold text-forest-950">Địa chỉ và cách liên hệ chi nhánh</h2>
            <p className="mt-3 text-base leading-8 text-slate-700">{location.address}. {config.visitGuidance}</p>
          </div>
        </section>

        <section className="section-space bg-white">
          <div className="container-shell grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-start">
            <div className="border border-forest-900/10 bg-[#f7f8f5] p-7 sm:p-8">
              <p className="eyebrow">Địa chỉ chi nhánh</p>
              <h2 className="mt-4 text-2xl font-extrabold text-forest-950">{location.name}</h2>
              <address className="mt-6 not-italic">
                <p className="flex items-start gap-3 text-sm font-semibold leading-7 text-slate-700"><MapPin size={19} className="mt-1 shrink-0 text-wood-600" aria-hidden="true" />{location.address}</p>
                <a href={PHONE_HREF} className="mt-4 inline-flex min-h-11 items-center gap-3 text-sm font-extrabold text-forest-950 hover:text-wood-600"><Phone size={17} className="text-wood-600" aria-hidden="true" />{PHONE_DISPLAY}</a>
              </address>
              <TrackedLink href={location.directionsUrl} target="_blank" rel="noopener noreferrer" eventName="click_directions" eventProperties={{ location: branch }} className="pressable mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 bg-forest-900 px-5 text-sm font-extrabold text-white hover:bg-forest-800">Mở Google Maps <ExternalLink size={17} aria-hidden="true" /></TrackedLink>
            </div>
            <div>
              <SectionHeader eyebrow={config.sectionEyebrow} title={config.sectionTitle} description={config.sectionDescription} />
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {config.checklist.map(({ title, text }) => <article key={title} className="border border-forest-900/10 bg-[#fbfcfa] p-6"><h3 className="text-lg font-extrabold text-forest-950">{title}</h3><p className="mt-3 text-sm leading-7 text-slate-700">{text}</p></article>)}
              </div>
            </div>
          </div>
        </section>

        <section className="section-space bg-[#f7f8f5]">
          <div className="container-shell">
            <SectionHeader eyebrow="Trang liên quan" title="Xem vật liệu và dịch vụ trước khi liên hệ" description="Các trang dưới đây giúp bạn gửi nhu cầu rõ hơn trước khi gọi hoặc nhắn Zalo cho chi nhánh." />
            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {config.relatedLinks.map(([label, href]) => <Link key={href} href={href} className="group flex min-h-16 items-center justify-between gap-3 border border-forest-900/10 bg-white px-5 text-sm font-extrabold text-forest-950 hover:border-wood-500/50 hover:text-wood-600">{label}<ArrowRight size={16} className="shrink-0 transition-transform group-hover:translate-x-1" aria-hidden="true" /></Link>)}
            </div>
          </div>
        </section>
        <LocalIntentLinks />
        <ContactCTA eyebrow="Liên hệ chi nhánh" title={config.finalTitle} description={config.finalDescription} zaloLabel="Nhắn Zalo cho Tùng Phát" />
      </SiteShell>
    </>
  );
}
