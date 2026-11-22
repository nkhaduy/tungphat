/** Local-only migration trial. The source fixture is not a CMS/media backup. */
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { chromium } from "playwright";

const apply = process.argv.includes("--apply");
const origin = "http://127.0.0.1:9400";
const fixture = JSON.parse(await fs.readFile("docs/release-and-wordpress-migration-2026-11/fixtures/final-payload-articles.json", "utf8"));
const slugs = ["mdf-thuong-va-chong-am", "chuan-bi-file-cnc", "go-ghep-la-gi"];
const articles = slugs.map((slug) => {
  const post = fixture.find((item) => item.slug === slug);
  if (!post) throw new Error(`Missing fixture: ${slug}`);
  return { slug, title: post.title, excerpt: post.excerpt, date: post.publishedAt, category: post.category, tags: post.tags, html: renderToStaticMarkup(React.createElement(ReactMarkdown, { remarkPlugins: [remarkGfm] }, post.body)) };
});
if (!apply) {
  console.log(JSON.stringify({ mode: "dry-run", target: origin, articles: articles.map(({ slug, title, category }) => ({ slug, title, category })), limitations: ["featured media", "frontend figures", "SEO fields"] }, null, 2));
  process.exit(0);
}
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });
try {
  const page = await browser.newPage();
  // Never follow an unexpected redirect outside this local origin.
  await page.route("**/*", (route) => {
    const url = new URL(route.request().url());
    return url.origin === origin ? route.continue() : route.abort();
  });
  await page.goto(`${origin}/wp-admin/post-new.php`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.wp?.blocks?.rawHandler && window.wp?.apiFetch, null, { timeout: 60000 });
  const existing = await page.evaluate(async (items) => {
    const output = [];
    for (const item of items) output.push(...await window.wp.apiFetch({ path: `/wp/v2/posts?status=any&context=edit&slug=${encodeURIComponent(item.slug)}` }));
    return output;
  }, articles);
  const backupDir = path.join(os.homedir(), ".wordpress-playground", "tungphat-backups");
  await fs.mkdir(backupDir, { recursive: true, mode: 0o700 });
  const backup = path.join(backupDir, `articles-${Date.now()}.json`);
  await fs.writeFile(backup, JSON.stringify(existing, null, 2), { mode: 0o600, flag: "wx" });
  const results = await page.evaluate(async (items) => {
    const wp = window.wp;
    async function term(taxonomy, name) {
      const candidates = await wp.apiFetch({ path: `/wp/v2/${taxonomy}?search=${encodeURIComponent(name)}&per_page=100` });
      const exact = candidates.filter((candidate) => candidate.name === name);
      if (exact.length > 1) throw new Error(`Duplicate term: ${name}`);
      return exact[0] || await wp.apiFetch({ path: `/wp/v2/${taxonomy}`, method: "POST", data: { name } });
    }
    const result = [];
    for (const item of items) {
      const posts = await wp.apiFetch({ path: `/wp/v2/posts?status=any&context=edit&slug=${encodeURIComponent(item.slug)}` });
      if (posts.length > 1) throw new Error(`Duplicate slug: ${item.slug}`);
      const category = await term("categories", item.category);
      const tags = [];
      for (const name of item.tags) tags.push((await term("tags", name)).id);
      const blocks = wp.blocks.rawHandler({ HTML: item.html });
      const content = wp.blocks.serialize(blocks);
      if (!content.trim()) throw new Error(`Empty block conversion: ${item.slug}`);
      const prior = posts[0];
      const sameIds = (left, right) => JSON.stringify([...(left || [])].sort((a, b) => a - b)) === JSON.stringify([...right].sort((a, b) => a - b));
      const unchanged = prior && prior.status === "publish" && prior.title.raw === item.title && prior.excerpt.raw === item.excerpt && prior.content.raw === content && prior.date === `${item.date}T12:00:00` && sameIds(prior.categories, [category.id]) && sameIds(prior.tags, tags);
      const post = unchanged ? prior : await wp.apiFetch({ path: prior ? `/wp/v2/posts/${prior.id}` : "/wp/v2/posts", method: "POST", data: { slug: item.slug, title: item.title, excerpt: item.excerpt, content, date: `${item.date}T12:00:00`, status: "publish", categories: [category.id], tags } });
      if (post.slug !== item.slug || post.status !== "publish") throw new Error(`Unexpected publication state: ${item.slug}`);
      result.push({ slug: post.slug, id: post.id, status: post.status, blocks: blocks.length, action: unchanged ? "unchanged" : prior ? "updated" : "created" });
    }
    return result;
  }, articles);
  const mapping = path.join(backupDir, `mapping-${Date.now()}.json`);
  await fs.writeFile(mapping, JSON.stringify(results.map((item) => ({ payloadSource: `payload://articles/${item.slug}`, wordpressId: item.id, slug: item.slug })), null, 2), { mode: 0o600, flag: "wx" });
  console.log(JSON.stringify({ mode: "apply", target: origin, backup, mapping, results, limitations: ["featured media not imported", "frontend-added figures not imported", "SEO fields not imported", "parity not established"] }, null, 2));
} finally { await browser.close(); }
