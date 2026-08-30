import Image from "next/image";
import { HomeContent } from "@/components/home/HomeContent";
import { HomeBenefits, HomeHero } from "@/components/home/HomeHero";
import { RequirementFinder } from "@/components/home/RequirementFinder";
import { SiteShell } from "@/components/site/SiteShell";
import { TrackedLink } from "@/components/TrackedLink";
import { JsonLd } from "@/components/JsonLd";
import { ZALO_URL, createPageMetadata, webPageSchema } from "@/lib/seo";
import { TrustindexReviews, type TrustindexReviewData } from "@/components/reviews/TrustindexReviews";
import trustindexReviews from "@/data/trustindex-reviews.json";

const homepageTitle = "Tùng Phát | Ván MDF, MFC, gỗ ghép & gia công CNC TP.HCM";

export const metadata = {
  ...createPageMetadata({
    title: homepageTitle,
    description: "Tùng Phát cung cấp MDF, MFC, plywood, gỗ ghép, vật liệu bề mặt và nhận gia công CNC theo quy cách tại TP.HCM. Liên hệ tư vấn và nhận báo giá.",
    path: "/"
  }),
  title: { absolute: homepageTitle }
};

export default async function Home() {
  return (
    <>
      <JsonLd data={webPageSchema({ path: "/", name: homepageTitle, description: "Tùng Phát cung cấp MDF, MFC, plywood, gỗ ghép, vật liệu bề mặt và nhận gia công CNC theo quy cách tại TP.HCM.", primaryEntityId: "https://mdftungphat.com/#organization" })} />
      <SiteShell thirdMobileAction={{ href: "#requirement-finder", label: "Gửi yêu cầu" }}>
      <HomeHero />
      <RequirementFinder />
      <HomeBenefits />
      <TrustindexReviews data={trustindexReviews as TrustindexReviewData} />
      <HomeContent />
      <TrackedLink
        href={ZALO_URL}
        target="_blank"
        rel="noopener noreferrer"
        eventName="click_zalo"
        eventProperties={{ location: "home_floating" }}
        aria-label="Mở Zalo Tùng Phát"
        className="floating-zalo fixed bottom-[max(16px,env(safe-area-inset-bottom))] right-4 z-40 hidden h-16 w-16 place-items-center rounded-full border-2 border-white bg-white p-0.5 md:grid md:bottom-5 md:right-5"
      >
        <Image
          src="/images/zalo-contact.png"
          alt=""
          width={64}
          height={64}
          className="h-full w-full rounded-full object-contain"
          aria-hidden="true"
        />
      </TrackedLink>
      </SiteShell>
    </>
  );
}
