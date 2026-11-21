import { sanitizeWordPressHtml } from "@/lib/wordpress/sanitize";

/** Render sanitized WordPress content; callers must provide trusted media origins. */
export function WordPressArticleBody({ html, mediaOrigins, allowInsecureLoopback = false }: { html: string; mediaOrigins: string[]; allowInsecureLoopback?: boolean }) {
  const result = sanitizeWordPressHtml(html, { mediaOrigins, allowInsecureLoopback });
  if (result.warnings.length) throw new Error(`WordPress content cannot be safely preserved: ${result.warnings.join(", ")}`);
  return <div className="prose prose-slate max-w-none prose-headings:scroll-mt-32 prose-headings:text-forest-950 prose-p:leading-8 prose-p:text-slate-700 prose-li:text-slate-700 prose-a:font-semibold prose-a:text-wood-800 prose-a:underline-offset-4 prose-img:rounded-lg prose-table:block prose-table:max-w-full prose-table:overflow-x-auto" dangerouslySetInnerHTML={{ __html: result.html }} />;
}
