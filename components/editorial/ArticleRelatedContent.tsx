import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { EditorialRelatedItem } from "@/lib/editorial/related-content";
export type { EditorialRelatedItem } from "@/lib/editorial/related-content";

export function ArticleRelatedContent({ items }: { items: EditorialRelatedItem[] }) {
  const usefulItems = items.slice(0, 4);
  if (!usefulItems.length) return null;
  return <section className="editorial-related" aria-labelledby="editorial-related-heading">
    <h2 id="editorial-related-heading">Tìm hiểu thêm</h2>
    <ul>{usefulItems.map((item) => <li key={`${item.kind}-${item.href}`}>
      <Link href={item.href}><span><small>{item.kind}</small>{item.label}</span><ArrowRight size={16} aria-hidden="true" /></Link>
    </li>)}</ul>
  </section>;
}
