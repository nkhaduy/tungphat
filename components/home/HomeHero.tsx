import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { locations } from "@/lib/locations";
import { ZALO_URL } from "@/lib/seo";
import { TrackedLink } from "@/components/TrackedLink";

export function HomeHero() {
  const branch = locations[0];

  return (
    <section id="trang-chu" className="border-b border-slate-200 bg-white pt-[var(--site-header-height)]">
      <div className="container-shell grid min-w-0 gap-10 py-12 md:py-16 lg:min-h-[620px] lg:grid-cols-[1.08fr_.92fr] lg:items-center lg:gap-16 lg:py-20">
        <div className="home-hero-copy min-w-0">
          <p className="text-xs font-bold uppercase tracking-[.19em] text-slate-600">Công ty TNHH TMDV Gỗ Tùng Phát</p>
          <h1 className="mt-5 max-w-[16ch] text-balance font-display text-[clamp(2.4rem,4.3vw,4.15rem)] font-extrabold leading-[1.1] tracking-[-.055em] text-slate-950">
            Ván gỗ công nghiệp &amp; gia công CNC tại Thủ Đức
          </h1>
          <p className="mt-6 max-w-[58ch] text-base leading-8 text-slate-700 md:text-lg">
            Tùng Phát cung cấp cốt ván, bề mặt trang trí và vật tư hoàn thiện từ Thanh Thùy, Ba Thanh; đồng thời nhận cắt và gia công CNC theo yêu cầu.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/san-pham/" className="inline-flex min-h-12 items-center justify-center gap-2 bg-slate-950 px-6 text-sm font-bold text-white transition-colors hover:bg-slate-800">
              Khám phá sản phẩm <ArrowRight size={17} aria-hidden="true" />
            </Link>
            <TrackedLink href={ZALO_URL} target="_blank" rel="noopener noreferrer" eventName="request_quote" eventProperties={{ location: "home_hero", channel: "zalo" }} className="inline-flex min-h-12 items-center justify-center border border-slate-300 bg-white px-6 text-sm font-bold text-slate-950 transition-colors hover:border-slate-950">
              Nhận tư vấn &amp; báo giá
            </TrackedLink>
          </div>
          <p className="mt-8 border-t border-slate-200 pt-5 text-sm text-slate-600">Chọn vật liệu, tra mã màu, rồi gửi kích thước hoặc file cần gia công.</p>
        </div>
        {branch ? (
          <figure className="min-w-0">
            <div className="relative aspect-[4/3] overflow-hidden border border-slate-200 bg-white lg:aspect-[5/4]">
              <Image src={branch.image} alt={branch.imageAlt} fill sizes="(max-width: 1024px) 100vw, 42vw" className="object-cover object-top" priority />
            </div>
            <figcaption className="mt-3 flex items-start gap-2 text-xs leading-5 text-slate-600">
              <MapPin size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
              Ảnh cửa hàng Tùng Phát · {branch.address}
            </figcaption>
          </figure>
        ) : null}
      </div>
    </section>
  );
}
