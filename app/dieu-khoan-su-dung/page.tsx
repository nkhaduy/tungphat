import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { JsonLd } from "@/components/JsonLd";
import { LegalPage } from "@/components/LegalPage";
import { breadcrumbSchema, createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Điều khoản sử dụng",
  description: "Điều khoản khi truy cập website và sử dụng thông tin về vật liệu gỗ, catalogue, báo giá và dịch vụ gia công CNC của Tùng Phát.",
  path: "/dieu-khoan-su-dung"
});

export default function TermsPage() {
  return (
    <>
      <JsonLd data={breadcrumbSchema([{ name: "Trang chủ", path: "/" }, { name: "Điều khoản sử dụng", path: "/dieu-khoan-su-dung" }])} />
      <Header />
      <LegalPage type="terms" />
      <Footer />
    </>
  );
}
