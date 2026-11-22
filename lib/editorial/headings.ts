import { decodeHTML } from "entities";

export type EditorialHeading = { id: string; text: string; level: 2 | 3 };

export function slugifyEditorialText(value: string) {
  return value
    .replace(/[Đđ]/g, "d")
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "muc-noi-dung";
}

function plainMarkdownHeading(value: string) {
  return decodeHTML(value
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\[[^\]]*\]/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/\\([\\`*_{}\[\]()#+.!>])/g, "$1")
    .replace(/[*_~]/g, ""))
    .replace(/\s+/g, " ")
    .trim();
}

function createHeadingCollector() {
  const used = new Set<string>();
  const headings: EditorialHeading[] = [];
  return {
    headings,
    add(level: 2 | 3, rawText: string) {
      const text = rawText.replace(/\s+/g, " ").trim();
      if (!text) return;
      const base = slugifyEditorialText(text);
      let id = base;
      let suffix = 2;
      while (used.has(id)) id = `${base}-${suffix++}`;
      used.add(id);
      headings.push({ id, text, level });
    },
  };
}

export function extractMarkdownHeadings(markdown: string): EditorialHeading[] {
  const collector = createHeadingCollector();
  let fence: { marker: "`" | "~"; length: number } | null = null;

  for (const line of markdown.split(/\r?\n/u)) {
    const fenceLine = line.match(/^ {0,3}(`{3,}|~{3,})/u);
    if (fence) {
      if (fenceLine && fenceLine[1][0] === fence.marker && fenceLine[1].length >= fence.length) fence = null;
      continue;
    }
    if (fenceLine) {
      fence = { marker: fenceLine[1][0] as "`" | "~", length: fenceLine[1].length };
      continue;
    }

    const match = line.match(/^ {0,3}(#{1,3})[\t ]+(.+?)[\t ]*#*[\t ]*$/u);
    if (!match) continue;
    collector.add(match[1].length === 3 ? 3 : 2, plainMarkdownHeading(match[2]));
  }

  return collector.headings;
}

export function addHtmlHeadingAnchors(html: string): { html: string; headings: EditorialHeading[] } {
  const collector = createHeadingCollector();
  const anchoredHtml = html.replace(/<h([23])\b[^>]*>([\s\S]*?)<\/h\1\s*>/giu, (_match, rawLevel: string, inner: string) => {
    const level = Number(rawLevel) as 2 | 3;
    const text = decodeHTML(inner.replace(/<br\s*\/?\s*>/giu, " ").replace(/<[^>]*>/gu, " ")).replace(/\s+/g, " ").trim();
    if (!text) return `<h${level}>${inner}</h${level}>`;
    const before = collector.headings.length;
    collector.add(level, text);
    const heading = collector.headings[before];
    return `<h${level} id="${heading.id}">${inner}</h${level}>`;
  });
  return { html: anchoredHtml, headings: collector.headings };
}
