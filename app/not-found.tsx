import type { Metadata } from "next";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { SiteShell } from "@/components/site/SiteShell";
import { TrackedLink } from "@/components/TrackedLink";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { PageHero } from "@/components/ui/PageHero";
import { ZALO_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: "ERROR 404 — Trang này không tồn tại",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <SiteShell mainClassName="min-h-[100dvh]">
      <PageHero
        breadcrumbs={[{ label: "Trang chủ", href: "/" }, { label: "Lỗi 404" }]}
        eyebrow="Lỗi 404"
        title="Trang này không tồn tại"
        description="Đường dẫn có thể đã được nhập sai hoặc nội dung chưa được xuất bản. Bạn có thể quay về trang chủ hoặc gửi yêu cầu trực tiếp cho Tùng Phát."
        image={{ src: "/images/404-desktop.webp", alt: "Các số 404 bằng gỗ trên nền sáng", priority: true }}
        actions={
          <>
            <ButtonLink href="/" variant="dark" className="min-h-14 px-6"><ArrowLeft size={18} aria-hidden="true" />Về trang chủ</ButtonLink>
            <TrackedLink href={ZALO_URL} target="_blank" rel="noopener noreferrer" eventName="click_zalo" eventProperties={{ location: "404" }} className="pressable inline-flex min-h-14 items-center justify-center gap-2 bg-wood-500 px-6 text-sm font-extrabold text-white hover:bg-wood-600"><MessageCircle size={18} aria-hidden="true" />Liên hệ qua Zalo</TrackedLink>
          </>
        }
      />
    </SiteShell>
  );
}
