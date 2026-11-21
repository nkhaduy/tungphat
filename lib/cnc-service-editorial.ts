import type { ContentEntry } from "@/lib/content";
import type { ServicePageFrontmatter } from "@/lib/content-schema";

type CncEditorial = Pick<ContentEntry<ServicePageFrontmatter>, "title" | "excerpt" | "body" | "seoTitle" | "seoDescription" | "faq">;

// Existing CMS entries contain file-submission checklists. Until an editor
// replaces them with service-focused copy, fail closed to the reviewed fallback.
const legacyInstructions = /\b(?:file|upload)\b|tệp|tập tin|bản vẽ|bản thiết kế|tài liệu|gửi|tải lên|nộp|chuyển cho xưởng/iu;

export function resolveCncEditorial(page?: CncEditorial): CncEditorial | null {
  if (!page || page.body.trim().length < 50 || /(?:^|\n) {0,3}#(?!#)\s|(?:^|\n)[^\n]+\n {0,3}=+\s*(?:\n|$)/u.test(page.body)) return null;
  const fields = [page.title, page.excerpt, page.body, page.seoTitle, page.seoDescription, ...page.faq.flatMap((item) => [item.question, item.answer]), "featuredImageAlt" in page ? String(page.featuredImageAlt) : ""];
  if (fields.some((field) => legacyInstructions.test(field))) return null;
  return { title: page.title, excerpt: page.excerpt, body: page.body, seoTitle: page.seoTitle, seoDescription: page.seoDescription, faq: page.faq };
}
