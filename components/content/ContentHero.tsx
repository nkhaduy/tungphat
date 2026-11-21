import Image from "next/image";
import { Breadcrumbs, type Breadcrumb } from "@/components/ui/Breadcrumbs";

type Props = { title: string; breadcrumbs: Breadcrumb[]; image?: { src: string; alt: string }; publishedAt?: string };

/** A shared reading header: the actual media belongs to the current page. */
export function ContentHero({ title, breadcrumbs, image, publishedAt }: Props) {
  const validDate = publishedAt && /^\d{4}-\d{2}-\d{2}/u.test(publishedAt) ? publishedAt.slice(0, 10) : undefined;
  const displayDate = validDate ? validDate.split("-").reverse().join("/") : undefined;
  return <section className="relative isolate overflow-hidden bg-forest-950 text-white">
    {image?.src ? <Image src={image.src} alt={image.alt} fill priority sizes="100vw" className="-z-20 object-cover" /> : null}
    <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-r from-[#071e15]/95 via-[#071e15]/80 to-[#071e15]/60" />
    <div className="container-shell flex min-h-[19rem] flex-col justify-end pb-12 pt-[calc(var(--site-header-height)+2rem)] sm:min-h-[23rem] lg:min-h-[27rem] lg:pb-16">
      <Breadcrumbs items={breadcrumbs} tone="onDark" />
      <h1 className="mt-5 max-w-5xl text-balance font-display text-[clamp(2.15rem,5vw,4.5rem)] font-extrabold leading-[1.08] tracking-[-.035em]">{title}</h1>
      {displayDate ? <p className="mt-5 text-sm font-medium text-white/90">Ngày đăng <time dateTime={validDate}>{displayDate}</time></p> : null}
    </div>
  </section>;
}
