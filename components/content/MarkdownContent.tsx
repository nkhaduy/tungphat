import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function MarkdownContent({ children }: { children: string }) {
  return (
    <div className="prose prose-slate max-w-none prose-headings:text-forest-950 prose-a:text-wood-700 prose-a:underline-offset-4 prose-img:rounded-xl">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  );
}
