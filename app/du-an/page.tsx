import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { JsonLd } from "@/components/JsonLd";
import { LocalIntentLinks } from "@/components/content/LocalIntentLinks";
import { SiteShell } from "@/components/site/SiteShell";
import { ContactCTA } from "@/components/ui/ContactCTA";
import { PageHero } from "@/components/ui/PageHero";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { getProjects } from "@/lib/content";
import { resolveMediaUrl } from "@/lib/media";
import { breadcrumbSchema, createPageMetadata, webPageSchema } from "@/lib/seo";
import { workshopImages } from "@/lib/workshop-images";

const projectsTitle = "Xưởng, máy CNC và chi nhánh Tùng Phát tại Thủ Đức";
const projectsDescription = "Xem tư liệu máy CNC tham khảo và ảnh mặt tiền hai chi nhánh Tùng Phát trên đường Tam Bình, Thủ Đức, TP.HCM.";

export default async function ProjectsPage() {
  const projects = await getProjects();
  return (
    <>
      <JsonLd data={[webPageSchema({ path: "/du-an", name: projectsTitle, description: projectsDescription, type: "CollectionPage" }), breadcrumbSchema([{ name: "Trang chủ", path: "/" }, { name: "Xưởng thực tế", path: "/du-an" }])]} />
      <SiteShell>
        <PageHero compact breadcrumbs={[{ label: "Trang chủ", href: "/" }, { label: "Xưởng thực tế" }]} eyebrow="Tư liệu đã có" title={projectsTitle} description="Trang này hiển thị máy CNC tham khảo và mặt tiền hai chi nhánh có ảnh xác minh. Case study khách hàng chỉ xuất hiện khi có đủ dữ liệu kỹ thuật và quyền công bố." />
        <section data-answer-block className="border-b border-forest-900/10 bg-[#edf4ef] py-8" aria-labelledby="projects-answer-title">
          <div className="container-shell max-w-4xl">
            <p className="text-xs font-extrabold uppercase tracking-[.15em] text-wood-600">Trả lời nhanh</p>
            <h2 id="projects-answer-title" className="mt-2 text-2xl font-extrabold text-forest-950">Trang này có thể xác minh điều gì?</h2>
            <p className="mt-3 text-base leading-8 text-slate-700">Bạn có thể nhận diện ảnh máy CNC tham khảo và mặt tiền hai chi nhánh tại Tam Bình, Thủ Đức. Thông tin dự án, khách hàng và thông số gia công chỉ được thêm khi có dữ liệu được phép công bố.</p>
          </div>
        </section>
        <section className="section-space bg-[#f7f8f5]">
          <div className="container-shell">
            <SectionHeader eyebrow="Kho, xưởng và chi nhánh" title="Tư liệu thực tế Tùng Phát" description="Grid dùng tỷ lệ ảnh cố định để tránh layout shift. Caption chỉ mô tả đúng nội dung có thể quan sát trong ảnh." />
            <div className="mt-9 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {workshopImages.map((item) => <figure key={item.src} className="overflow-hidden border border-forest-900/10 bg-white shadow-sm"><div className="relative aspect-[4/3]"><Image src={item.src} alt={item.alt} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" /></div><figcaption className="p-4 text-sm font-bold text-forest-950">{item.caption}</figcaption></figure>)}
            </div>
            {projects.length ? <div className="mt-14"><SectionHeader eyebrow="Case study đã duyệt" title="Dự án được phép công bố" /><div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{projects.map((project) => <article key={project.slug} className="border border-forest-900/10 bg-white"><Link href={`/du-an/${project.slug}`} className="relative block aspect-[4/3]"><Image src={resolveMediaUrl(project.featuredImage)} alt={project.featuredImageAlt} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" /></Link><div className="p-6"><h2 className="text-xl font-extrabold text-forest-950">{project.title}</h2><p className="mt-3 text-sm text-slate-700">{project.materialType} · {project.thickness}</p><Link href={`/du-an/${project.slug}`} className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-extrabold text-wood-600">Xem dự án <ArrowRight size={16} aria-hidden="true" /></Link></div></article>)}</div></div> : null}
          </div>
        </section>
        <LocalIntentLinks currentSlug="gia-cong-cnc" />
        <ContactCTA title="Cần trao đổi một chi tiết CNC tương tự?" description="Gửi file, vật liệu, độ dày, số lượng và yêu cầu gia công để Tùng Phát kiểm tra nội dung thực tế." zaloLabel="Gửi file qua Zalo" />
      </SiteShell>
    </>
  );
}

export async function generateMetadata() {
  return createPageMetadata({ title: projectsTitle, description: projectsDescription, path: "/du-an" });
}
