import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Boxes,
  MapPinned,
  Ruler,
  Settings2,
} from "lucide-react";
import { TrackedLink } from "@/components/TrackedLink";
import { ZALO_URL } from "@/lib/seo";

const benefits = [
  {
    icon: Boxes,
    title: "Đa dạng vật liệu",
    text: "MDF, MFC, plywood, gỗ ghép và bề mặt",
  },
  {
    icon: Settings2,
    title: "Gia công CNC theo yêu cầu",
    text: "Cắt, khoan, soi rãnh và cắt biên dạng",
  },
  {
    icon: Ruler,
    title: "Tư vấn quy cách",
    text: "Đối chiếu vật liệu, độ dày và kích thước",
  },
  {
    icon: MapPinned,
    title: "Hai chi nhánh tại TP.HCM",
    text: "14 Tam Bình và 81B Tam Bình",
  },
] as const;

export function HomeHero() {
  return (
    <section
      id="trang-chu"
      className="home-hero relative isolate overflow-hidden border-b border-forest-900/10 bg-[#f1ede7]"
    >
      <div className="home-hero-image-layer absolute inset-0 z-0" aria-hidden="true">
        <picture>
          <source
            type="image/avif"
            srcSet="/images/material-panels-hero-960.avif 960w, /images/material-panels-hero-1440.avif 1440w, /images/material-panels-hero.avif 1916w"
            sizes="100vw"
          />
          <source
            type="image/webp"
            srcSet="/images/material-panels-hero-960.webp 960w, /images/material-panels-hero-1440.webp 1440w, /images/material-panels-hero.webp 1916w"
            sizes="100vw"
          />
          {/* Static export needs a native picture to serve format and width variants. */}
          <img
            src="/images/material-panels-hero.webp"
            alt=""
            width="1916"
            height="821"
            sizes="100vw"
            fetchPriority="high"
            loading="eager"
            decoding="async"
            className="material-panels-hero-image"
          />
        </picture>
      </div>

      <div className="container-shell relative z-10 grid lg:min-h-[560px] lg:grid-cols-[minmax(0,47rem)_1fr] lg:items-center">
        <div className="home-hero-copy max-w-[47rem] pb-10 pt-[calc(3.25rem+var(--site-header-height))] sm:pb-12 sm:pt-[calc(3.75rem+var(--site-header-height))] lg:pb-14 lg:pt-[calc(4.25rem+var(--site-header-height))]">
          <p className="eyebrow">Vật liệu gỗ &amp; gia công tại xưởng</p>
          <h1 className="text-balance mt-4 font-display text-[clamp(2.7rem,8vw,4.75rem)] font-extrabold leading-[.98] tracking-[-.05em] text-forest-950">
            Ván gỗ công nghiệp
            <span className="block text-wood-600">&amp; gia công CNC</span>
            <span className="block">tại TP.HCM</span>
          </h1>
          <p className="text-pretty mt-5 max-w-[39rem] text-[15px] leading-7 text-slate-700 sm:text-[1.0625rem] sm:leading-8">
            Tùng Phát cung cấp MDF, MFC, plywood, gỗ ghép và vật liệu bề mặt;
            đồng thời nhận cắt, khoan, soi rãnh và gia công CNC theo bản vẽ cho
            xưởng nội thất, thợ mộc và doanh nghiệp.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/catalogue"
              prefetch={false}
              className="pressable inline-flex min-h-12 items-center justify-center gap-2 bg-forest-900 px-5 text-sm font-extrabold text-white hover:bg-forest-800"
            >
              Xem mã màu <ArrowRight size={17} aria-hidden="true" />
            </Link>
            <TrackedLink
              href={ZALO_URL}
              target="_blank"
              rel="noopener noreferrer"
              eventName="request_quote"
              eventProperties={{ location: "home_hero", channel: "zalo" }}
              className="pressable inline-flex min-h-12 items-center justify-center gap-2 border border-forest-900/25 bg-[#f7f3ed]/90 px-5 text-sm font-extrabold text-forest-950 hover:border-wood-500 hover:bg-white"
            >
              <Image
                src="/images/logo-zalo.webp"
                alt=""
                width={1200}
                height={420}
                sizes="36px"
                className="h-auto w-9"
                aria-hidden="true"
              />
              Liên hệ Zalo
            </TrackedLink>
          </div>
        </div>

        <div
          className="home-hero-visual min-h-[clamp(250px,69vw,330px)] lg:min-h-0"
          aria-hidden="true"
        />
      </div>
    </section>
  );
}

export function HomeBenefits() {
  return (
    <section aria-label="Lợi ích chính" className="bg-forest-900 text-white">
      <ul className="container-shell grid divide-y divide-white/10 sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-4">
        {benefits.map(({ icon: Icon, title, text }) => (
          <li
            key={title}
            className="flex min-h-[104px] items-center gap-4 px-1 py-5 sm:px-5 first:sm:pl-0 last:sm:pr-0"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/20 bg-white/10">
              <Icon size={20} className="text-orange-300" aria-hidden="true" />
            </span>
            <span>
              <strong className="block text-sm font-extrabold">{title}</strong>
              <span className="mt-1 block text-xs leading-5 text-white/70">
                {text}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
