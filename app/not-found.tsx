import type { Metadata } from "next";
import Image from "next/image";
import { ArrowLeft, BookOpen } from "lucide-react";
import { SiteShell } from "@/components/site/SiteShell";
import { ButtonLink } from "@/components/ui/ButtonLink";

export const metadata: Metadata = {
  title: "ERROR 404 — Trang này không tồn tại",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <SiteShell headerTone="dark" mainClassName="min-h-[100dvh]">
      <section className="not-found-scene" data-testid="not-found-scene">
        <div className="not-found-stage" data-testid="not-found-stage">
          <picture className="absolute inset-0 block">
            <source
              media="(max-width: 767px)"
              srcSet="/images/404-mobile.webp"
            />
            <Image
              src="/images/404-desktop.webp"
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover object-center"
            />
          </picture>
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,16,11,.5)_0%,rgba(3,16,11,.08)_38%,rgba(3,16,11,.68)_75%,rgba(3,16,11,.95)_100%)] shadow-[inset_0_0_120px_rgba(2,12,8,.32)] md:bg-[linear-gradient(180deg,rgba(3,16,11,.42)_0%,rgba(3,16,11,.1)_42%,rgba(3,16,11,.76)_82%,rgba(3,16,11,.96)_100%)]"
          />
        </div>
        <div className="not-found-content container-shell flex w-full flex-col items-center text-center">
          <h1 className="max-w-4xl text-balance text-[clamp(2rem,5vw,4.5rem)] font-extrabold leading-[1.02] tracking-[-.04em] text-white drop-shadow-[0_3px_24px_rgba(0,0,0,.55)]">
            Trang này không tồn tại
          </h1>
          <div className="mt-7 grid w-full max-w-sm gap-3 sm:flex sm:max-w-none sm:justify-center">
            <ButtonLink
              href="/"
              variant="secondary"
              className="min-h-14 w-full border-white bg-white px-7 text-forest-950 shadow-[0_12px_30px_rgba(0,0,0,.2)] hover:border-white hover:bg-[#f7f8f5] sm:w-auto"
            >
              <ArrowLeft size={18} aria-hidden="true" />
              Về trang chủ
            </ButtonLink>
            <ButtonLink
              href="/catalogue/"
              variant="dark"
              className="min-h-14 w-full border border-white/60 bg-forest-950/75 px-7 text-white shadow-[0_12px_30px_rgba(0,0,0,.18)] hover:bg-forest-900 sm:w-auto"
            >
              <BookOpen size={18} aria-hidden="true" />
              Xem catalogue
            </ButtonLink>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
