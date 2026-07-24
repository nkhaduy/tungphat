import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { LegalPage } from "@/components/LegalPage";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Chính sách bảo mật",
  description: "Chính sách bảo mật thông tin khách hàng tại Tùng Phát - Vật liệu gỗ & Gia công CNC.",
  path: "/chinh-sach-bao-mat/",
});

export default function PrivacyPage() {
  return (
    <>
      <Header appearance="dark" />
      <LegalPage type="privacy" />
      <Footer />
    </>
  );
}
