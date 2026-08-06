import Image from "next/image";
import { ExternalLink, MapPin, Phone } from "lucide-react";
import { TrackedLink } from "@/components/TrackedLink";

export type ContactPhone = { display: string; href: string };
export type BranchLocationData = { id: string; shortId: string; name?: string; address: string; image: string; imageAlt: string; embedSrc: string; directionsUrl: string };
type BranchLocationProps = { location: BranchLocationData; phones: ContactPhone[] };

export function BranchLocation({ location, phones }: BranchLocationProps) {
  const branchNumber = location.shortId.replace(/\D/g, "");
  return (
    <article id={location.id} aria-labelledby={`${location.id}-title`} className="scroll-mt-32 overflow-hidden border border-forest-900/10 bg-white shadow-card">
      <div className="relative aspect-[4/3] bg-[#eef1ed]"><Image src={location.image} alt={location.imageAlt} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" /></div>
      <div className="p-6 sm:p-7">
        <p className="text-xs font-extrabold uppercase tracking-[.15em] text-wood-600">Chi nhánh {branchNumber}</p>
        <h2 id={`${location.id}-title`} className="mt-3 text-2xl font-extrabold text-forest-950">{location.name || `Tùng Phát - Chi nhánh ${branchNumber}`}</h2>
        <address className="mt-5 not-italic"><p className="flex items-start gap-3 text-sm font-semibold leading-7 text-slate-700"><MapPin size={19} className="mt-1 shrink-0 text-wood-600" aria-hidden="true" />{location.address}</p><div className="mt-4 flex flex-wrap gap-3">{phones.map((phone) => <TrackedLink key={phone.href} href={phone.href} eventName="click_phone" eventProperties={{ location: location.shortId }} className="inline-flex min-h-11 items-center gap-2 font-bold text-forest-900 hover:text-wood-600"><Phone size={17} aria-hidden="true" />{phone.display}</TrackedLink>)}</div></address>
        <div className="mt-6 border-t border-forest-900/10 pt-5"><h3 className="text-sm font-extrabold text-forest-950">Dịch vụ có thể trao đổi tại chi nhánh</h3><p className="mt-2 text-sm leading-7 text-slate-700">Kiểm tra vật liệu, quy cách tấm, mã bề mặt và tiếp nhận thông tin gia công CNC. Phạm vi cụ thể được xác nhận khi liên hệ.</p></div>
        <TrackedLink href={location.directionsUrl} target="_blank" rel="noopener noreferrer" eventName="click_directions" eventProperties={{ location: location.shortId }} className="pressable mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 bg-forest-900 px-5 text-sm font-extrabold text-white hover:bg-forest-800">Mở Google Maps <ExternalLink size={17} aria-hidden="true" /></TrackedLink>
      </div>
    </article>
  );
}
