import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { MaterialSelector } from "@/components/materials/MaterialSelector";
import { MaterialReferenceTable } from "@/components/materials/MaterialReferenceTable";
import { JsonLd } from "@/components/JsonLd";
import { SiteShell } from "@/components/site/SiteShell";
import { ContactCTA } from "@/components/ui/ContactCTA";
import { PageHero } from "@/components/ui/PageHero";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { getMaterialDataset } from "@/lib/materials";
import { absolutePageUrl, absoluteUrl, breadcrumbSchema, createPageMetadata, schemaPageId, webPageSchema } from "@/lib/seo";

const pagePath = "/tham-chieu-vat-lieu";
export const metadata = createPageMetadata({
  title: "Tham chiếu vật liệu MDF, gỗ ghép và CNC",
  description: "Bảng tham chiếu vật liệu Tùng Phát: dữ liệu đã kiểm tra, điểm còn cần xác nhận, so sánh MDF thường và MDF chống ẩm, cùng bộ chọn vật liệu định hướng.",
  path: pagePath,
});

export default function MaterialReferencePage() {
  const dataset = getMaterialDataset();
  const referenceId = schemaPageId(pagePath, "dataset");
  const mdf = dataset.materials.find((material) => material.slug === "van-mdf");
  const moistureMdf = dataset.materials.find((material) => material.slug === "mdf-chong-am");
  return (
    <>
      <JsonLd data={[
        webPageSchema({ path: pagePath, name: "Tham chiếu vật liệu MDF, gỗ ghép và CNC", description: metadata.description as string, type: "CollectionPage", primaryEntityId: referenceId, dateModified: dataset.lastVerified }),
        breadcrumbSchema([{ name: "Trang chủ", path: "/" }, { name: "Tham chiếu vật liệu", path: pagePath }]),
        { "@context": "https://schema.org", "@type": "Dataset", "@id": referenceId, name: "Bộ dữ liệu tham chiếu vật liệu Tùng Phát", description: dataset.description, url: absolutePageUrl(pagePath), inLanguage: "vi-VN", dateModified: dataset.lastVerified, creator: { "@id": schemaPageId("/", "organization") }, version: dataset.schemaVersion, isAccessibleForFree: true, distribution: { "@type": "DataDownload", encodingFormat: "application/json", contentUrl: absoluteUrl("/knowledge.json") } },
      ]} />
      <SiteShell>
        <PageHero breadcrumbs={[{ label: "Trang chủ", href: "/" }, { label: "Tham chiếu vật liệu" }]} eyebrow="Dữ liệu kỹ thuật có nguồn" title="Tham chiếu vật liệu để chọn và gửi yêu cầu rõ hơn" description="Một bảng dữ liệu nhỏ, có nguồn và có ngày kiểm tra. Tùng Phát chỉ công bố các nhận định đã có trong nội dung hiện tại; kích thước, độ dày, mã hàng và tồn kho chưa được xác minh sẽ để trống." />
        <section data-answer-block className="border-b border-forest-900/10 bg-[#edf4ef] py-8" aria-labelledby="reference-answer-title"><div className="container-shell max-w-4xl"><p className="eyebrow">Trả lời nhanh</p><h2 id="reference-answer-title" className="mt-3 text-2xl font-extrabold text-forest-950">Nên chọn vật liệu nào trước?</h2><p className="mt-3 text-base leading-8 text-slate-700">Bắt đầu bằng hạng mục, môi trường, bề mặt và yêu cầu CNC. MDF chống ẩm chỉ là hướng cân nhắc cho nơi ẩm hơn phòng khô, không phải cam kết chống nước; gỗ ghép cao su hoặc tràm phù hợp khi thiết kế cần bề mặt gỗ tự nhiên và có thể đối chiếu mẫu/lô hàng.</p></div></section>
        <section className="section-space bg-white"><div className="container-shell"><SectionHeader eyebrow="Bảng tham chiếu" title="Dữ liệu hiện có và điểm cần xác nhận" description={`Cập nhật dữ liệu: ${dataset.lastVerified}. Null không phải giá trị ước đoán; đó là dấu hiệu cần kiểm tra catalogue, mẫu hoặc mã hàng trước khi báo giá.`} /><div className="mt-8"><MaterialReferenceTable materials={dataset.materials} categories={[...new Set(dataset.materials.map((material) => material.category))]} lastVerified={dataset.lastVerified} /></div><p className="mt-5 text-sm text-slate-600">Tải bản CSV để làm checklist nội bộ: <a href="/material-reference.csv" className="font-bold text-wood-600 underline">material-reference.csv</a>.</p></div></section>
        <section className="section-space bg-[#f7f8f5]"><div className="container-shell"><SectionHeader eyebrow="So sánh có giới hạn" title="MDF thường và MDF chống ẩm" description="Bảng này chỉ tóm tắt những điểm đã có bằng chứng trên hai trang vật liệu; không gán tiêu chuẩn, mã hàng hoặc khả năng chống nước chưa được xác minh." /><div className="mt-8 overflow-x-auto"><table className="min-w-[720px] w-full border-collapse text-left text-sm"><caption className="sr-only">So sánh MDF thường và MDF chống ẩm</caption><thead><tr className="border-b border-forest-900/15 text-xs uppercase tracking-wide text-slate-500"><th className="p-3">Tiêu chí</th><th className="p-3">Ván MDF</th><th className="p-3">MDF chống ẩm</th></tr></thead><tbody>{[["Điều kiện ưu tiên", "Điều kiện khô khi kết cấu phù hợp", "Nơi ẩm hơn phòng khô sau khi xác nhận mã hàng"], ["Bề mặt và quy cách", "Cốt, độ dày và bề mặt theo mã hàng", "Cốt, độ dày, bề mặt và cạnh cần xác nhận riêng"], ["Nước trực tiếp", "Không mặc định chịu nước", "Không đồng nghĩa chống nước; không mặc định dùng nơi ngập"], ["CNC", "Có thể gửi file/danh sách để kiểm tra", "Có thể gửi file/danh sách để kiểm tra, cần chú ý cốt và cạnh"]].map(([criterion, regular, moisture]) => <tr key={criterion} className="border-b border-forest-900/10 align-top"><th scope="row" className="p-3 font-bold text-forest-950">{criterion}</th><td className="p-3 text-slate-700">{regular}</td><td className="p-3 text-slate-700">{moisture}</td></tr>)}</tbody></table></div><div className="mt-5 flex flex-wrap gap-3 text-sm"><Link href={`/${mdf?.slug}/`} className="inline-flex items-center gap-2 font-extrabold text-wood-600">Xem trang MDF <ArrowRight size={16} /></Link><Link href={`/${moistureMdf?.slug}/`} className="inline-flex items-center gap-2 font-extrabold text-wood-600">Xem MDF chống ẩm <ArrowRight size={16} /></Link></div></div></section>
        <section className="section-space bg-white"><div className="container-shell"><MaterialSelector /></div></section>
        <section className="border-y border-forest-900/10 bg-[#f7f8f5] py-8"><div className="container-shell text-sm text-slate-600"><p><strong className="text-forest-950">Nguồn và cách đọc:</strong> Các dòng dữ liệu liên kết tới trang nội dung tương ứng. Ngày kiểm tra phản ánh lần đối chiếu repository hiện tại, không phải cam kết hàng tồn kho. Xem thêm <Link href="/knowledge.json" className="font-bold text-wood-600 underline">knowledge.json</Link> để đọc bản máy.</p></div></section>
        <ContactCTA title="Đã có quy cách hoặc file cần kiểm tra?" description="Gửi hạng mục, môi trường, kích thước, độ dày, số lượng, bề mặt và yêu cầu CNC để Tùng Phát đối chiếu dữ liệu thực tế." />
      </SiteShell>
    </>
  );
}
