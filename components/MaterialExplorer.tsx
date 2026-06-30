"use client";

import Image from "next/image";
import { Check, Clipboard, GitCompareArrows, Plus } from "lucide-react";
import { useState } from "react";

const samples = [
  { code: "TP-1234", name: "Oak sáng", brand: "An Cường", surface: "Vân sần", pos: "10% center" },
  { code: "TP-5678", name: "Walnut nâu", brand: "Thanh Thùy", surface: "Vân gỗ", pos: "34% center" },
  { code: "TP-9012", name: "Vân xi măng", brand: "KES", surface: "Mờ", pos: "58% center" },
  { code: "TP-2486", name: "Ash tự nhiên", brand: "An Cường", surface: "Đồng vân", pos: "78% center" },
  { code: "TP-3105", name: "Teak ấm", brand: "Thanh Thùy", surface: "Mịn", pos: "92% center" },
  { code: "TP-7741", name: "Xám khói", brand: "KES", surface: "Mờ sâu", pos: "48% center" }
];

export function MaterialExplorer() {
  const [compared, setCompared] = useState<string[]>([]);
  const [copied, setCopied] = useState("");

  const toggle = (code: string) => {
    setCompared((current) => current.includes(code) ? current.filter((item) => item !== code) : current.length < 3 ? [...current, code] : current);
  };

  const copy = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopied(code);
    window.setTimeout(() => setCopied(""), 1400);
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">Chọn tối đa 3 mẫu để so sánh bề mặt và thông số.</p>
        <span className="inline-flex min-h-11 items-center gap-2 bg-forest-950 px-4 text-sm font-bold text-white">
          <GitCompareArrows size={17} /> So sánh {compared.length}/3
        </span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {samples.map((sample) => {
          const selected = compared.includes(sample.code);
          return (
            <article key={sample.code} className="group relative min-h-[340px] overflow-hidden bg-forest-950 text-white">
              <Image src="/images/wood-panels.png" alt={`Mẫu ${sample.name}, mã ${sample.code}`} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" quality={95} className="object-cover" style={{ objectPosition: sample.pos }} />
              <div className="absolute inset-0 card-gradient-overlay" />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold text-orange-300">{sample.code}</p>
                    <h3 className="mt-1 text-xl font-extrabold">{sample.name}</h3>
                    <p className="mt-2 text-xs text-white/75">{sample.brand} · {sample.surface}</p>
                  </div>
                  <button type="button" onClick={() => toggle(sample.code)} aria-pressed={selected} aria-label={selected ? `Bỏ ${sample.name} khỏi danh sách so sánh` : `Thêm ${sample.name} vào danh sách so sánh`} className={`grid h-11 w-11 shrink-0 place-items-center transition ${selected ? "bg-wood-500" : "bg-white text-forest-950 hover:bg-wood-500 hover:text-white"}`}>
                    {selected ? <Check size={18} /> : <Plus size={18} />}
                  </button>
                </div>
                <button type="button" onClick={() => copy(sample.code)} className="mt-4 inline-flex min-h-11 items-center gap-2 text-xs font-bold text-white/88 hover:text-white">
                  <Clipboard size={15} /> {copied === sample.code ? "Đã sao chép mã" : "Sao chép mã"}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
