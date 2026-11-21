/** Creates separate local drafts; never alters published baseline posts. */
import fs from 'node:fs/promises';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { chromium } from 'playwright';
const origin='http://127.0.0.1:9400';
const fixture=JSON.parse(await fs.readFile('docs/release-and-wordpress-migration-2026-11/fixtures/final-payload-articles.json','utf8'));
const slugs=['mdf-thuong-va-chong-am','chuan-bi-file-cnc','go-ghep-la-gi'];
const items=await Promise.all(slugs.map(async slug=>{const source=fixture.find(p=>p.slug===slug); const markdown=await fs.readFile(`docs/phase9-editorial-experience/drafts/${slug}.md`,'utf8');return {slug:`${slug}-bien-tap-phase9`,title:`${source.title} — bản biên tập`,html:renderToStaticMarkup(React.createElement(ReactMarkdown,{remarkPlugins:[remarkGfm]},markdown))};}));
if (!process.argv.includes('--apply')) {console.log(JSON.stringify(items.map(({slug,title})=>({slug,title}))));process.exit(0)}
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
try { const page=await browser.newPage();await page.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort()); await page.goto(`${origin}/wp-admin/post-new.php`);await page.waitForFunction(()=>window.wp?.blocks?.rawHandler&&window.wp?.apiFetch,null,{timeout:60000});const output=await page.evaluate(async items=>{let out=[];for(const item of items){let found=await wp.apiFetch({path:`/wp/v2/posts?status=any&context=edit&slug=${encodeURIComponent(item.slug)}`});if(found.length)throw new Error(`Draft already exists: ${item.slug}`);let content=wp.blocks.serialize(wp.blocks.rawHandler({HTML:item.html}));let post=await wp.apiFetch({path:'/wp/v2/posts',method:'POST',data:{title:item.title,slug:item.slug,status:'draft',content}});out.push({id:post.id,slug:post.slug,status:post.status})}return out},items);console.log(JSON.stringify(output,null,2));} finally {await browser.close()}
