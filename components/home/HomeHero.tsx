import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";
import { TrackedLink } from "@/components/TrackedLink";
import { ZALO_URL } from "@/lib/seo";

export function HomeHero() {
  return (
    <section
      id="trang-chu"
      className="home-hero relative isolate overflow-hidden border-b border-forest-900/10 bg-white"
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
          <p className="eyebrow">CÔNG TY TNHH TMDV GỖ TÙNG PHÁT</p>
          <h1 className="text-balance mt-4 font-display text-[clamp(2.7rem,8vw,4.75rem)] font-extrabold leading-[1.04] tracking-[-.05em] text-forest-950">
            Kho ván gỗ công nghiệp, gỗ ghép
            <span className="block text-wood-600">&amp; gia công CNC tại Thủ Đức</span>
          </h1>
          <p className="text-pretty mt-5 max-w-[39rem] text-[15px] leading-7 text-slate-700 sm:text-[1.0625rem] sm:leading-8">
            Tùng Phát cung cấp MDF, MFC, Plywood, gỗ ghép và vật liệu bề mặt;
            đồng thời nhận cắt, khoan, soi rãnh và gia công CNC theo bản vẽ tại
            các chi nhánh đường Tam Bình, TP. Thủ Đức.
          </p>
          <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs font-extrabold text-forest-900 sm:text-sm">
            <li>Hai chi nhánh đường Tam Bình</li>
            <li>MDF, MFC, Plywood &amp; gỗ ghép</li>
            <li>Cắt và gia công CNC</li>
          </ul>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <TrackedLink href={ZALO_URL} target="_blank" rel="noopener noreferrer" eventName="request_quote" eventProperties={{ location: "home_hero", channel: "zalo" }} className="pressable inline-flex min-h-12 items-center justify-center gap-2 bg-wood-600 px-5 text-sm font-extrabold text-white hover:bg-wood-700">
              <MessageCircle size={17} aria-hidden="true" /> Gửi quy cách qua Zalo
            </TrackedLink>
            <Link href="/san-pham" prefetch={false} className="pressable inline-flex min-h-12 items-center justify-center gap-2 border border-forest-900/25 bg-white/90 px-5 text-sm font-extrabold text-forest-950 hover:border-wood-500 hover:bg-white">
              Xem nhóm vật liệu <ArrowRight size={17} aria-hidden="true" />
            </Link>
            <Link href="/lien-he" prefetch={false} className="pressable inline-flex min-h-12 items-center justify-center gap-2 bg-forest-900 px-5 text-sm font-extrabold text-white hover:bg-forest-800">
              Hai chi nhánh <ArrowRight size={17} aria-hidden="true" />
            </Link>
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
