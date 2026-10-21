"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export type FeaturedCode = {
  id: string;
  code: string;
  name: string;
  material: string;
  image: string;
  href: string;
};

export function FeaturedColorCodes({ thanhThuy, baThanh }: { thanhThuy: FeaturedCode[]; baThanh: FeaturedCode[] }) {
  const [brand, setBrand] = useState<"thanh-thuy" | "ba-thanh">("thanh-thuy");
  const codes = brand === "thanh-thuy" ? thanhThuy : baThanh;
  const brandName = brand === "thanh-thuy" ? "Thanh Thùy" : "Ba Thanh";

  return (
    <div>
      <div role="group" aria-label="Chọn thương hiệu mã màu" className="inline-flex border border-slate-300 bg-white p-1">
        {(["thanh-thuy", "ba-thanh"] as const).map((value) => (
          <button key={value} type="button" aria-pressed={brand === value} onClick={() => setBrand(value)} className={`min-h-11 px-5 text-sm font-bold transition-colors ${brand === value ? "bg-slate-950 text-white" : "text-slate-700 hover:bg-slate-100"}`}>
            {value === "thanh-thuy" ? "Thanh Thùy" : "Ba Thanh"}
          </button>
        ))}
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {codes.map((code) => (
          <article key={code.id} className="min-w-0 border border-slate-200 bg-white">
            <Link href={code.href} className="group block">
              <span className="relative block aspect-[4/3] overflow-hidden bg-slate-100">
                <Image src={code.image} alt={`Mẫu bề mặt ${brandName} mã ${code.code}`} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" className="object-cover transition-transform duration-200 group-hover:scale-[1.025]" />
              </span>
              <span className="block p-4">
                <span className="block text-xs font-semibold text-slate-500">{brandName} · {code.material}</span>
                <strong className="mt-2 block text-base text-slate-950">{code.name === code.code || code.name.startsWith(`${code.code} `) ? code.name : `${code.code} · ${code.name}`}</strong>
                <span className="mt-3 block text-sm font-bold text-slate-800 underline underline-offset-4">Xem mã &amp; hỏi giá</span>
              </span>
            </Link>
          </article>
        ))}
      </div>
      <p className="mt-4 text-xs leading-6 text-slate-500">Ảnh mẫu giúp tra cứu mã; màu hiển thị có thể khác mẫu vật liệu thực tế. Gửi mã để kiểm tra quy cách và tồn kho.</p>
    </div>
  );
}
