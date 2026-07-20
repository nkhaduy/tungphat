"use client";

import Image from "next/image";
import Link from "next/link";
import { Mail, MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { TrackedLink } from "@/components/TrackedLink";
import { secureRandomIndex } from "@/lib/random";

const heroImages = [
  {
    desktop: "/images/hero-workshop.webp",
    mobile: "/images/hero-workshop-mobile.webp",
  },
  {
    desktop: "/images/hero-workshop1.webp",
    mobile: "/images/hero-workshop1-mobile.webp",
  },
  {
    desktop: "/images/hero-workshop2.webp",
    mobile: "/images/hero-workshop2-mobile.webp",
  },
  {
    desktop: "/images/hero-workshop4.webp",
    mobile: "/images/hero-workshop4-mobile.webp",
  },
  {
    desktop: "/images/hero-workshop5.webp",
    mobile: "/images/hero-workshop5-mobile.webp",
  },
  {
    desktop: "/images/hero-workshop6.webp",
    mobile: "/images/hero-workshop6-mobile.webp",
  },
] as const;

type ContactHeroProps = {
  description: string;
  email: string;
  zaloUrl: string;
};

export function ContactHero({ description, email, zaloUrl }: ContactHeroProps) {
  const [activeImage, setActiveImage] = useState<number | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    setActiveImage(secureRandomIndex(heroImages.length));
  }, []);

  const image = activeImage === null ? null : heroImages[activeImage];

  return (
    <section className="relative isolate overflow-hidden bg-forest-950 py-14 text-white sm:py-16 lg:py-20">
      {image ? (
        <picture
          className={`absolute inset-0 -z-20 block transition-opacity duration-500 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
        >
          <source media="(max-width: 767px)" srcSet={image.mobile} />
          <Image
            src={image.desktop}
            alt=""
            fill
            sizes="100vw"
            priority
            fetchPriority="high"
            className="object-cover"
            onLoad={() => setImageLoaded(true)}
          />
        </picture>
      ) : null}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(6,43,29,.97)_0%,rgba(6,43,29,.91)_52%,rgba(6,43,29,.76)_100%)]" />

      <div className="container-shell">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 text-sm text-white/72"
        >
          <Link
            href="/"
            className="min-h-11 content-center transition-colors hover:text-white"
          >
            Trang chủ
          </Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page" className="text-white">
            Liên hệ
          </span>
        </nav>

        <div className="mt-7 max-w-[760px]">
          <p className="flex items-center gap-3 text-xs font-bold uppercase tracking-[.14em] text-wood-500">
            <span className="h-0.5 w-9 bg-wood-500" aria-hidden="true" />
            Tùng Phát
          </p>
          <h1 className="mt-5 text-balance text-[clamp(2.35rem,6vw,4.25rem)] font-extrabold leading-[1.08] tracking-[-.025em]">
            Liên hệ Tùng Phát
          </h1>
          <p className="mt-5 max-w-[58ch] text-pretty text-base font-medium leading-8 text-white/86 sm:text-[1.0625rem]">
            {description}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <TrackedLink
              href={zaloUrl}
              target="_blank"
              rel="noopener noreferrer"
              eventName="click_zalo"
              eventProperties={{ location: "contact_hero" }}
              className="inline-flex min-h-[52px] items-center justify-center gap-2 bg-wood-500 px-6 text-sm font-bold text-white transition-colors hover:bg-wood-600"
            >
              <MessageCircle size={18} aria-hidden="true" />
              Liên hệ Zalo
            </TrackedLink>
            <a
              href={`mailto:${email}`}
              className="inline-flex min-h-[52px] items-center justify-center gap-2 border border-white/45 bg-white/[0.08] px-6 text-[.8125rem] font-bold text-white transition-colors hover:border-white hover:bg-white hover:text-forest-950 sm:text-sm"
            >
              <Mail size={18} aria-hidden="true" />
              Gửi email: {email}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
