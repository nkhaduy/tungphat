"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { EditorialHeading } from "@/lib/editorial/headings";

function HeadingLinks({ headings, activeId }: { headings: EditorialHeading[]; activeId: string }) {
  return <ol className="editorial-toc__list">{headings.map((heading) => (
    <li key={heading.id} className={heading.level === 3 ? "editorial-toc__item editorial-toc__item--nested" : "editorial-toc__item"}>
      <a href={`#${heading.id}`} aria-current={activeId === heading.id ? "location" : undefined} className={activeId === heading.id ? "editorial-toc__link is-active" : "editorial-toc__link"}>{heading.text}</a>
    </li>
  ))}</ol>;
}

export function ArticleTableOfContents({ headings }: { headings: EditorialHeading[] }) {
  const [activeId, setActiveId] = useState("");

  useEffect(() => {
    if (!headings.length || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible[0]?.target instanceof HTMLElement) setActiveId(visible[0].target.id);
    }, { rootMargin: "-16% 0px -72% 0px", threshold: 0 });
    for (const heading of headings) {
      const element = document.getElementById(heading.id);
      if (element) observer.observe(element);
    }
    return () => observer.disconnect();
  }, [headings]);

  if (!headings.length) return null;

  return <>
    <details className="editorial-toc__disclosure lg:hidden">
      <summary>Trong bài viết <ChevronDown size={18} aria-hidden="true" /></summary>
      <nav aria-label="Mục lục bài viết"><HeadingLinks headings={headings} activeId={activeId} /></nav>
    </details>
    <nav aria-label="Trong bài viết" className="editorial-toc__desktop hidden lg:block">
      <h2>Trong bài viết</h2>
      <HeadingLinks headings={headings} activeId={activeId} />
    </nav>
  </>;
}
