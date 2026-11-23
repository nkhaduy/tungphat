import Image from "next/image";
import Link from "next/link";
import { resolveMediaUrl, resolvePreviewUploadMediaUrl } from "@/lib/media";

type LexicalNode = Record<string, unknown>;

const MEDIA_HOSTS = new Set([
  "cdn.mdftungphat.com",
  "mdftungphat.com",
  "www.mdftungphat.com",
  "cms.mdftungphat.com",
  "media.mdftungphat.com",
]);

function record(value: unknown): LexicalNode {
  return value && typeof value === "object" && !Array.isArray(value) ? value as LexicalNode : {};
}

function records(value: unknown): LexicalNode[] {
  return Array.isArray(value) ? value.map(record) : [];
}

function string(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export function hasLexicalContent(value: unknown): boolean {
  return records(record(record(value).root).children).some((node) =>
    node.type === "upload" || node.type === "block" || containsText(node),
  );
}

function containsText(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(containsText);
  const node = record(value);
  if (node.type === "text" && string(node.text).trim().length > 0) return true;
  return Array.isArray(node.children) && node.children.some(containsText);
}

function safeHref(value: unknown): string | undefined {
  const href = string(value).trim();
  if (!href || href.startsWith("//")) return undefined;
  if (/^(?:\/|#)/u.test(href)) return href;
  try {
    const url = new URL(href);
    return ["https:", "http:", "mailto:", "tel:"].includes(url.protocol) ? href : undefined;
  } catch {
    return undefined;
  }
}

function safeMedia(value: unknown): string | undefined {
  const raw = string(value).trim();
  if (!raw || raw.startsWith("//")) return undefined;
  try {
    const url = new URL(raw, "https://cdn.mdftungphat.com");
    const mediaPath = /^\/(?:uploads|uploads-thumbnails|gallery|media)(?:\/|$)/u.test(url.pathname);
    const cloudflareStorage = url.hostname.endsWith(".r2.dev") || url.hostname.endsWith(".r2.cloudflarestorage.com");
    const stagingOrigin = process.env.STATIC_BUILD_TARGET === "preview" && url.hostname === "tungphat-payload-cms-staging.nkhaduy.workers.dev";
    const previewMediaOrigin = process.env.STATIC_BUILD_TARGET === "preview" && url.hostname === "tungphat-static-assets-preview.nkhaduy.workers.dev";
    if (url.protocol !== "https:" || (!MEDIA_HOSTS.has(url.hostname) && !cloudflareStorage && !stagingOrigin && !previewMediaOrigin) || !mediaPath) return undefined;
    return process.env.STATIC_BUILD_TARGET === "preview"
      ? resolvePreviewUploadMediaUrl(raw, process.env.NEXT_PUBLIC_PREVIEW_MEDIA_BASE_URL)
      : resolveMediaUrl(raw);
  } catch {
    return undefined;
  }
}

function textNode(node: LexicalNode, key: string) {
  let content: React.ReactNode = string(node.text);
  const format = typeof node.format === "number" ? node.format : 0;
  if (format & 16) content = <code key={`${key}-code`}>{content}</code>;
  if (format & 8) content = <u key={`${key}-underline`}>{content}</u>;
  if (format & 4) content = <s key={`${key}-strike`}>{content}</s>;
  if (format & 2) content = <em key={`${key}-italic`}>{content}</em>;
  if (format & 1) content = <strong key={`${key}-bold`}>{content}</strong>;
  if (format & 32) content = <sub key={`${key}-sub`}>{content}</sub>;
  if (format & 64) content = <sup key={`${key}-sup`}>{content}</sup>;
  return content;
}

function imageFrom(value: unknown, altFallback = "") {
  const node = record(value);
  const media = record(node.value);
  const fields = record(node.fields);
  const src = safeMedia(media.url ?? node.url ?? node.src);
  if (!src) return null;
  const alt = string(media.alt ?? fields.alt ?? node.alt ?? altFallback);
  return <Image src={src} alt={alt} width={Number(media.width) || 1200} height={Number(media.height) || 800} sizes="(max-width: 768px) 100vw, 768px" unoptimized className="mx-auto h-auto max-w-full rounded-lg" />;
}

function block(node: LexicalNode, key: string) {
  const fields = record(node.fields);
  const kind = string(fields.blockType ?? node.blockType);
  if (kind === "editorialTable") {
    const columns = records(fields.columns).map((item) => string(item.label ?? item.value));
    const rows = records(fields.rows).map((row) => records(row.cells).map((cell) => string(cell.value ?? cell.text)));
    if (!columns.length || !rows.length) return null;
    return <div className="my-8 overflow-x-auto" key={key}><table className="min-w-full border-collapse text-left text-sm"><thead><tr>{columns.map((column, index) => <th className="border border-slate-300 bg-slate-100 px-3 py-2 font-bold text-forest-950" key={`${key}-head-${index}`}>{column}</th>)}</tr></thead><tbody>{rows.map((row, rowIndex) => <tr key={`${key}-row-${rowIndex}`}>{columns.map((_, columnIndex) => <td className="border border-slate-300 px-3 py-2 align-top" key={`${key}-${rowIndex}-${columnIndex}`}>{row[columnIndex] ?? ""}</td>)}</tr>)}</tbody></table></div>;
  }
  if (kind === "editorialCode") {
    const code = string(fields.code);
    return code ? <pre className="my-8 overflow-x-auto rounded-lg bg-slate-950 p-4 text-sm text-slate-100"><code>{code}</code></pre> : null;
  }
  if (kind === "editorialCTA") {
    const href = safeHref(fields.href);
    const label = string(fields.label) || "Tìm hiểu thêm";
    return <aside className="my-8 rounded-xl border border-forest-900/15 bg-[#f5f7f5] p-5 sm:p-7" key={key}>{fields.title ? <h3 className="mb-2 text-xl font-bold text-forest-950">{string(fields.title)}</h3> : null}{fields.description ? <p className="mb-4 text-slate-700">{string(fields.description)}</p> : null}{href ? <Link href={href} className="inline-flex rounded-md bg-forest-950 px-4 py-2.5 font-bold text-white">{label}</Link> : null}</aside>;
  }
  if (kind === "editorialFAQ") {
    const items = records(fields.items);
    return items.length ? <section className="my-8 space-y-3" aria-label="Câu hỏi thường gặp" key={key}>{items.map((item, index) => <details className="rounded-lg border border-slate-200 p-4" key={`${key}-faq-${index}`}><summary className="cursor-pointer font-bold text-forest-950">{string(item.question)}</summary><p className="mb-0 mt-3 text-slate-700">{string(item.answer)}</p></details>)}</section> : null;
  }
  if (kind === "editorialGallery") {
    const images = records(fields.images);
    return images.length ? <div className="my-8 grid gap-4 sm:grid-cols-2" key={key}>{images.map((image, index) => <figure key={`${key}-gallery-${index}`}>{imageFrom({ value: image.image ?? image }, string(image.alt))}{image.caption ? <figcaption className="mt-2 text-center text-sm text-slate-600">{string(image.caption)}</figcaption> : null}</figure>)}</div> : null;
  }
  if (kind === "editorialVideo") {
    const raw = string(fields.url);
    try {
      const url = new URL(raw);
      if (url.protocol !== "https:") return null;
      const youtubeId = url.hostname === "youtu.be" ? url.pathname.slice(1) : url.hostname === "www.youtube.com" || url.hostname === "youtube.com" ? url.searchParams.get("v") : "";
      const embed = youtubeId && /^[A-Za-z0-9_-]{6,20}$/u.test(youtubeId) ? `https://www.youtube-nocookie.com/embed/${youtubeId}` : undefined;
      return embed ? <div className="my-8 aspect-video overflow-hidden rounded-lg" key={key}><iframe src={embed} title={string(fields.title) || "Video minh họa"} loading="lazy" referrerPolicy="strict-origin-when-cross-origin" sandbox="allow-scripts allow-same-origin allow-presentation" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen className="h-full w-full" /></div> : null;
    } catch {
      return null;
    }
  }
  return null;
}

function renderNode(node: LexicalNode, key: string): React.ReactNode {
  const type = string(node.type);
  const children = records(node.children).map((child, index) => renderNode(child, `${key}-${index}`));
  if (type === "text") return textNode(node, key);
  if (type === "linebreak") return <br key={key} />;
  if (type === "paragraph") return <p key={key}>{children.length ? children : "\u00a0"}</p>;
  if (type === "heading") {
    const tag = string(node.tag);
    const Heading = (["h2", "h3", "h4", "h5", "h6"].includes(tag) ? tag : "h2") as "h2" | "h3" | "h4" | "h5" | "h6";
    return <Heading key={key}>{children}</Heading>;
  }
  if (type === "list") {
    const ordered = node.listType === "number" || node.tag === "ol";
    return ordered ? <ol key={key} start={Number(node.start) || undefined}>{children}</ol> : <ul key={key}>{children}</ul>;
  }
  if (type === "listitem") return <li key={key}>{children}</li>;
  if (type === "quote") return <blockquote key={key}>{children}</blockquote>;
  if (type === "link" || type === "autolink") {
    const linkFields = record(node.fields);
    const href = safeHref(node.url ?? linkFields.url);
    return href ? <a href={href} key={key} rel={/^https?:/u.test(href) ? "noopener noreferrer" : undefined}>{children}</a> : <span key={key}>{children}</span>;
  }
  if (type === "horizontalrule") return <hr key={key} />;
  if (type === "upload") return <figure className="my-8" key={key}>{imageFrom(node)}{node.caption ? <figcaption className="mt-2 text-center text-sm text-slate-600">{string(node.caption)}</figcaption> : null}</figure>;
  if (type === "block") return block(node, key);
  if (type === "root") return <>{children}</>;
  return children.length ? <>{children}</> : null;
}

export function LexicalContent({ value, className = "" }: { value: unknown; className?: string }) {
  const root = record(record(value).root);
  const children = records(root.children);
  if (!children.length) return null;
  return <div className={`prose prose-slate max-w-none prose-headings:scroll-mt-32 prose-headings:text-forest-950 prose-p:leading-8 prose-p:text-slate-700 prose-li:text-slate-700 prose-a:font-semibold prose-a:text-wood-800 prose-a:underline-offset-4 prose-img:rounded-lg ${className}`}>{children.map((node, index) => renderNode(node, `lexical-${index}`))}</div>;
}
