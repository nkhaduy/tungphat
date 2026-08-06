import { MessageCircle, Phone, Send } from "lucide-react";
import { TrackedLink } from "@/components/TrackedLink";
import { PHONE_HREF, ZALO_URL } from "@/lib/seo";

type StickyMobileActionsProps = {
  thirdHref?: string;
  thirdLabel?: string;
};

export function StickyMobileActions({ thirdHref, thirdLabel = "Gửi yêu cầu" }: StickyMobileActionsProps) {
  return (
    <nav aria-label="Liên hệ nhanh" className={`fixed inset-x-0 bottom-0 z-50 grid ${thirdHref ? "grid-cols-3" : "grid-cols-2"} border-t border-forest-900/10 bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_30px_rgba(7,59,40,.12)] md:hidden`}>
      <TrackedLink href={PHONE_HREF} eventName="click_phone" eventProperties={{ location: "site_mobile_action_bar" }} className="flex min-h-16 flex-col items-center justify-center gap-1 border-r border-forest-900/10 text-xs font-extrabold text-forest-950"><Phone size={20} className="text-wood-600" aria-hidden="true" />Gọi</TrackedLink>
      <TrackedLink href={ZALO_URL} target="_blank" rel="noopener noreferrer" eventName="click_zalo" eventProperties={{ location: "site_mobile_action_bar" }} className="flex min-h-16 flex-col items-center justify-center gap-1 border-r border-forest-900/10 text-xs font-extrabold text-[#005bd8]"><MessageCircle size={20} aria-hidden="true" />Zalo</TrackedLink>
      {thirdHref ? <a href={thirdHref} className="flex min-h-16 flex-col items-center justify-center gap-1 bg-wood-500 text-xs font-extrabold text-white"><Send size={20} aria-hidden="true" />{thirdLabel}</a> : null}
    </nav>
  );
}
