export function ResponsiveTable({ label, children }: { label: string; children: React.ReactNode }) {
  return <div role="region" aria-label={label} tabIndex={0} className="overflow-x-auto border border-forest-900/10 bg-white focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-wood-500">{children}</div>;
}
