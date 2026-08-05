import { MessageCircle, Phone, Send } from "lucide-react";
import { HomeContent } from "@/components/home/HomeContent";
import { HomeFooter } from "@/components/home/HomeFooter";
import { HomeHeader } from "@/components/home/HomeHeader";
import { HomeBenefits, HomeHero } from "@/components/home/HomeHero";
import { RequirementFinder } from "@/components/home/RequirementFinder";
import { TrackedLink } from "@/components/TrackedLink";
import { PHONE_HREF, ZALO_URL, createPageMetadata } from "@/lib/seo";

const homepageTitle = "Tùng Phát | Ván MDF, MFC, gỗ ghép & gia công CNC TP.HCM";

export const metadata = {
  ...createPageMetadata({
    title: homepageTitle,
    description: "Tùng Phát cung cấp MDF, MFC, plywood, gỗ ghép, vật liệu bề mặt và nhận gia công CNC theo quy cách tại TP.HCM. Liên hệ tư vấn và nhận báo giá.",
    path: "/"
  }),
  title: { absolute: homepageTitle }
};

export default function Home() {
  return (
    <>
      <HomeHeader />
      <main id="noi-dung-chinh">
        <HomeHero />
        <RequirementFinder />
        <HomeBenefits />
        <HomeContent />
      </main>
      <HomeFooter />
      <TrackedLink
        href={ZALO_URL}
        target="_blank"
        rel="noopener noreferrer"
        eventName="click_zalo"
        eventProperties={{ location: "home_floating" }}
        aria-label="Mở Zalo Tùng Phát"
        className="fixed bottom-[max(16px,env(safe-area-inset-bottom))] right-4 z-40 hidden h-14 w-14 place-items-center rounded-full border-2 border-white bg-[#0068ff] text-white shadow-[0_10px_28px_rgba(0,0,0,.25)] transition hover:-translate-y-1 md:grid md:bottom-5 md:right-5"
      >
        <MessageCircle size={24} aria-hidden="true" />
      </TrackedLink>
      <nav aria-label="Liên hệ nhanh" className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-3 border-t border-forest-900/10 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_30px_rgba(7,59,40,.12)] backdrop-blur-lg md:hidden">
        <TrackedLink href={PHONE_HREF} eventName="click_phone" eventProperties={{ location: "home_mobile_action_bar" }} className="flex min-h-16 flex-col items-center justify-center gap-1 border-r border-forest-900/10 text-xs font-extrabold text-forest-950"><Phone size={20} className="text-wood-600" aria-hidden="true" />Gọi</TrackedLink>
        <TrackedLink href={ZALO_URL} target="_blank" rel="noopener noreferrer" eventName="click_zalo" eventProperties={{ location: "home_mobile_action_bar" }} className="flex min-h-16 flex-col items-center justify-center gap-1 border-r border-forest-900/10 text-xs font-extrabold text-[#005bd8]"><MessageCircle size={20} aria-hidden="true" />Zalo</TrackedLink>
        <a href="#requirement-finder" className="flex min-h-16 flex-col items-center justify-center gap-1 bg-wood-500 text-xs font-extrabold text-white"><Send size={20} aria-hidden="true" />Gửi yêu cầu</a>
      </nav>
    </>
  );
}
