import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Chính sách bảo mật | Tùng Phát",
  description: "Chính sách bảo mật thông tin khách hàng tại Tùng Phát - Vật liệu gỗ & Gia công CNC."
};

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <LegalPage type="privacy" />
      <Footer />
    </>
  );
}