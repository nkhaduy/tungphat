import Image from "next/image";
import { Breadcrumbs, type Breadcrumb } from "@/components/ui/Breadcrumbs";
import { PageContainer } from "@/components/ui/PageContainer";

type PageHeroProps = {
  breadcrumbs: Breadcrumb[];
  eyebrow: string;
  title: string;
  description: string;
  image?: { src: string; alt: string; priority?: boolean; fit?: "cover" | "contain" };
  actions?: React.ReactNode;
  compact?: boolean;
};

export function PageHero({ breadcrumbs, eyebrow, title, description, image, actions, compact = false }: PageHeroProps) {
  return (
    <section className="relative overflow-hidden border-b border-forest-900/10 bg-[#f7f8f5]">
      <div className="page-hero-pattern pointer-events-none absolute inset-y-0 right-0 w-1/2 opacity-35" aria-hidden="true" />
      <PageContainer className={`relative grid items-center gap-8 ${compact ? "py-10 lg:py-12" : "py-12 sm:py-14 lg:grid-cols-[1.05fr_.75fr] lg:py-16"}`}>
        <div>
          <Breadcrumbs items={breadcrumbs} />
          <p className="eyebrow mt-7">{eyebrow}</p>
          <h1 className="mt-4 max-w-4xl text-balance text-[clamp(2.15rem,5vw,4.25rem)] font-extrabold leading-[1.05] tracking-[-.035em] text-forest-950">{title}</h1>
          <p className="mt-5 max-w-3xl text-pretty text-base leading-7 text-slate-700 sm:text-lg sm:leading-8">{description}</p>
          {actions ? <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">{actions}</div> : null}
        </div>
        {image ? (
          <div className="relative aspect-[4/3] overflow-hidden border border-forest-900/10 bg-white shadow-card">
            <Image src={image.src} alt={image.alt} fill priority={image.priority} sizes="(max-width: 1024px) 100vw, 42vw" className={image.fit === "contain" ? "object-contain p-8 sm:p-10" : "object-cover"} />
          </div>
        ) : null}
      </PageContainer>
    </section>
  );
}
