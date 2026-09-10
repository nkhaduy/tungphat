import Image from "next/image";
import { ExternalLink, MapPin, Phone } from "lucide-react";
import { TrackedLink } from "@/components/TrackedLink";

export type ContactPhone = { display: string; href: string };
export type BranchLocationData = { id: string; shortId: string; name?: string; address: string; image: string; imageAlt: string; embedSrc: string; directionsUrl: string };
type BranchLocationProps = { location: BranchLocationData; phones: ContactPhone[] };

export function BranchLocation({ location, phones }: BranchLocationProps) {
  return (
    <article id={location.id} aria-labelledby={`${location.id}-title`} className="scroll-mt-32 overflow-hidden border border-forest-900/10 bg-white shadow-card">
      <div className="relative aspect-[4/3] bg-[#eef1ed]"><Image src={location.image} alt={location.imageAlt} fill sizes="(max-width: 1023px) 100vw, 50vw" className="object-cover" /></div>
      <div className="p-6 sm:p-7">
        <h2 id={`${location.id}-title`} className="text-2xl font-extrabold text-forest-950">{location.name}</h2>
        <address className="mt-5 not-italic">
          <p className="flex items-start gap-3 text-sm font-semibold leading-7 text-slate-700"><MapPin size={19} className="mt-1 shrink-0 text-wood-600" aria-hidden="true" />{location.address}</p>
          <div className="mt-4 flex flex-wrap gap-3">{phones.map((phone) => <TrackedLink key={phone.href} href={phone.href} eventName="click_phone" eventProperties={{ location: location.shortId }} className="inline-flex min-h-11 items-center gap-2 font-bold text-forest-900 hover:text-wood-600"><Phone size={17} aria-hidden="true" />{phone.display}</TrackedLink>)}</div>
        </address>
      </div>
      <div className="border-t border-forest-900/10">
        <iframe title={`Google Maps - ${location.name}`} src={location.embedSrc} loading="lazy" className="aspect-video w-full border-0" referrerPolicy="no-referrer-when-downgrade" />
      </div>
      <div className="px-6 py-4 sm:px-7">
        <TrackedLink href={location.directionsUrl} target="_blank" rel="noopener noreferrer" eventName="click_directions" eventProperties={{ location: location.shortId }} className="inline-flex min-h-11 items-center gap-2 text-sm font-extrabold text-forest-900 underline decoration-wood-500/70 underline-offset-4 hover:text-wood-600">Xem trên Google Maps <ExternalLink size={16} aria-hidden="true" /></TrackedLink>
      </div>
    </article>
  );
}
