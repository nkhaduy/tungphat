import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import {
  articleSchema,
  brandCategoriesSchema,
  businessSettingsSchema,
  materialCategoriesSchema,
  productSchema,
  projectSchema,
  seoSettingsSchema,
  servicePageSchema,
  staticPagesSettingsSchema
} from "../lib/content-schema";
import { isReservedRootSlug, validateRootSlug } from "../lib/reserved-slugs";
import { rootContentSlugCollisions, type RootContentCandidate } from "../lib/root-content-routes";

const root = process.cwd();
const issues: string[] = [];
const routes = new Map<string, string>();
const rootContentEntries: RootContentCandidate[] = [];
const entries: Array<{ collection: string; relative: string; data: Record<string, unknown> }> = [];

const collections = {
  articles: articleSchema,
  products: productSchema,
  projects: projectSchema,
  pages: servicePageSchema
} as const;

function formatZodIssue(issue: { path: PropertyKey[]; message: string }) {
  return `${issue.path.map(String).join(".") || "frontmatter"}: ${issue.message}`;
}

function contentRoute(collection: string, slug: string) {
  if (collection === "articles") return `/bai-viet/${slug}`;
  if (collection === "projects") return `/du-an/${slug}`;
  return `/${slug}`;
}

function mediaFields(data: Record<string, unknown>) {
  const single = ["featuredImage", "ogImage", "video", "catalogue"];
  const multiple = ["gallery", "beforeImages", "afterImages"];
  return [
    ...single.map((field) => data[field]).filter((value): value is string => typeof value === "string" && value.length > 0),
    ...multiple.flatMap((field) => Array.isArray(data[field]) ? data[field] : []).filter((value): value is string => typeof value === "string")
  ];
}

function publicReferences(value: unknown): string[] {
  if (typeof value === "string") {
    return /^\/[^\s]+\.(?:avif|webp|png|jpe?g|mp4|webm|pdf)$/i.test(value) ? [value] : [];
  }
  if (Array.isArray(value)) return value.flatMap(publicReferences);
  if (value && typeof value === "object") return Object.values(value).flatMap(publicReferences);
  return [];
}

for (const [collection, schema] of Object.entries(collections)) {
  const folder = path.join(root, "content", collection);
  if (!fs.existsSync(folder)) {
    issues.push(`content/${collection}: thiếu thư mục collection`);
    continue;
  }

  for (const file of fs.readdirSync(folder).filter((name) => /\.mdx?$/.test(name))) {
    const relative = path.join("content", collection, file);
    const parsed = matter(fs.readFileSync(path.join(root, relative), "utf8"));
    const result = schema.safeParse(parsed.data);
    if (!result.success) {
      for (const issue of result.error.issues) issues.push(`${relative}: ${formatZodIssue(issue)}`);
      continue;
    }

    const data = result.data as Record<string, unknown>;
    const slug = String(data.slug);
    entries.push({ collection, relative, data });

    if (path.basename(file, path.extname(file)) !== slug) {
      issues.push(`${relative}: tên file phải trùng slug '${slug}'`);
    }

    const route = contentRoute(collection, slug);
    const previous = routes.get(route);
    if (previous) issues.push(`${relative}: URL trùng với ${previous} (${route})`);
    else routes.set(route, relative);

    if (collection === "products" || collection === "pages") {
      const rootSlugIssue = validateRootSlug(slug);
      if (rootSlugIssue) issues.push(`${relative}: ${rootSlugIssue} ('${slug}')`);
      rootContentEntries.push({ slug, collection, source: relative });
    }

    if (data.draft === false && data.noindex === true) {
      issues.push(`${relative}: nội dung published đang bật noindex; hãy đặt draft=true hoặc noindex=false`);
    }
    if (data.draft === false && !parsed.content.trim()) {
      issues.push(`${relative}: nội dung published không có body`);
    }

    if ((collection === "products" || collection === "pages") && data.draft === false && data.noindex !== true) {
      if (isReservedRootSlug(slug)) issues.push(`${relative}: nội dung published không có root route xuất ra thực tế (/${slug})`);
    }

    for (const media of mediaFields(data)) {
      if (!media.startsWith("/")) {
        issues.push(`${relative}: media phải là đường dẫn public bắt đầu bằng '/' (${media})`);
        continue;
      }
      if (!fs.existsSync(path.join(root, "public", media.slice(1)))) {
        issues.push(`${relative}: media không tồn tại '${media}'`);
      }
    }
  }
}

for (const [first, second] of rootContentSlugCollisions(rootContentEntries)) {
  issues.push(`${second.source}: slug root trùng với ${first.source} (/${second.slug})`);
}

const productSlugs = new Set(entries.filter((entry) => entry.collection === "products").map((entry) => String(entry.data.slug)));
const articleSlugs = new Set(entries.filter((entry) => entry.collection === "articles").map((entry) => String(entry.data.slug)));
for (const entry of entries) {
  for (const related of Array.isArray(entry.data.relatedProducts) ? entry.data.relatedProducts : []) {
    if (!productSlugs.has(String(related))) issues.push(`${entry.relative}: relatedProducts không tồn tại '${related}'`);
  }
  for (const related of Array.isArray(entry.data.relatedArticles) ? entry.data.relatedArticles : []) {
    if (!articleSlugs.has(String(related))) issues.push(`${entry.relative}: relatedArticles không tồn tại '${related}'`);
  }
}

const settings = [
  ["content/settings/business.json", businessSettingsSchema],
  ["content/settings/seo.json", seoSettingsSchema],
  ["content/settings/static-pages.json", staticPagesSettingsSchema],
  ["content/categories/materials.json", materialCategoriesSchema],
  ["content/categories/brands.json", brandCategoriesSchema]
] as const;

for (const [relative, schema] of settings) {
  try {
    const value: unknown = JSON.parse(fs.readFileSync(path.join(root, relative), "utf8"));
    const result = schema.safeParse(value);
    if (!result.success) {
      for (const issue of result.error.issues) issues.push(`${relative}: ${formatZodIssue(issue)}`);
    } else {
      for (const media of publicReferences(result.data)) {
        if (!fs.existsSync(path.join(root, "public", media.slice(1)))) {
          issues.push(`${relative}: media không tồn tại '${media}'`);
        }
      }
    }
  } catch (error) {
    issues.push(`${relative}: không đọc được JSON (${error instanceof Error ? error.message : "unknown"})`);
  }
}

if (issues.length) {
  console.error(`Content validation thất bại (${issues.length} lỗi):\n- ${issues.join("\n- ")}`);
  process.exit(1);
}

console.log(`Content validation pass: ${entries.length} entries, ${routes.size} URL duy nhất, 5 settings files.`);
