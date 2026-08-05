import { ArrowRight, MessageCircle, Phone } from "lucide-react";
import { TrackedLink } from "@/components/TrackedLink";
import { PHONE_DISPLAY, PHONE_HREF, ZALO_URL } from "@/lib/seo";
import { buildZaloInquiryUrl } from "@/lib/catalog/import-utils";

export function ProductInquiryCTA({ code }: { code?: string }) {
  const messageUrl = code ? buildZaloInquiryUrl(ZALO_URL, code) : ZALO_URL;
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <TrackedLink
        href={messageUrl}
        target="_blank"
        rel="noopener noreferrer"
        eventName="request_quote"
        eventProperties={{ location: "ba_thanh_catalogue", channel: "zalo" }}
        className="group inline-flex min-h-12 touch-manipulation items-center justify-center gap-2 bg-wood-500 px-4 text-sm font-extrabold text-white transition-[transform,background-color] duration-[180ms] ease-out hover:-translate-y-0.5 hover:bg-wood-600 focus-visible:ring-2 focus-visible:ring-wood-500 focus-visible:ring-offset-2 active:scale-[.97] motion-reduce:transform-none motion-reduce:transition-none"
      >
        <MessageCircle size={17} aria-hidden="true" /> Gửi mã qua Zalo
      </TrackedLink>
      <TrackedLink
        href={PHONE_HREF}
        eventName="click_phone"
        eventProperties={{ location: "ba_thanh_catalogue" }}
        className="inline-flex min-h-12 touch-manipulation items-center justify-center gap-2 border border-forest-900/20 px-4 text-sm font-extrabold text-forest-950 transition-[transform,border-color] duration-[180ms] ease-out hover:-translate-y-0.5 hover:border-wood-500 focus-visible:ring-2 focus-visible:ring-wood-500 focus-visible:ring-offset-2 active:scale-[.97] motion-reduce:transform-none motion-reduce:transition-none"
      >
        <Phone size={17} className="text-wood-600" aria-hidden="true" /> {PHONE_DISPLAY}
      </TrackedLink>
      <TrackedLink
        href="/bao-gia/"
        eventName="request_quote"
        eventProperties={{ location: "ba_thanh_catalogue", channel: "form" }}
        className="inline-flex min-h-12 touch-manipulation items-center justify-center gap-2 border border-forest-900/20 px-4 text-sm font-extrabold text-forest-950 transition-[transform,border-color] duration-[180ms] ease-out hover:-translate-y-0.5 hover:border-wood-500 focus-visible:ring-2 focus-visible:ring-wood-500 focus-visible:ring-offset-2 active:scale-[.97] motion-reduce:transform-none motion-reduce:transition-none"
      >
        Báo giá theo quy cách <ArrowRight size={17} aria-hidden="true" />
      </TrackedLink>
    </div>
  );
}
