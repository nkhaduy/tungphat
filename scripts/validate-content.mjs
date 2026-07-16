import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const root = process.cwd();
const collections = ["articles", "products", "projects", "pages"];
const required = {
  articles: ["title", "slug", "excerpt", "publishedAt", "updatedAt", "author", "category", "featuredImage", "featuredImageAlt", "seoTitle", "seoDescription"],
  products: ["title", "slug", "category", "materialType", "applications", "advantages", "limitations", "orderingSteps", "excerpt", "featuredImage", "featuredImageAlt", "status", "quoteCta", "publishedAt", "updatedAt", "seoTitle", "seoDescription"],
  projects: ["title", "slug", "completedAt", "materialType", "thickness", "workItems", "customerRequirement", "process", "result", "featuredImage", "featuredImageAlt", "quoteCta", "publishedAt", "updatedAt", "seoTitle", "seoDescription"],
  pages: ["title", "slug", "eyebrow", "excerpt", "materialTypes", "workItems", "process", "fileGuidance", "featuredImage", "featuredImageAlt", "quoteCta", "publishedAt", "updatedAt", "seoTitle", "seoDescription"]
};

const issues = [];
const slugs = new Map();
const allEntries = [];

for (const collection of collections) {
  const folder = path.join(root, "content", collection);
  for (const file of fs.readdirSync(folder).filter((name) => /\.mdx?$/.test(name))) {
    const relative = path.join("content", collection, file);
    const parsed = matter(fs.readFileSync(path.join(root, relative), "utf8"));
    const data = parsed.data;
    allEntries.push({ collection, relative, data });
    for (const field of required[collection]) {
      if (data[field] === undefined || data[field] === "" || (Array.isArray(data[field]) && data[field].length === 0)) issues.push(`${relative}: thiếu field bắt buộc '${field}'`);
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.slug || "")) issues.push(`${relative}: slug không hợp lệ`);
    if (path.basename(file, path.extname(file)) !== data.slug) issues.push(`${relative}: tên file phải trùng slug '${data.slug}'`);
    if ((data.seoTitle || "").length < 20 || (data.seoTitle || "").length > 65) issues.push(`${relative}: SEO title phải dài 20–65 ký tự`);
    if ((data.seoDescription || "").length < 80 || (data.seoDescription || "").length > 170) issues.push(`${relative}: SEO description phải dài 80–170 ký tự`);
    if (data.canonical && !String(data.canonical).startsWith("https://mdftungphat.com/")) issues.push(`${relative}: canonical phải thuộc https://mdftungphat.com`);
    if (!data.draft && data.noindex) issues.push(`${relative}: nội dung published đang bật noindex; cần xác nhận chủ ý`);
    if (!data.draft && !parsed.content.trim()) issues.push(`${relative}: nội dung published không có body`);
    const namespace = collection === "articles" ? `/bai-viet/${data.slug}` : collection === "projects" ? `/du-an/${data.slug}` : `/${data.slug}`;
    if (slugs.has(namespace)) issues.push(`${relative}: URL trùng với ${slugs.get(namespace)} (${namespace})`); else slugs.set(namespace, relative);
  }
}

const productSlugs = new Set(allEntries.filter((entry) => entry.collection === "products").map((entry) => entry.data.slug));
const articleSlugs = new Set(allEntries.filter((entry) => entry.collection === "articles").map((entry) => entry.data.slug));
for (const entry of allEntries) {
  for (const slug of entry.data.relatedProducts || []) if (!productSlugs.has(slug)) issues.push(`${entry.relative}: relatedProducts không tồn tại '${slug}'`);
  for (const slug of entry.data.relatedArticles || []) if (!articleSlugs.has(slug)) issues.push(`${entry.relative}: relatedArticles không tồn tại '${slug}'`);
  for (const field of [entry.data.featuredImage, ...(entry.data.gallery || []), ...(entry.data.beforeImages || []), ...(entry.data.afterImages || [])]) {
    if (field && !fs.existsSync(path.join(root, "public", String(field).replace(/^\//, "")))) issues.push(`${entry.relative}: ảnh không tồn tại '${field}'`);
  }
}

if (issues.length) {
  console.error(`Content validation thất bại (${issues.length} lỗi):\n- ${issues.join("\n- ")}`);
  process.exit(1);
}
console.log(`Content validation pass: ${allEntries.length} entries, ${slugs.size} URL duy nhất.`);
