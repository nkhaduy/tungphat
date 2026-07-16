import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { JsonLd } from "@/components/JsonLd";
import { ViewTracker } from "@/components/ViewTracker";
import { MarkdownContent } from "@/components/content/MarkdownContent";
import { getProject, getProjects } from "@/lib/content";
import { createContentMetadata } from "@/lib/content-metadata";
import { mediaUrl } from "@/lib/media";
import { breadcrumbSchema } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  const params = getProjects().map((project) => ({ slug: project.slug }));
  return params.length ? params : [{ slug: "__no-published-projects" }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  return project ? createContentMetadata(project, `/du-an/${slug}`) : {};
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();
  return (
    <>
      <JsonLd data={breadcrumbSchema([{ name: "Trang chủ", path: "/" }, { name: "Dự án", path: "/du-an" }, { name: project.title, path: `/du-an/${project.slug}` }])} />
      <Header />
      <main className="bg-white pt-[72px]">
        <ViewTracker event="view_project" contentType={project.slug} />
        <article>
          <header className="bg-forest-950 py-14 text-white"><div className="container-shell"><p className="text-xs font-extrabold uppercase tracking-wider text-orange-300">Dự án CNC · {project.completedAt}</p><h1 className="mt-4 text-4xl font-extrabold sm:text-5xl">{project.title}</h1><p className="mt-5 text-white/75">{project.materialType} · {project.thickness}</p></div></header>
          <div className="container-shell py-12 lg:py-16"><div className="relative mb-12 aspect-[16/8] overflow-hidden"><Image src={mediaUrl(project.featuredImage)} alt={project.featuredImageAlt} fill priority sizes="100vw" className="object-cover" /></div><div className="grid gap-10 lg:grid-cols-[.7fr_1.3fr]"><div className="bg-[#f6f7f5] p-6"><h2 className="font-extrabold text-forest-950">Yêu cầu</h2><p className="mt-3 text-sm leading-7 text-slate-600">{project.customerRequirement}</p><h2 className="mt-7 font-extrabold text-forest-950">Kết quả</h2><p className="mt-3 text-sm leading-7 text-slate-600">{project.result}</p></div><MarkdownContent>{project.body}</MarkdownContent></div></div>
        </article>
      </main>
      <Footer />
    </>
  );
}
