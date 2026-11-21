import sanitizeHtml from 'sanitize-html';
import { decodeHTML } from 'entities';
const mapping = [[10,'mdf-thuong-va-chong-am'],[11,'chuan-bi-file-cnc'],[12,'go-ghep-la-gi']];
const text = s => decodeHTML(sanitizeHtml(s || '',{allowedTags:[],allowedAttributes:{}})).replace(/\s+/g,' ').trim();
export function auditArticles(source,posts,manifest) {
  const blockers=[]; const articles=[];
  for (const [id,slug] of mapping) {
    const src=source.filter(x=>x.slug===slug), live=posts.filter(x=>x.id===id);
    if (src.length!==1 || live.length!==1 || live[0].slug!==slug || live[0].status!=='publish') throw Error(`invalid mapping for ${id} ${slug}`);
    const a=src[0],p=live[0];
    const featured=a.featuredImage;
    const rows=manifest.split(/\r?\n/).filter(line=>line.startsWith(`${featured},`));
    const approved=rows.length===1 && /,APPROVED\s*$/.test(rows[0]);
    if (!featured || !approved) blockers.push(`${id}: featured image missing or rights not APPROVED (${featured || 'empty'})`);
    else blockers.push(`${id}: featured image requires verified local file, metadata and WordPress media mapping (${featured})`);
    const differences=[];
    if(text(p.title?.rendered)!==text(a.title)) differences.push('title');
    if(text(p.excerpt?.rendered)!==text(a.excerpt)) differences.push('excerpt');
    if((p.date_gmt || '').slice(0,10)!==a.publishedAt) differences.push('date');
    if(!p.featured_media) differences.push('featured_media');
    if((p.tungphat_seo?.title || '')!==a.seoTitle || (p.tungphat_seo?.description || '')!==a.seoDescription) differences.push('SEO');
    if(a.faq?.length) differences.push('FAQ mapping unavailable');
    if(a.relatedProducts?.length || a.relatedArticles?.length) differences.push('related mapping unavailable');
    differences.push('body, figures, author and modified date require full parity comparison');
    articles.push({id,slug,sourcePath:a.sourcePath,featuredImage:featured,featuredRights:approved?'APPROVED':'UNVERIFIED',differences});
  }
  blockers.push('SVG figure is rejected by WordPress sanitizer; use a verified safe representation');
  blockers.push('FAQ and related data are not mapped by WordPress provider');
  blockers.push('WordPress compare-and-replace adapter and complete post/media rollback are not implemented');
  return {articles,blockers};
}
