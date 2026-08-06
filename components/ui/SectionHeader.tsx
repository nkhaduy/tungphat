type SectionHeaderProps = { eyebrow?: string; title: string; description?: string; align?: "left" | "center"; className?: string };

export function SectionHeader({ eyebrow, title, description, align = "left", className = "" }: SectionHeaderProps) {
  return (
    <div className={`${align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-3xl"} ${className}`}>
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h2 className="mt-4 text-balance text-3xl font-extrabold leading-tight tracking-[-.025em] text-forest-950 sm:text-4xl">{title}</h2>
      {description ? <p className="mt-4 text-pretty leading-7 text-slate-700">{description}</p> : null}
    </div>
  );
}
