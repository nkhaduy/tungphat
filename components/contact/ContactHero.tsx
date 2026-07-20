"use client";

import Image from "next/image";
import Link from "next/link";
import { MapPin, MessageCircle } from "lucide-react";
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
  zaloUrl: string;
};

export function ContactHero({ description, zaloUrl }: ContactHeroProps) {
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    const image = heroImages[secureRandomIndex(heroImages.length)];
    setActiveImage(
      window.matchMedia("(max-width: 767px)").matches
        ? image.mobile
        : image.desktop,
    );
  }, []);

  return (
    <section className="relative isolate min-h-[100svh] overflow-hidden bg-forest-950 pb-14 pt-[132px] text-white sm:pb-16 sm:pt-[140px] lg:pb-20 lg:pt-[148px]">
      {activeImage ? (
        <Image
          src={activeImage}
          alt=""
          fill
          sizes="100vw"
          priority
          fetchPriority="high"
          className={`-z-20 object-cover transition-opacity duration-500 ${
            imageLoaded ? "opacity-100" : "opacity-0"
          }`}
          onLoad={() => setImageLoaded(true)}
        />
      ) : null}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(6,43,29,.74)_0%,rgba(6,43,29,.52)_55%,rgba(6,43,29,.26)_100%)] sm:bg-[linear-gradient(90deg,rgba(6,43,29,.78)_0%,rgba(6,43,29,.58)_52%,rgba(6,43,29,.28)_100%)]" />

      <div className="container-shell">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 text-sm text-white/80"
        >
          <Link
            href="/"
            className="min-h-11 content-center transition-colors hover:text-white"
          >
            Trang chủ
          </Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page" className="font-bold text-white">
            Liên hệ
          </span>
        </nav>

        <div className="mt-7 max-w-[760px]">
          <h1 className="text-balance text-[clamp(2.35rem,6vw,4.25rem)] font-extrabold leading-[1.08] tracking-[-.025em]">
            Liên hệ <span className="text-wood-500">Tùng Phát</span>
          </h1>
          <p className="mt-5 max-w-[68ch] text-pretty text-base font-medium leading-7 text-white/90 sm:text-[1.0625rem] sm:leading-8">
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
              href="#branch-locations"
              className="inline-flex min-h-[52px] items-center justify-center gap-2 border border-white/45 bg-white/[0.08] px-6 text-[.8125rem] font-bold text-white transition-colors hover:border-white hover:bg-white hover:text-forest-950 sm:text-sm"
            >
              <MapPin size={18} aria-hidden="true" />
              Hệ thống chi nhánh Tùng Phát
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
