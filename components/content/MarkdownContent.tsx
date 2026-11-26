import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { extractMarkdownHeadings, type EditorialHeading } from "@/lib/editorial/headings";

export function MarkdownContent({ children, className = "", headings: suppliedHeadings }: { children: string; className?: string; headings?: EditorialHeading[] }) {
  const headings = suppliedHeadings ?? extractMarkdownHeadings(children);
  let headingIndex = 0;
  const components: Components = {
    h1: ({ children: headingChildren, node: _node, ...props }) => {
      void _node;
      const heading = headings[headingIndex++];
      return <h2 {...props} id={heading?.id}>{headingChildren}</h2>;
    },
    h2: ({ children: headingChildren, node: _node, ...props }) => {
      void _node;
      const heading = headings[headingIndex++];
      return <h2 {...props} id={heading?.id}>{headingChildren}</h2>;
    },
    h3: ({ children: headingChildren, node: _node, ...props }) => {
      void _node;
      const heading = headings[headingIndex++];
      return <h3 {...props} id={heading?.id}>{headingChildren}</h3>;
    },
    table: ({ children: tableChildren, node: _node, ...props }) => { void _node; return <div className="editorial-table-scroll" tabIndex={0} role="region" aria-label="Bảng trong bài viết"><table {...props}>{tableChildren}</table></div>; },
    img: ({ node: _node, ...props }) => { void _node; return (<>
      {/* eslint-disable-next-line @next/next/no-img-element -- article media may use CMS-approved origins outside Next image configuration */}
      <img {...props} alt={props.alt ?? ""} loading="lazy" decoding="async" />
    </>); },
  };

  return <div className={`editorial-body ${className}`}><ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>{children}</ReactMarkdown></div>;
}
