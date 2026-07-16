import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { JsonLd } from "@/components/JsonLd";
import { LegalPage } from "@/components/LegalPage";
import { breadcrumbSchema, createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Chính sách bảo mật",
  description: "Cách Tùng Phát tiếp nhận, sử dụng và bảo vệ thông tin khi khách hàng liên hệ tư vấn vật liệu gỗ hoặc gia công CNC.",
  path: "/chinh-sach-bao-mat"
});

export default function PrivacyPage() {
  return (
    <>
      <JsonLd data={breadcrumbSchema([{ name: "Trang chủ", path: "/" }, { name: "Chính sách bảo mật", path: "/chinh-sach-bao-mat" }])} />
      <Header />
      <LegalPage type="privacy" />
      <Footer />
    </>
  );
}
