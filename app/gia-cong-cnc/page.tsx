import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, FileCheck2, MessageCircle, PackageCheck, Phone, Settings2, Upload } from "lucide-react";
import { JsonLd } from "@/components/JsonLd";
import { SiteShell } from "@/components/site/SiteShell";
import { TrackedLink } from "@/components/TrackedLink";
import { ContactCTA } from "@/components/ui/ContactCTA";
import { PageHero } from "@/components/ui/PageHero";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { PHONE_DISPLAY, PHONE_HREF, SITE_URL, ZALO_URL, breadcrumbSchema, createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({ title: "Gia công CNC gỗ theo kích thước, bản vẽ", description: "Tùng Phát nhận cắt, khoan, soi rãnh và gia công CNC ván gỗ theo kích thước hoặc file kỹ thuật, có bước xác nhận quy cách trước khi chạy máy.", path: "/gia-cong-cnc" });

const serviceSchema = { "@context": "https://schema.org", "@type": "Service", "@id": `${SITE_URL}/gia-cong-cnc#service`, name: "Gia công CNC gỗ theo yêu cầu", serviceType: "Gia công CNC ván gỗ", description: "Cắt, khoan, soi rãnh và gia công chi tiết ván gỗ theo kích thước hoặc file kỹ thuật.", url: `${SITE_URL}/gia-cong-cnc`, provider: { "@id": `${SITE_URL}/#organization` } };

const capabilities = ["Cắt ván theo kích thước đã xác nhận", "Khoan liên kết theo thông tin kỹ thuật", "Soi rãnh và cắt hoa văn", "Gia công chi tiết theo file hoặc bản phác thảo"];
const process = [["01", "Gửi thông tin", "Cung cấp loại vật liệu, độ dày, kích thước, số lượng và file hoặc bản phác thảo nếu có."], ["02", "Xác nhận quy cách", "Hai bên kiểm tra lại kích thước, chi tiết gia công và các yêu cầu cần làm rõ trước khi chạy máy."], ["03", "Tiến hành gia công", "Tùng Phát thực hiện các hạng mục CNC đã thống nhất trên vật liệu được xác nhận."], ["04", "Kiểm tra chi tiết", "Thành phẩm được đối chiếu theo thông tin đã chốt trước khi bàn giao theo thỏa thuận."]] as const;
const exchange = [
  { icon: Upload, title: "Khách gửi", text: "File hoặc bản phác thảo, vật liệu, độ dày, kích thước, số lượng và đơn vị đo." },
  { icon: Settings2, title: "Tùng Phát xử lý", text: "Kiểm tra nội dung, làm rõ đường cắt, khoan, soi rãnh và mặt gia công trước khi chạy máy." },
  { icon: PackageCheck, title: "Khách nhận", text: "Chi tiết đã gia công theo nội dung được xác nhận và phương thức bàn giao đã trao đổi." }
];

export default function CncServicePage() {
  return (
    <>
      <JsonLd data={[breadcrumbSchema([{ name: "Trang chủ", path: "/" }, { name: "Gia công CNC", path: "/gia-cong-cnc" }]), serviceSchema]} />
      <SiteShell>
        <PageHero breadcrumbs={[{ label: "Trang chủ", href: "/" }, { label: "Gia công CNC" }]} eyebrow="Dịch vụ tại xưởng" title="Gia công CNC gỗ theo yêu cầu" description="Tùng Phát tiếp nhận kích thước, file kỹ thuật hoặc bản phác thảo để cắt, khoan, soi rãnh và gia công chi tiết ván gỗ. Vật liệu, độ dày, số lượng và nội dung file được xác nhận trước khi chạy máy; báo giá chỉ được lập sau bước kiểm tra thực tế." image={{ src: "/images/cnc-service.webp", alt: "Máy CNC đang gia công một tấm ván", priority: true }} actions={<><TrackedLink href={ZALO_URL} target="_blank" rel="noopener noreferrer" eventName="request_quote" eventProperties={{ location: "cnc_hero", channel: "zalo" }} className="pressable inline-flex min-h-14 items-center justify-center gap-2 bg-wood-500 px-6 text-sm font-extrabold text-white hover:bg-wood-600"><MessageCircle size={18} aria-hidden="true" />Gửi file qua Zalo</TrackedLink><TrackedLink href={PHONE_HREF} eventName="click_phone" eventProperties={{ location: "cnc_hero" }} className="pressable inline-flex min-h-14 items-center justify-center gap-2 border border-forest-900/20 bg-white px-6 text-sm font-extrabold text-forest-950"><Phone size={18} aria-hidden="true" />Gọi {PHONE_DISPLAY}</TrackedLink></>} />

        <section className="section-space bg-white">
          <div className="container-shell"><SectionHeader eyebrow="Trao đổi rõ đầu vào - đầu ra" title="Từ file gửi đến chi tiết nhận lại" description="Ba nhóm thông tin dưới đây giúp hai bên thống nhất phạm vi công việc trước khi báo giá và xếp lịch gia công." /><div className="mt-9 grid gap-5 lg:grid-cols-3">{exchange.map(({ icon: Icon, title, text }) => <article key={title} className="border border-forest-900/10 bg-[#f7f8f5] p-7"><span className="grid h-12 w-12 place-items-center bg-white text-forest-900 shadow-sm"><Icon size={23} aria-hidden="true" /></span><h2 className="mt-5 text-xl font-extrabold text-forest-950">{title}</h2><p className="mt-3 text-sm leading-7 text-slate-700">{text}</p></article>)}</div></div>
        </section>

        <section className="section-space bg-[#f7f8f5]">
          <div className="container-shell grid gap-10 lg:grid-cols-[.88fr_1.12fr] lg:items-center"><div className="relative aspect-[4/3] overflow-hidden border border-forest-900/10 bg-white"><Image src="/images/cnc-service.webp" alt="Đầu máy CNC cắt đường biên trên tấm ván" fill sizes="(max-width: 1024px) 100vw, 45vw" className="object-cover" /></div><div><SectionHeader eyebrow="Hạng mục gia công" title="Thông tin cần rõ trước khi chạy máy" description="Mỗi yêu cầu có quy cách khác nhau. Tùng Phát chỉ thực hiện các hạng mục đã được làm rõ theo file hoặc bản phác thảo." /><ul className="mt-7 grid gap-3 sm:grid-cols-2">{capabilities.map((item) => <li key={item} className="flex min-h-24 items-start gap-3 border border-forest-900/10 bg-white p-5 text-sm font-bold leading-6 text-forest-950"><Check className="mt-0.5 shrink-0 text-wood-600" size={18} aria-hidden="true" />{item}</li>)}</ul></div></div>
        </section>

        <section className="section-space bg-white">
          <div className="container-shell"><SectionHeader eyebrow="Quy trình báo giá" title="Từ yêu cầu đến chi tiết gia công" description="Quy trình không gắn thời gian cố định vì mỗi file, vật liệu và số lượng cần được kiểm tra riêng." /><div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">{process.map(([number, title, description]) => <article key={number} className="border border-forest-900/10 bg-[#fbfaf6] p-6"><span className="text-sm font-extrabold text-wood-600">{number}</span><h3 className="mt-5 text-lg font-extrabold text-forest-950">{title}</h3><p className="mt-3 text-sm leading-7 text-slate-700">{description}</p></article>)}</div><div className="mt-8 flex flex-col gap-5 border border-forest-900/10 bg-[#edf4ef] p-7 sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-4"><FileCheck2 size={25} className="mt-1 shrink-0 text-forest-900" aria-hidden="true" /><div><h2 className="text-xl font-extrabold text-forest-950">File nên kèm thông tin đối chiếu</h2><p className="mt-2 max-w-2xl text-sm leading-7 text-slate-700">Gửi thêm ảnh hoặc PDF thể hiện kích thước, đơn vị đo và mặt gia công để hạn chế hiểu khác nội dung file.</p></div></div><Link href="/cat-cnc-go" className="pressable inline-flex min-h-12 shrink-0 items-center gap-2 text-sm font-extrabold text-wood-600">Xem hướng dẫn gửi yêu cầu <ArrowRight size={17} aria-hidden="true" /></Link></div></div>
        </section>
        <ContactCTA eyebrow="Gửi file - kiểm tra quy cách" title="Chuẩn bị file CNC và thông tin vật liệu?" description="Gửi file qua Zalo cùng vật liệu, độ dày, số lượng, đơn vị đo và yêu cầu gia công. Website không tải file trực tiếp và Tùng Phát không công bố cam kết kỹ thuật khi chưa kiểm tra file." zaloLabel="Gửi file qua Zalo" />
      </SiteShell>
    </>
  );
}
