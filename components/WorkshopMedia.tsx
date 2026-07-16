"use client";

import Image from "next/image";
import { Check } from "lucide-react";
import { SectionTitle } from "@/components/SectionTitle";
import { useLang } from "@/lib/i18n-context";
import { translations } from "@/lib/i18n";
import { mediaUrl } from "@/lib/media";

const gallery = [
  ["hero-workshop4.webp", 0],
  ["hero-workshop5.webp", 1],
  ["hero-workshop6.webp", 2],
  ["hero-workshop1.webp", 3],
  ["cnc-service.webp", 4],
  ["wood-panels.webp", 5],
] as const;

export function WorkshopMedia() {
  const { lang } = useLang();
  const t = translations[lang];
  const mediaBaseUrl = process.env.NEXT_PUBLIC_MEDIA_BASE_URL;
  const processVideoUrl = mediaBaseUrl ? mediaUrl({ key: "videos/legacy/0619.mp4" }, mediaBaseUrl) : null;

  return (
    <section id="thu-vien" className="bg-white py-20 lg:py-28">
      <div className="container-shell">
        <SectionTitle eyebrow={t.workshopEyebrow} title={t.workshopTitle} description={t.workshopDescription} />

        <div className="mt-10 lg:mt-12">
          <div className="grid auto-rows-[220px] gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {gallery.map(([src, labelIndex], index) => {
              const label = t.workshopGalleryLabels[labelIndex];
              return (
                <figure key={src} className={`group relative overflow-hidden ${index === 0 || index === 4 ? "sm:row-span-2" : ""}`}>
                  <Image src={`/images/${src}`} alt={label} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" quality={95} className="object-cover transition duration-500 ease-out group-hover:scale-[1.025]" />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-forest-950/72 to-transparent" aria-hidden="true" />
                  <figcaption className="absolute bottom-3 left-3 right-3 w-fit max-w-[calc(100%-1.5rem)] rounded bg-forest-950/58 px-3 py-2 text-xs font-bold leading-snug text-white shadow-sm backdrop-blur-[6px] sm:text-sm">
                    {label}
                  </figcaption>
                </figure>
              );
            })}
          </div>

          <div className="mt-16 border-t border-forest-900/10 pt-12 sm:mt-20 sm:pt-16">
            <div className="grid items-center gap-10 md:grid-cols-[minmax(280px,40%)_1fr] md:gap-12 lg:gap-16">
              <div className="mx-auto w-full max-w-[340px] overflow-hidden rounded-lg shadow-sm md:mx-0 md:max-w-[360px]">
                <video controls playsInline preload="none" poster="/images/cnc-service.webp" className="aspect-[9/16] max-h-[620px] w-full object-cover" aria-label="Video minh họa quy trình gia công CNC">
                  {processVideoUrl ? <source src={processVideoUrl} type="video/mp4" /> : null}
                  Trình duyệt của bạn không hỗ trợ phát video.
                </video>
              </div>
              <div className="max-w-2xl">
                <span className="eyebrow">{t.workshopProcessEyebrow}</span>
                <h3 className="text-balance mt-5 text-3xl font-extrabold leading-tight text-forest-950 sm:text-4xl">{t.workshopProcessTitle}</h3>
                <p className="text-pretty mt-6 text-base leading-8 text-slate-600">{t.workshopProcessDescription}</p>
                <ul className="mt-8 space-y-3">
                  {t.workshopSteps.map((step: string) => <li key={step} className="flex min-h-12 items-center gap-3 border-b border-forest-900/15 text-sm font-bold text-forest-950"><Check size={18} className="shrink-0 text-wood-600" aria-hidden="true" />{step}</li>)}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
