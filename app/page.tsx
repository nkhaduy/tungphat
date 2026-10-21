import Image from "next/image";
import { HomeContent } from "@/components/home/HomeContent";
import { HomeHero } from "@/components/home/HomeHero";
import { SiteShell } from "@/components/site/SiteShell";
import { TrackedLink } from "@/components/TrackedLink";
import { JsonLd } from "@/components/JsonLd";
import { ZALO_URL, createPageMetadata, webPageSchema } from "@/lib/seo";
import { TrustindexReviews, type TrustindexReviewData } from "@/components/reviews/TrustindexReviews";
import { ContactCTA } from "@/components/ui/ContactCTA";
import trustindexReviews from "@/data/trustindex-reviews.json";

const homepageTitle = "Tùng Phát | Ván gỗ công nghiệp & Gia công CNC tại Thủ Đức";

export const metadata = {
  ...createPageMetadata({
    title: homepageTitle,
    description: "Chọn cốt ván, bề mặt Thanh Thùy, Ba Thanh và dịch vụ cắt/CNC tại Tùng Phát, Thủ Đức. Tra mã màu rồi gửi quy cách để nhận báo giá.",
    path: "/"
  }),
  title: { absolute: homepageTitle }
};

export default async function Home() {
  return (
    <>
      <JsonLd data={webPageSchema({ path: "/", name: homepageTitle, description: "Tùng Phát cung cấp cốt ván, bề mặt trang trí và nhận cắt, gia công CNC tại Thủ Đức.", primaryEntityId: "https://mdftungphat.com/#organization" })} />
      <SiteShell>
        <HomeHero />
        <HomeContent />
        <TrustindexReviews data={trustindexReviews as TrustindexReviewData} />
        <ContactCTA title="Đã chọn được vật liệu hoặc mã màu?" description="Gửi mã, cốt ván, độ dày, số lượng và kích thước qua Zalo. Nếu cần cắt hoặc CNC, gửi thêm file hay bản vẽ để xưởng kiểm tra trước khi báo giá." zaloLabel="Gửi yêu cầu qua Zalo" />
      </SiteShell>
      <TrackedLink
        href={ZALO_URL}
        target="_blank"
        rel="noopener noreferrer"
        eventName="click_zalo"
        eventProperties={{ location: "home_floating" }}
        aria-label="Mở Zalo Tùng Phát"
        className="floating-zalo fixed bottom-[calc(5.25rem+env(safe-area-inset-bottom))] right-4 z-[60] grid h-16 w-16 place-items-center rounded-full border-2 border-white bg-white p-0.5 md:bottom-5 md:right-5"
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
    </>
  );
}
