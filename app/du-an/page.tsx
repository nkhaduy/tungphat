import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { JsonLd } from "@/components/JsonLd";
import { getProjects } from "@/lib/content";
import { mediaUrl } from "@/lib/media";
import { breadcrumbSchema, createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({ title: "Dự án gia công CNC thực tế", description: "Các dự án CNC được Tùng Phát kiểm tra thông tin, hình ảnh và quyền công bố trước khi đăng lên website.", path: "/du-an" });
export default function ProjectsPage() { const projects = getProjects(); return <><JsonLd data={breadcrumbSchema([{ name: "Trang chủ", path: "/" }, { name: "Dự án", path: "/du-an" }])} /><Header /><main className="min-h-[70vh] bg-[#f6f7f5] pt-[72px]"><section className="bg-forest-950 py-16 text-white lg:py-20"><div className="container-shell"><h1 className="text-4xl font-extrabold sm:text-5xl">Dự án CNC thực tế</h1><p className="mt-5 max-w-3xl leading-8 text-white/80">Không dùng dự án mẫu hoặc ảnh không xác minh. Chỉ case study đã được người phụ trách duyệt mới xuất hiện tại đây.</p></div></section><section className="py-16 lg:py-24"><div className="container-shell">{projects.length === 0 ? <div className="bg-white p-8"><h2 className="text-xl font-extrabold text-forest-950">Chưa có dự án được publish</h2><p className="mt-3 text-slate-600">CMS đã có mẫu nhập liệu ở trạng thái draft để đội ngũ bổ sung ảnh và dữ liệu thật.</p></div> : <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{projects.map((project) => <article key={project.slug} className="bg-white"><Link href={`/du-an/${project.slug}`} className="relative block aspect-[4/3]"><Image src={mediaUrl(project.featuredImage)} alt={project.featuredImageAlt} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" /></Link><div className="p-6"><h2 className="text-xl font-extrabold text-forest-950">{project.title}</h2><p className="mt-3 text-sm text-slate-600">{project.materialType} · {project.thickness}</p><Link href={`/du-an/${project.slug}`} className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-bold">Xem dự án<ArrowRight size={16} /></Link></div></article>)}</div>}</div></section></main><Footer /></>; }
