import { JsonLd } from "@/components/JsonLd";
import { LegalPage } from "@/components/LegalPage";
import { SiteShell } from "@/components/site/SiteShell";
import { breadcrumbSchema, createPageMetadata, webPageSchema } from "@/lib/seo";

export const metadata = createPageMetadata({ title: "Chính sách bảo mật", description: "Chính sách bảo mật thông tin khách hàng tại Tùng Phát - Vật liệu gỗ và gia công CNC.", path: "/chinh-sach-bao-mat" });

export default function PrivacyPage() {
  return (
    <SiteShell>
      <JsonLd data={[webPageSchema({ path: "/chinh-sach-bao-mat", name: "Chính sách bảo mật", description: "Chính sách bảo mật thông tin khách hàng tại Tùng Phát." }), breadcrumbSchema([{ name: "Trang chủ", path: "/" }, { name: "Chính sách bảo mật", path: "/chinh-sach-bao-mat" }])]} />
      <LegalPage type="privacy" />
    </SiteShell>
  );
}
