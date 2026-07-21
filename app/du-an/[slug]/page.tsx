import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProjectLanding } from "@/components/content/ProjectLanding";
import { getProject, getProjects } from "@/lib/content";
import { createContentMetadata } from "@/lib/content-metadata";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  const params = getProjects().map((project) => ({ slug: project.slug }));
  return params.length ? params : [{ slug: "__empty-collection" }];
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
  return <ProjectLanding project={project} />;
}
