import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function MarkdownContent({ children, className = "" }: { children: string; className?: string }) {
  return (
    <div className={`prose prose-slate max-w-none prose-headings:text-forest-950 prose-a:text-wood-700 prose-a:underline-offset-4 prose-img:rounded-xl ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  );
}
