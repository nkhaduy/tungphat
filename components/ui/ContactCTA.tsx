import { MessageCircle, Phone } from "lucide-react";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { PHONE_DISPLAY, PHONE_HREF, ZALO_URL } from "@/lib/seo";

type ContactCTAProps = { eyebrow?: string; title: string; description: string; zaloLabel?: string };

export function ContactCTA({ eyebrow = "Trao đổi trực tiếp", title, description, zaloLabel = "Gửi yêu cầu qua Zalo" }: ContactCTAProps) {
  return (
    <section className="bg-[#edf4ef] py-10 sm:py-12">
      <div className="container-shell flex flex-col gap-7 border border-forest-900/10 bg-white p-6 shadow-card sm:p-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-3xl"><p className="eyebrow">{eyebrow}</p><h2 className="mt-4 text-2xl font-extrabold text-forest-950 sm:text-3xl">{title}</h2><p className="mt-3 leading-7 text-slate-700">{description}</p></div>
        <div className="flex shrink-0 flex-col gap-3 sm:flex-row"><ButtonLink href={ZALO_URL} target="_blank" rel="noopener noreferrer"><MessageCircle size={18} aria-hidden="true" />{zaloLabel}</ButtonLink><ButtonLink href={PHONE_HREF} variant="secondary"><Phone size={18} aria-hidden="true" />Gọi {PHONE_DISPLAY}</ButtonLink></div>
      </div>
    </section>
  );
}
