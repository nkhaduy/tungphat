import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Điều khoản sử dụng | Tùng Phát",
  description: "Điều khoản sử dụng website Tùng Phát - Vật liệu gỗ & Gia công CNC."
};

export default function TermsPage() {
  return (
    <>
      <Header />
      <LegalPage type="terms" />
      <Footer />
    </>
  );
}