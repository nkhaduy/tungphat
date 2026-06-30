import { ArrowUpRight } from "lucide-react";
import Image from "next/image";

type ProductCardProps = {
  name: string;
  type: string;
  application: string;
  image: string;
  position?: string;
};

export function ProductCard({ name, type, application, image, position }: ProductCardProps) {
  return (
    <article className="group overflow-hidden bg-white shadow-card">
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={image}
          alt={name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          quality={95}
          className={`object-cover ${position || ""}`}
        />
        <span className="absolute left-5 top-5 bg-forest-950 px-3 py-2 text-[10px] font-bold uppercase tracking-[.14em] text-white">
          {type}
        </span>
      </div>
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-display text-xl font-bold text-forest-950">{name}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">{application}</p>
          </div>
          <span className="grid h-10 w-10 shrink-0 place-items-center border border-slate-200 text-forest-900 transition group-hover:border-wood-500 group-hover:bg-wood-500 group-hover:text-white">
            <ArrowUpRight size={18} />
          </span>
        </div>
      </div>
    </article>
  );
}
