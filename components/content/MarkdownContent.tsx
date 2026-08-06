import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function MarkdownContent({ children, className = "" }: { children: string; className?: string }) {
  return (
    <div className={`prose prose-slate max-w-none prose-headings:scroll-mt-32 prose-headings:text-forest-950 prose-p:leading-8 prose-p:text-slate-700 prose-li:text-slate-700 prose-a:font-semibold prose-a:text-wood-700 prose-a:underline-offset-4 prose-img:rounded-lg prose-table:block prose-table:max-w-full prose-table:overflow-x-auto ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  );
}
