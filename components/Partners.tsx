"use client";

import Image from "next/image";
import Link from "next/link";
import { useLang } from "@/lib/i18n-context";
import { translations } from "@/lib/i18n";

const partners = [
  { slug: "thanh-thuy", name: "Thanh Thùy", logo: "/partners/thanh-thuy-logo.png", alt: "Logo Thanh Thùy", width: 473, height: 244, className: "max-h-[122px] max-w-[236px]" },
  { slug: "ba-thanh", name: "Ba Thanh", logo: "/partners/ba-thanh-logo.png", alt: "Logo Ba Thanh", width: 4009, height: 1557, className: "max-h-[108px] max-w-[278px]" },
  { slug: "an-cuong", name: "An Cường", logo: "/partners/an-cuong-logo.png", alt: "Logo An Cường", width: 500, height: 200, className: "max-h-[104px] max-w-[280px]" }
];

export function Partners() {
  const { lang } = useLang();
  const t = translations[lang];

  return (
    <section aria-labelledby="partners-title" className="border-b border-forest-900/10 bg-[#f6f7f5] py-14 sm:py-16 lg:py-20">
      <div className="container-shell">
        <div className="mx-auto max-w-3xl text-center">
          <h2 id="partners-title" className="text-balance font-display text-2xl font-bold leading-tight tracking-[-0.03em] text-forest-950 sm:text-3xl">
            {t.partnersTitle}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-sm leading-7 text-slate-600 sm:text-base">
            {t.partnersDescription}
          </p>
        </div>

        <ul className="mx-auto mt-9 grid max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2 lg:mt-11 lg:grid-cols-3">
          {partners.map((partner, index) => (
            <li key={partner.slug} className={index === 2 ? "sm:col-span-2 lg:col-span-1" : ""}>
              <Link href={`/catalogue/${partner.slug}`} className="group mx-auto flex h-[190px] w-full max-w-md items-center justify-center rounded-lg bg-white px-7 py-8 shadow-card transition duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_4px_16px_rgba(7,59,40,0.14)] sm:h-[210px]">
                <Image
                  src={partner.logo}
                  alt={partner.alt}
                  width={partner.width}
                  height={partner.height}
                  sizes="(max-width: 640px) calc(100vw - 80px), (max-width: 1024px) 40vw, 280px"
                  quality={95}
                  className={`h-auto w-auto object-contain ${partner.className}`}
                />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}