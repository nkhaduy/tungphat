import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type MarkdownContentProps = {
  children: string;
  className?: string;
  scrollableTables?: boolean;
};

export function MarkdownContent({ children, className = "", scrollableTables = false }: MarkdownContentProps) {
  return (
    <div className={`prose prose-slate max-w-none prose-headings:text-forest-950 prose-a:text-wood-700 prose-a:underline-offset-4 prose-img:rounded-xl ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={scrollableTables ? {
          table({ node, ...props }) {
            void node;
            return (
              <div className="my-8 w-full min-w-0 max-w-full overflow-x-auto" role="region" aria-label="Bảng thông tin có thể cuộn ngang" tabIndex={0}>
                <table {...props} className="min-w-[680px]" />
              </div>
            );
          }
        } : undefined}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
