import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const repo = fileURLToPath(new URL('../', import.meta.url));
const backup = path.resolve(process.argv[2] || path.join(repo, 'backups/cloudflare-exit-20261031/media'));
const output = path.resolve(process.argv[3] || path.join(repo, 'reports/cloudflare-blockers/media-archive'));
const manifest = JSON.parse(fs.readFileSync(path.join(repo, 'payload-cms/gateway/media-archive-manifest.json'), 'utf8'));
for (const object of manifest.objects) {
  const source = path.resolve(backup, object.key);
  const destination = path.resolve(output, object.key);
  if (!source.startsWith(backup + path.sep) || !destination.startsWith(output + path.sep)) throw new Error('Unsafe archive key');
  const bytes = fs.readFileSync(source);
  if (bytes.length !== object.bytes || bytes.length >= 24 * 1024 * 1024 || createHash('sha256').update(bytes).digest('hex') !== object.sha256) throw new Error(`Backup verification failed: ${object.key}`);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, bytes);
}
fs.writeFileSync(path.join(output, '404.html'), '<!doctype html><title>Not found</title><h1>Not found</h1>');
fs.writeFileSync(path.join(output, '_headers'), '/*\n  Cache-Control: public, max-age=31536000, immutable\n  X-Robots-Tag: noindex, nofollow\n  X-Content-Type-Options: nosniff\n');
fs.writeFileSync(path.join(output, 'wrangler.jsonc'), JSON.stringify({ name: 'tungphat-media-archive', pages_build_output_dir: '.', compatibility_date: '2026-10-01' }, null, 2));
fs.writeFileSync(path.join(output, '.assetsignore'), 'wrangler.jsonc\n.assetsignore\n');
console.log(JSON.stringify({ files: manifest.objects.length, bytes: manifest.objects.reduce((sum, o) => sum + o.bytes, 0), output }));
