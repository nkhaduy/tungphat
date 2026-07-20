"use client";

import Image from "next/image";
import { Check } from "lucide-react";
import { SectionTitle } from "@/components/SectionTitle";
import { useLang } from "@/lib/i18n-context";
import { translations } from "@/lib/i18n";

const gallery = [
  ["hero-workshop4.png", 0],
  ["hero-workshop5.png", 1],
  ["hero-workshop6.png", 2],
  ["hero-workshop1.png", 3],
  ["cnc-service.png", 4],
  ["wood-panels.png", 5],
] as const;

function allowedProcessVideo(value: string) {
  if (value.startsWith("/")) return value;
  try {
    const url = new URL(value);
    if (url.origin === "https://media.mdftungphat.com") return value;
    if (url.origin === "https://cms.mdftungphat.com" && url.pathname.startsWith("/media/videos/")) return value;
    return "";
  } catch {
    return "";
  }
}

export function WorkshopMedia() {
  const { lang } = useLang();
  const t = translations[lang];
  const processVideoUrl = allowedProcessVideo(process.env.NEXT_PUBLIC_PROCESS_VIDEO_URL?.trim() || "");

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
              <div className="relative mx-auto aspect-[9/16] w-full max-w-[340px] overflow-hidden rounded-lg bg-forest-950 shadow-sm md:mx-0 md:max-w-[360px]">
                {processVideoUrl ? (
                  <video controls playsInline preload="none" poster="/images/cnc-service.png" className="h-full w-full object-cover" aria-label="Video minh họa quy trình gia công CNC">
                    <source src={processVideoUrl} type="video/mp4" />
                    Trình duyệt của bạn không hỗ trợ phát video.
                  </video>
                ) : (
                  <>
                    <Image src="/images/cnc-service.png" alt="Máy CNC tại khu vực gia công Tùng Phát" fill sizes="360px" quality={95} className="object-cover" />
                    <p className="absolute inset-x-4 bottom-4 bg-forest-950/80 px-4 py-3 text-center text-xs font-semibold text-white">
                      Video quy trình sẽ được bổ sung sau khi có file web dưới 25 MiB hoặc URL media đã xác minh.
                    </p>
                  </>
                )}
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
