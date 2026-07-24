import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { LegalPage } from "@/components/LegalPage";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Điều khoản sử dụng",
  description: "Điều khoản sử dụng website Tùng Phát - Vật liệu gỗ & Gia công CNC.",
  path: "/dieu-khoan-su-dung/",
});

export default function TermsPage() {
  return (
    <>
      <Header appearance="dark" />
      <LegalPage type="terms" />
      <Footer />
    </>
  );
}
