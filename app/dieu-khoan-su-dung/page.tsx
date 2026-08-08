import { JsonLd } from "@/components/JsonLd";
import { LegalPage } from "@/components/LegalPage";
import { SiteShell } from "@/components/site/SiteShell";
import { breadcrumbSchema, createPageMetadata, webPageSchema } from "@/lib/seo";

export const metadata = createPageMetadata({ title: "Điều khoản sử dụng", description: "Điều khoản sử dụng website Tùng Phát - Vật liệu gỗ và gia công CNC.", path: "/dieu-khoan-su-dung" });

export default function TermsPage() {
  return (
    <SiteShell>
      <JsonLd data={[webPageSchema({ path: "/dieu-khoan-su-dung", name: "Điều khoản sử dụng", description: "Điều khoản sử dụng website Tùng Phát." }), breadcrumbSchema([{ name: "Trang chủ", path: "/" }, { name: "Điều khoản sử dụng", path: "/dieu-khoan-su-dung" }])]} />
      <LegalPage type="terms" />
    </SiteShell>
  );
}
