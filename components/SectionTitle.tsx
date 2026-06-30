type SectionTitleProps = {
  eyebrow: string;
  title: string;
  description?: string;
  light?: boolean;
  centered?: boolean;
};

export function SectionTitle({
  eyebrow,
  title,
  description,
  light = false,
  centered = false
}: SectionTitleProps) {
  return (
    <div className={centered ? "mx-auto max-w-3xl text-center" : "max-w-2xl"}>
      <span className={`eyebrow ${centered ? "justify-center" : ""}`}>{eyebrow}</span>
      <h2
        className={`mt-4 font-display text-3xl font-bold leading-[1.15] tracking-[-0.035em] sm:text-4xl lg:text-[3.1rem] ${
          light ? "text-white" : "text-forest-950"
        }`}
      >
        {title}
      </h2>
      {description && (
        <p className={`mt-5 leading-7 ${light ? "text-white/72" : "text-slate-500"}`}>
          {description}
        </p>
      )}
    </div>
  );
}
