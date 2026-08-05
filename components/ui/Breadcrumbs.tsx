import Link from "next/link";
import { ChevronRight } from "lucide-react";

export type Breadcrumb = { label: string; href?: string };

export function Breadcrumbs({ items }: { items: Breadcrumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-xs font-semibold text-slate-600 sm:text-sm">
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`} className="inline-flex items-center gap-1">
          {index ? <ChevronRight size={14} className="text-slate-400" aria-hidden="true" /> : null}
          {item.href ? <Link href={item.href} className="inline-flex min-h-11 items-center hover:text-wood-600">{item.label}</Link> : <span aria-current="page" className="inline-flex min-h-11 items-center text-forest-950">{item.label}</span>}
        </span>
      ))}
    </nav>
  );
}
