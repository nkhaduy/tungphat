import fs from "node:fs";
import path from "node:path";
import {
  brandCategoriesSchema,
  businessSettingsSchema,
  materialCategoriesSchema,
  seoSettingsSchema,
  staticPagesSettingsSchema,
} from "../lib/content-schema";
import { getArticles, getProducts, getProjects, getServicePages } from "../lib/content";
import { validateRootSlug } from "../lib/reserved-slugs";
import { rootContentSlugCollisions, type RootContentCandidate } from "../lib/root-content-routes";

const root = process.cwd();
const issues: string[] = [];
const routes = new Map<string, string>();

function formatZodIssue(issue: { path: PropertyKey[]; message: string }) {
  return `${issue.path.map(String).join(".") || "data"}: ${issue.message}`;
}

async function main() {
const [articles, products, projects, pages] = await Promise.all([
  getArticles({ includeDrafts: true }),
  getProducts({ includeDrafts: true }),
  getProjects({ includeDrafts: true }),
  getServicePages({ includeDrafts: true }),
]);
const collections = [
  { name: "articles", entries: articles, route: (slug: string) => `/bai-viet/${slug}` },
  { name: "products", entries: products, route: (slug: string) => `/${slug}` },
  { name: "projects", entries: projects, route: (slug: string) => `/du-an/${slug}` },
  { name: "pages", entries: pages, route: (slug: string) => `/${slug}` },
];

for (const collection of collections) {
  for (const entry of collection.entries) {
    const source = entry.sourcePath;
    const route = collection.route(entry.slug);
    const previous = routes.get(route);
    if (previous) issues.push(`${source}: URL trùng với ${previous} (${route})`);
    else routes.set(route, source);
    if ((collection.name === "products" || collection.name === "pages")) {
      const slugIssue = validateRootSlug(entry.slug);
      if (slugIssue) issues.push(`${source}: ${slugIssue} ('${entry.slug}')`);
    }
    if (!entry.draft && entry.noindex) issues.push(`${source}: nội dung published đang bật noindex`);
    if (!entry.draft && !entry.body.trim()) issues.push(`${source}: nội dung published không có body`);
  }
}

const rootCandidates: RootContentCandidate[] = [
  ...products.map((entry) => ({ slug: entry.slug, collection: "products" as const, source: entry.sourcePath })),
  ...pages.map((entry) => ({ slug: entry.slug, collection: "pages" as const, source: entry.sourcePath })),
];
for (const [first, second] of rootContentSlugCollisions(rootCandidates)) {
  issues.push(`${second.source}: slug root trùng với ${first.source} (/${second.slug})`);
}

const productSlugs = new Set(products.map((entry) => entry.slug));
const articleSlugs = new Set(articles.map((entry) => entry.slug));
for (const entry of [...articles, ...products, ...projects, ...pages]) {
  const relatedProducts = "relatedProducts" in entry ? entry.relatedProducts : [];
  const relatedArticles = "relatedArticles" in entry ? entry.relatedArticles : [];
  for (const related of relatedProducts) {
    if (!productSlugs.has(related)) issues.push(`${entry.sourcePath}: relatedProducts không tồn tại '${related}'`);
  }
  for (const related of relatedArticles) {
    if (!articleSlugs.has(related)) issues.push(`${entry.sourcePath}: relatedArticles không tồn tại '${related}'`);
  }
}

const settings = [
  ["content/settings/business.json", businessSettingsSchema],
  ["content/settings/seo.json", seoSettingsSchema],
  ["content/settings/static-pages.json", staticPagesSettingsSchema],
  ["content/categories/materials.json", materialCategoriesSchema],
  ["content/categories/brands.json", brandCategoriesSchema],
] as const;
for (const [relative, schema] of settings) {
  try {
    const result = schema.safeParse(JSON.parse(fs.readFileSync(path.join(root, relative), "utf8")));
    if (!result.success) for (const issue of result.error.issues) issues.push(`${relative}: ${formatZodIssue(issue)}`);
  } catch (error) {
    issues.push(`${relative}: không đọc được JSON (${error instanceof Error ? error.message : "unknown"})`);
  }
}

if (issues.length) {
  console.error(`Content validation thất bại (${issues.length} lỗi):\n- ${issues.join("\n- ")}`);
  process.exit(1);
}

const total = collections.reduce((sum, collection) => sum + collection.entries.length, 0);
console.log(`Content validation pass: ${total} Payload entries, ${routes.size} URL duy nhất, 5 globals.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
