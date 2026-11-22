import Link from "next/link";
import { ChevronRight } from "lucide-react";

export type Breadcrumb = { label: string; href?: string };

export function Breadcrumbs({
  items,
  compact = false,
  tone = "default",
  className = "",
  ariaLabel = "Breadcrumb",
}: {
  items: Breadcrumb[];
  compact?: boolean;
  tone?: "default" | "onDark";
  className?: string;
  ariaLabel?: string;
}) {
  const itemHeight = compact ? "min-h-7" : "min-h-11";
  const linkColor = tone === "onDark" ? "text-white/80 hover:text-white" : "hover:text-wood-600";
  const separatorColor = tone === "onDark" ? "text-white/45" : "text-slate-400";
  const currentColor = tone === "onDark" ? "text-white" : "text-forest-950";

  return (
    <nav
      aria-label={ariaLabel}
      className={`flex flex-wrap items-center gap-1 text-xs font-semibold ${tone === "onDark" ? "text-white/80" : "text-slate-600"} sm:text-sm ${className}`}
    >
      {items.map((item, index) => {
        const current = index === items.length - 1;
        return <span key={`${item.label}-${index}`} className="inline-flex items-center gap-1">
          {index ? <ChevronRight size={14} className={separatorColor} aria-hidden="true" /> : null}
          {item.href && !current ? <Link href={item.href} className={`inline-flex ${itemHeight} items-center ${linkColor}`}>{item.label}</Link> : <span aria-current={current ? "page" : undefined} className={`inline-flex ${itemHeight} items-center ${current ? currentColor : linkColor}`}>{item.label}</span>}
        </span>;
      })}
    </nav>
  );
}
