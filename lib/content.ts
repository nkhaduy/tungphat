import "server-only";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import {
  articleSchema,
  productSchema,
  projectSchema,
  servicePageSchema,
  type ArticleFrontmatter,
  type ProductFrontmatter,
  type ProjectFrontmatter,
  type ServicePageFrontmatter
} from "@/lib/content-schema";

export type ContentEntry<T> = T & { body: string; sourcePath: string };

function readCollection<T>(folder: string, schema: { parse: (value: unknown) => T }): ContentEntry<T>[] {
  const directory = path.join(process.cwd(), "content", folder);
  if (!fs.existsSync(directory)) return [];

  return fs
    .readdirSync(directory)
    .filter((file) => /\.mdx?$/.test(file))
    .map((file) => {
      const sourcePath = path.join(directory, file);
      const parsed = matter(fs.readFileSync(sourcePath, "utf8"));
      const frontmatter = schema.parse(parsed.data);
      return { ...frontmatter, body: parsed.content.trim(), sourcePath };
    });
}

export function getArticles(options: { includeDrafts?: boolean } = {}) {
  return readCollection<ArticleFrontmatter>("articles", articleSchema)
    .filter((entry) => options.includeDrafts || (!entry.draft && !entry.noindex))
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export function getArticle(slug: string, options: { includeDrafts?: boolean } = {}) {
  return getArticles(options).find((entry) => entry.slug === slug);
}

export function getProducts(options: { includeDrafts?: boolean } = {}) {
  return readCollection<ProductFrontmatter>("products", productSchema)
    .filter((entry) => options.includeDrafts || (!entry.draft && !entry.noindex && entry.status === "available"))
    .sort((a, b) => a.title.localeCompare(b.title, "vi"));
}

export function getProduct(slug: string, options: { includeDrafts?: boolean } = {}) {
  return getProducts(options).find((entry) => entry.slug === slug);
}

export function getProjects(options: { includeDrafts?: boolean } = {}) {
  return readCollection<ProjectFrontmatter>("projects", projectSchema)
    .filter((entry) => options.includeDrafts || (!entry.draft && !entry.noindex))
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt));
}

export function getProject(slug: string, options: { includeDrafts?: boolean } = {}) {
  return getProjects(options).find((entry) => entry.slug === slug);
}

export function getServicePages(options: { includeDrafts?: boolean } = {}) {
  return readCollection<ServicePageFrontmatter>("pages", servicePageSchema)
    .filter((entry) => options.includeDrafts || (!entry.draft && !entry.noindex))
    .sort((a, b) => a.title.localeCompare(b.title, "vi"));
}

export function getServicePage(slug: string, options: { includeDrafts?: boolean } = {}) {
  return getServicePages(options).find((entry) => entry.slug === slug);
}
