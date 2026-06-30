"use client";

import Image from "next/image";
import { Check } from "lucide-react";
import { useEffect, useRef } from "react";
import { SectionTitle } from "@/components/SectionTitle";
import { useLang } from "@/lib/i18n-context";
import { translations } from "@/lib/i18n";

const gallery = [
  ["hero-workshop4.png", "workshopGalleryLabels_0"],
  ["hero-workshop5.png", "workshopGalleryLabels_1"],
  ["hero-workshop6.png", "workshopGalleryLabels_2"],
  ["hero-workshop1.png", "workshopGalleryLabels_3"],
  ["cnc-service.png", "workshopGalleryLabels_4"],
  ["wood-panels.png", "workshopGalleryLabels_5"],
];

export function WorkshopMedia() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { lang } = useLang();
  const t = translations[lang];

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        video.muted = true;
        void video.play().catch(() => undefined);
      } else {
        video.pause();
      }
    }, { threshold: 0.35 });

    observer.observe(video);
    return () => {
      observer.disconnect();
      video.pause();
    };
  }, []);

  return (
    <section id="thu-vien" className="bg-white py-20 lg:py-28">
      <div className="container-shell">
        <SectionTitle eyebrow={t.workshopEyebrow} title={t.workshopTitle} description={t.workshopDescription} />

        <div className="mt-12">
          <p className="mb-5 text-sm font-bold text-slate-600">{t.workshopDisclaimer}</p>
          <div className="grid auto-rows-[220px] gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {gallery.map(([src], index) => {
              const labelKey = gallery[index][1] as keyof typeof t;
              const label = (t as any)[labelKey] || "";
              return (
                <figure key={src} className={`group relative overflow-hidden ${index === 0 || index === 4 ? "sm:row-span-2" : ""}`}>
                  <Image src={`/images/${src}`} alt={label} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" quality={95} className="object-cover" />
                  <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-forest-950/85 to-transparent p-5 pt-16 text-sm font-bold text-white">{label}</figcaption>
                </figure>
              );
            })}
          </div>

          <div className="mt-16 border-t border-forest-900/10 pt-12 sm:mt-20 sm:pt-16">
            <div className="grid items-center gap-10 md:grid-cols-[minmax(280px,40%)_1fr] md:gap-12 lg:gap-16">
              <div className="mx-auto w-full max-w-[340px] overflow-hidden rounded-lg shadow-sm md:mx-0 md:max-w-[360px]">
                <video ref={videoRef} autoPlay muted loop playsInline preload="metadata" className="aspect-[9/16] max-h-[620px] w-full object-cover" aria-label="Gia công thực tế tại xưởng Tùng Phát">
                  <source src="/0619.mp4" type="video/mp4" />
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