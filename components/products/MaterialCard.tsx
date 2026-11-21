import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { MaterialImage } from "@/components/products/MaterialImage";
import type { ProductDiscoveryCard } from "@/lib/product-taxonomy";

export function MaterialCard({ card, showDescription = true }: { card: ProductDiscoveryCard; showDescription?: boolean }) {
  return (
    <article className="group flex min-w-0 flex-col overflow-hidden rounded-xl border border-forest-900/10 bg-white transition-colors hover:border-forest-900/40">
      {card.image ? <Link href={card.href} className="relative block aspect-[4/3] overflow-hidden bg-[#f7f8f5]" aria-label={`Xem ${card.title}`}>
        <MaterialImage src={card.image} alt={card.alt} sizes="(max-width: 767px) 50vw, (max-width: 1279px) 33vw, 25vw" className="p-3 transition-transform duration-200 motion-safe:group-hover:scale-[1.025] motion-reduce:transition-none" />
      </Link> : null}
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <h3 className="text-base font-extrabold text-forest-950 sm:text-lg"><Link href={card.href}>{card.title}</Link></h3>
        {showDescription ? <p className="mt-2 text-sm leading-6 text-slate-600">{card.description}</p> : null}
        <Link href={card.href} aria-label={`Xem chi tiết ${card.title}`} className="mt-auto inline-flex min-h-11 items-center gap-2 pt-4 text-sm font-extrabold text-wood-600">Xem chi tiết <ArrowRight size={15} aria-hidden="true" /></Link>
      </div>
    </article>
  );
}
