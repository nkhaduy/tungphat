import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, MessageCircle } from "lucide-react";
import { JsonLd } from "@/components/JsonLd";
import { TrackedLink } from "@/components/TrackedLink";
import { ViewTracker } from "@/components/ViewTracker";
import { MarkdownContent } from "@/components/content/MarkdownContent";
import { SiteShell } from "@/components/site/SiteShell";
import { ContactCTA } from "@/components/ui/ContactCTA";
import { PageHero } from "@/components/ui/PageHero";
import { SectionHeader } from "@/components/ui/SectionHeader";
import type { ContentEntry } from "@/lib/content";
import type { ProjectFrontmatter } from "@/lib/content-schema";
import { absoluteMediaUrl, mediaUrl } from "@/lib/media";
import { SITE_URL, ZALO_URL, breadcrumbSchema } from "@/lib/seo";

type ProjectGalleryProps = { title: string; images: string[]; projectTitle: string };

function ProjectGallery({ title, images, projectTitle }: ProjectGalleryProps) {
  if (!images.length) return null;
  return (
    <section className="section-space bg-white">
      <div className="container-shell">
        <SectionHeader eyebrow="Hình ảnh thực tế" title={title} />
        <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((src, index) => (
            <figure key={`${src}-${index}`} className="overflow-hidden border border-forest-900/10 bg-[#f7f8f5] shadow-sm">
              <div className="relative aspect-[4/3]"><Image src={mediaUrl(src)} alt={`${title} của ${projectTitle}, ảnh ${index + 1}`} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover" /></div>
              <figcaption className="p-4 text-sm font-bold text-forest-950">Ảnh {index + 1} · {title}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ProjectLanding({ project }: { project: ContentEntry<ProjectFrontmatter> }) {
  const projectSchema = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: project.title,
    description: project.customerRequirement,
    image: absoluteMediaUrl(project.featuredImage, SITE_URL),
    dateCreated: project.completedAt,
    datePublished: project.publishedAt,
    dateModified: project.updatedAt,
    about: [project.materialType, project.processingType],
    locationCreated: project.area || undefined,
    url: `${SITE_URL}/du-an/${project.slug}`,
  };
  const facts = [["Vật liệu", project.materialType], ["Gia công", project.processingType], ["Độ dày", project.thickness], ["Khu vực", project.area || "Không công bố"]] as const;

  return (
    <>
      <JsonLd data={[breadcrumbSchema([{ name: "Trang chủ", path: "/" }, { name: "Dự án", path: "/du-an" }, { name: project.title, path: `/du-an/${project.slug}` }]), projectSchema]} />
      <SiteShell>
        <ViewTracker event="view_project" contentType={project.slug} />
        <article>
          <PageHero
            breadcrumbs={[{ label: "Trang chủ", href: "/" }, { label: "Xưởng thực tế", href: "/du-an" }, { label: project.title }]}
            eyebrow={`Dự án CNC · ${project.completedAt}`}
            title={project.title}
            description={`${project.materialType} · ${project.processingType}`}
            image={{ src: mediaUrl(project.featuredImage), alt: project.featuredImageAlt, priority: true }}
            actions={
              <>
                <TrackedLink href={ZALO_URL} target="_blank" rel="noopener noreferrer" eventName="click_zalo" eventProperties={{ location: `${project.slug}_hero` }} className="pressable inline-flex min-h-14 items-center justify-center gap-2 bg-wood-500 px-6 text-sm font-extrabold text-white hover:bg-wood-600"><MessageCircle size={18} aria-hidden="true" />{project.quoteCta}</TrackedLink>
                <Link href="/gia-cong-cnc" className="pressable inline-flex min-h-14 items-center justify-center gap-2 border border-forest-900/20 bg-white px-6 text-sm font-extrabold text-forest-950 hover:border-forest-900">Xem dịch vụ CNC <ArrowRight size={17} aria-hidden="true" /></Link>
              </>
            }
          />

          <section className="section-space bg-white">
            <div className="container-shell grid gap-10 lg:grid-cols-[.72fr_1.28fr] lg:gap-14">
              <div>
                <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                  {facts.map(([label, value]) => <div key={label} className="border border-forest-900/10 bg-[#f7f8f5] p-5"><dt className="text-xs font-extrabold uppercase tracking-[.14em] text-wood-600">{label}</dt><dd className="mt-2 font-bold leading-6 text-forest-950">{value}</dd></div>)}
                </dl>
              </div>
              <div className="min-w-0">
                <SectionHeader eyebrow="Phạm vi thực hiện" title="Yêu cầu, công việc và kết quả" />
                <div className="mt-8 grid gap-5 sm:grid-cols-2">
                  <section className="border-l-4 border-wood-500 bg-[#fbfaf6] p-6"><h2 className="text-lg font-extrabold text-forest-950">Yêu cầu</h2><p className="mt-3 text-sm leading-7 text-slate-700">{project.customerRequirement}</p></section>
                  <section className="border-l-4 border-forest-700 bg-[#edf4ef] p-6"><h2 className="text-lg font-extrabold text-forest-950">Kết quả</h2><p className="mt-3 text-sm leading-7 text-slate-700">{project.result}</p></section>
                </div>
                <div className="mt-8 grid gap-8 sm:grid-cols-2">
                  <div><h2 className="text-xl font-extrabold text-forest-950">Hạng mục gia công</h2><ul className="mt-4 space-y-3">{project.workItems.map((item) => <li key={item} className="flex gap-3 text-sm leading-7 text-slate-700"><Check size={17} className="mt-1 shrink-0 text-wood-600" aria-hidden="true" />{item}</li>)}</ul></div>
                  <div><h2 className="text-xl font-extrabold text-forest-950">Quy trình thực hiện</h2><ol className="mt-4 space-y-4">{project.process.map((step, index) => <li key={step} className="flex gap-3 text-sm leading-7 text-slate-700"><strong className="shrink-0 text-wood-600">{String(index + 1).padStart(2, "0")}</strong>{step}</li>)}</ol></div>
                </div>
              </div>
            </div>
          </section>

          {project.body ? <section className="section-space bg-[#f7f8f5]"><div className="container-shell mx-auto max-w-[76ch]"><MarkdownContent className="prose-lg">{project.body}</MarkdownContent></div></section> : null}
          <ProjectGallery title="Trước khi gia công" images={project.beforeImages} projectTitle={project.title} />
          <ProjectGallery title="Sau khi gia công" images={project.afterImages} projectTitle={project.title} />
          <ProjectGallery title="Hình ảnh bổ sung" images={project.gallery} projectTitle={project.title} />
        </article>
        <ContactCTA eyebrow="Gửi yêu cầu gia công" title="Cần trao đổi một chi tiết tương tự?" description="Gửi file, loại vật liệu, độ dày, số lượng và hình ảnh đối chiếu để Tùng Phát kiểm tra phạm vi thực hiện." zaloLabel="Gửi file qua Zalo" />
      </SiteShell>
    </>
  );
}
