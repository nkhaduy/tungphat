import { MessageCircle } from "lucide-react";
import { HomeContent } from "@/components/home/HomeContent";
import { HomeBenefits, HomeHero } from "@/components/home/HomeHero";
import { RequirementFinder } from "@/components/home/RequirementFinder";
import { SiteShell } from "@/components/site/SiteShell";
import { TrackedLink } from "@/components/TrackedLink";
import { ZALO_URL, createPageMetadata } from "@/lib/seo";

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
    <SiteShell thirdMobileAction={{ href: "#requirement-finder", label: "Gửi yêu cầu" }}>
      <HomeHero />
      <RequirementFinder />
      <HomeBenefits />
      <HomeContent />
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
    </SiteShell>
  );
}
