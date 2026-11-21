/** Read-only asset preflight. This is not an importer and cannot apply or roll back. */
import { readFile, realpath } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import sharp from 'sharp';

export async function inspectAsset(root, assetPath, manifest) {
  if (!/^\/(?:sanpham-media|images\/editorial)\/[a-z0-9-]+\.(?:webp|svg)$/.test(assetPath)) return { ok: false, reason: 'invalid asset path' };
  const url = `https://mdftungphat.com${assetPath}`;
  const rows = manifest.split(/\r?\n/).filter((line) => line.startsWith(`${url},`));
  if (rows.length !== 1 || !/,APPROVED\s*$/.test(rows[0])) return { ok: false, reason: 'exact URL not uniquely approved' };
  try {
    const base = await realpath(root);
    const file = await realpath(path.join(base, assetPath.slice(1)));
    if (!file.startsWith(`${base}${path.sep}`)) return { ok: false, reason: 'asset escapes public root' };
    const bytes = await readFile(file);
    const meta = await sharp(bytes, { limitInputPixels: 40000000 }).metadata();
    if (!meta.width || !meta.height || meta.format !== (assetPath.endsWith('.svg') ? 'svg' : 'webp')) return { ok: false, reason: 'invalid image format or dimensions' };
    await sharp(bytes, { limitInputPixels: 40000000 }).resize({ width: 8 }).raw().toBuffer();
    return { ok: true, width: meta.width, height: meta.height, sha256: createHash('sha256').update(bytes).digest('hex') };
  } catch (error) {
    return { ok: false, reason: error.code === 'ENOENT' ? 'missing asset' : 'image cannot be decoded' };
  }
}

async function main() {
  if (process.argv.slice(2).length) throw new Error('Read-only preflight only; import, apply and rollback are not implemented');
  const root = process.cwd();
  const fixture = JSON.parse(await readFile(path.join(root, 'docs/release-and-wordpress-migration-2026-11/fixtures/final-payload-articles.json'), 'utf8'));
  const manifest = await readFile(path.join(root, 'docs/search-ai-visibility-2026-11/phase5/RELEASE_ASSET_RIGHTS.csv'), 'utf8');
  const specs = [
    ['mdf-thuong-va-chong-am', ['/sanpham-media/van-mdf.webp','/sanpham-media/van-mdf-400.webp','/sanpham-media/van-mdf-800.webp','/sanpham-media/mdf-chong-am.webp','/sanpham-media/mdf-chong-am-400.webp','/sanpham-media/mdf-chong-am-800.webp']],
    ['chuan-bi-file-cnc', ['/images/editorial/ban-ve-cnc-minh-hoa.svg']],
    ['go-ghep-la-gi', ['/sanpham-media/go-ghep-cao-su.webp','/sanpham-media/go-ghep-cao-su-400.webp','/sanpham-media/go-ghep-cao-su-800.webp']],
  ];
  const assets = [];
  for (const [slug, paths] of specs) {
    const found = fixture.filter((article) => article.slug === slug);
    if (found.length !== 1) throw new Error(`Missing or duplicate source: ${slug}`);
    for (const assetPath of paths) {
      if (!found[0].renderedArticleHtml.includes(assetPath)) throw new Error(`Source does not reference ${assetPath}`);
      assets.push({ slug, assetPath, ...await inspectAsset(path.join(root, 'public'), assetPath, manifest) });
    }
  }
  console.log(JSON.stringify({ mode: 'read-only-preflight', assets, blockers: ['Featured image CDN rights not established', 'SVG sanitizer rejects CNC diagram', 'WordPress provider does not map FAQ or related content', 'Parity import and rollback not implemented'] }, null, 2));
  // Known parity blockers make the migration unconditionally ineligible to apply.
  process.exitCode = 1;
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) main().catch((error) => { console.error(error.message); process.exitCode = 1; });
