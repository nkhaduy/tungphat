import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { JsonLd } from "@/components/JsonLd";
import { SiteShell } from "@/components/site/SiteShell";
import { ContactCTA } from "@/components/ui/ContactCTA";
import { PageHero } from "@/components/ui/PageHero";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { getProjects } from "@/lib/content";
import { mediaUrl } from "@/lib/media";
import { breadcrumbSchema, createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({ title: "Hình ảnh xưởng và dự án CNC thực tế", description: "Hình ảnh máy CNC, kho và hai chi nhánh Tùng Phát; case study chỉ xuất hiện sau khi thông tin và quyền công bố được kiểm tra.", path: "/du-an" });
const workshopImages = [{ src: "/images/cnc-service.webp", alt: "Máy CNC tại Tùng Phát đang gia công một tấm ván", caption: "Máy CNC đang gia công" }, { src: "/images/contact/chi-nhanh-1.webp", alt: "Mặt tiền cửa hàng Tùng Phát tại 14 Tam Bình", caption: "Mặt tiền chi nhánh 1" }, { src: "/images/contact/chi-nhanh-2.webp", alt: "Mặt tiền chi nhánh Tùng Phát tại 81B Tam Bình", caption: "Mặt tiền chi nhánh 2" }];

export default function ProjectsPage() {
  const projects = getProjects();
  return <><JsonLd data={breadcrumbSchema([{ name: "Trang chủ", path: "/" }, { name: "Xưởng thực tế", path: "/du-an" }])} /><SiteShell><PageHero compact breadcrumbs={[{ label: "Trang chủ", href: "/" }, { label: "Xưởng thực tế" }]} eyebrow="Tư liệu đã có" title="Hình ảnh thực tế tại kho và xưởng" description="Repo hiện chưa có case study khách hàng đủ dữ liệu để công bố. Trang này chỉ hiển thị máy CNC và mặt tiền hai chi nhánh có ảnh xác minh; không đặt tên dự án hoặc khách hàng giả." /><section className="section-space bg-[#f7f8f5]"><div className="container-shell"><SectionHeader eyebrow="Kho, xưởng và chi nhánh" title="Tư liệu thực tế Tùng Phát" description="Grid dùng tỷ lệ ảnh cố định để tránh layout shift. Caption chỉ mô tả đúng nội dung có thể quan sát trong ảnh." /><div className="mt-9 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{workshopImages.map((item) => <figure key={item.src} className="overflow-hidden border border-forest-900/10 bg-white shadow-sm"><div className="relative aspect-[4/3]"><Image src={item.src} alt={item.alt} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" /></div><figcaption className="p-4 text-sm font-bold text-forest-950">{item.caption}</figcaption></figure>)}</div>{projects.length ? <div className="mt-14"><SectionHeader eyebrow="Case study đã duyệt" title="Dự án được phép công bố" /><div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{projects.map((project) => <article key={project.slug} className="border border-forest-900/10 bg-white"><Link href={`/du-an/${project.slug}`} className="relative block aspect-[4/3]"><Image src={mediaUrl(project.featuredImage)} alt={project.featuredImageAlt} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" /></Link><div className="p-6"><h2 className="text-xl font-extrabold text-forest-950">{project.title}</h2><p className="mt-3 text-sm text-slate-700">{project.materialType} · {project.thickness}</p><Link href={`/du-an/${project.slug}`} className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-extrabold text-wood-600">Xem dự án <ArrowRight size={16} aria-hidden="true" /></Link></div></article>)}</div></div> : null}</div></section><ContactCTA title="Cần trao đổi một chi tiết CNC tương tự?" description="Gửi file, vật liệu, độ dày, số lượng và yêu cầu gia công để Tùng Phát kiểm tra nội dung thực tế." zaloLabel="Gửi file qua Zalo" /></SiteShell></>;
}
