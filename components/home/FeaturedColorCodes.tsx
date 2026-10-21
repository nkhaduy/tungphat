import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export type FeaturedCode = {
  id: string;
  code: string;
  name: string;
  material: string;
  image: string;
  href: string;
};

export function FeaturedColorCodes({ thanhThuy, baThanh }: { thanhThuy: FeaturedCode[]; baThanh: FeaturedCode[] }) {
  const suppliers = [
    { name: "Thanh Thùy", slug: "thanh-thuy", logo: "/partners/thanh-thuy-logo.webp" },
    { name: "Ba Thanh", slug: "ba-thanh", logo: "/partners/ba-thanh-logo.webp" },
    { name: "An Cường", slug: "an-cuong", logo: "/partners/an-cuong-logo.webp" },
  ] as const;
  const codes = Array.from({ length: Math.max(thanhThuy.length, baThanh.length) }, (_, index) => [
    thanhThuy[index],
    baThanh[index],
  ]).flat().filter((code): code is FeaturedCode => Boolean(code));

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-3">
        {suppliers.map((supplier) => (
          <Link key={supplier.slug} href={`/catalogue/${supplier.slug}/`} prefetch={false} className="group flex min-h-[142px] min-w-0 flex-col items-center justify-between rounded-lg border border-forest-900/10 bg-white p-5 shadow-[0_8px_24px_rgba(7,59,40,.045)] transition-colors hover:border-wood-500/40">
            <span className="relative block h-14 w-full"><Image src={supplier.logo} alt={`Logo ${supplier.name}`} fill sizes="180px" className="object-contain" /></span>
            <span className="mt-4 inline-flex min-h-9 items-center gap-2 text-xs font-extrabold text-forest-950 group-hover:text-wood-600">Xem mã màu <ArrowRight size={14} aria-hidden="true" /></span>
          </Link>
        ))}
      </div>
      <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
        <h3 className="font-display text-xl font-extrabold text-forest-950 sm:text-2xl">Các màu nổi bật</h3>
        <Link href="/catalogue/" prefetch={false} className="inline-flex min-h-11 items-center gap-2 text-sm font-extrabold text-wood-600">Tìm mã khác <ArrowRight size={16} aria-hidden="true" /></Link>
      </div>
      <div className="color-code-marquee mt-4" aria-label="Các mã màu nổi bật">
        <div className="color-code-marquee-track">
          {[...codes, ...codes].map((code, index) => {
            const duplicate = index >= codes.length;
            const supplier = code.id.startsWith("thanh-thuy:") ? suppliers[0] : suppliers[1];
            return (
              <Link key={`${code.id}-${index}`} href={code.href} aria-hidden={duplicate || undefined} tabIndex={duplicate ? -1 : undefined} className="group color-code-marquee-card rounded-lg">
                <span className="relative block aspect-[4/3] w-full overflow-hidden bg-[#edf1ec]"><Image src={code.image} alt={duplicate ? "" : `Mã màu ${code.code} ${code.name}`} fill sizes="200px" className="object-cover transition-transform duration-300 group-hover:scale-[1.025]" /></span>
                <span className="flex items-center justify-between gap-3 pt-3"><strong className="min-w-0 text-sm leading-5 text-forest-950">{code.name}</strong><Image src={supplier.logo} alt={duplicate ? "" : supplier.name} width={72} height={24} className="h-6 w-[72px] shrink-0 object-contain object-right" /></span>
                <span className="mt-1 block text-xs text-slate-600">{code.code} · {code.material}</span>
              </Link>
            );
          })}
        </div>
      </div>
      <p className="mt-4 text-xs leading-6 text-slate-600">Ảnh mẫu giúp tra cứu mã; màu hiển thị có thể khác mẫu vật liệu thực tế. Gửi mã để kiểm tra quy cách và tồn kho.</p>
    </div>
  );
}
