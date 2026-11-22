import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
const repo = fileURLToPath(new URL('../', import.meta.url));
const mode = process.argv[2] || 'plan';
if (!['plan', 'apply', 'restore'].includes(mode)) throw new Error('Use plan, apply or restore');
const manifest = JSON.parse(fs.readFileSync(path.join(repo, 'payload-cms/gateway/media-archive-manifest.json')));
const backup = path.join(repo, 'backups/cloudflare-exit-20261031/media');
const metadataFile = path.join(repo, 'backups/cloudflare-exit-20261101/archive-object-metadata.json');
const local = new URL(process.env.R2_ARCHIVE_LOCAL_URL || 'http://127.0.0.1:8793');
if (!['127.0.0.1', 'localhost'].includes(local.hostname)) throw new Error('Maintenance transport must remain on loopback');
const localURL = key => `${local.origin}/?key=${encodeURIComponent(key)}`;
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const metadata = fs.existsSync(metadataFile) ? JSON.parse(fs.readFileSync(metadataFile)) : {};
const results = [];
if (mode === 'apply') {
  for (const file of ['archive-http-verification.json', 'archive-gateway-preview-verification.json']) {
    const evidence = JSON.parse(fs.readFileSync(path.join(repo, 'reports/cloudflare-blockers', file)));
    if (evidence.failed || evidence.passed !== manifest.objects.length) throw new Error('Complete direct and preview archive verification required');
    for (const object of manifest.objects) if (!evidence.results.some(r => r.key === object.key && r.sha256 === object.sha256 && r.passed)) throw new Error('Archive evidence does not match manifest');
  }
}
for (const object of manifest.objects) {
  const source = path.resolve(backup, object.key);
  if (!source.startsWith(backup + path.sep) || path.basename(object.key).split('.')[0] !== object.sha256) throw new Error('Expected immutable content-addressed key');
  const bytes = fs.readFileSync(source);
  if (bytes.length !== object.bytes || hash(bytes) !== object.sha256) throw new Error('Backup changed');
  const head = await (await fetch(localURL(object.key))).json();
  if (head && (head.etag !== object.etag || head.size !== object.bytes)) throw new Error(`Remote object changed: ${object.key}`);
  if (head) metadata[object.key] = { httpMetadata: head.httpMetadata, customMetadata: head.customMetadata };
  fs.mkdirSync(path.dirname(metadataFile), { recursive: true });
  fs.writeFileSync(metadataFile, JSON.stringify(metadata, null, 2), { mode: 0o600 });
  if (mode === 'restore' && !head) {
    const response = await fetch(localURL(object.key), { method: 'PUT', headers: { 'X-R2-Metadata': JSON.stringify(metadata[object.key] || { contentType: 'image/jpeg' }) }, body: bytes });
    if (response.status !== 201) throw new Error(`Restore rejected HTTP ${response.status}`);
  }
  if (mode === 'apply' && head) {
    const removed = await fetch(localURL(object.key), { method: 'DELETE' });
    if (removed.status !== 204) throw new Error(`Offload rejected HTTP ${removed.status}`);
    // Every deletion is a canary: verify the unchanged production URL immediately.
    const response = await fetch(`https://cdn.mdftungphat.com/${object.key}?archiveVerify=${Date.now()}`, { signal: AbortSignal.timeout(90000) });
    const delivered = Buffer.from(await response.arrayBuffer());
    if (!response.ok || delivered.length !== object.bytes || hash(delivered) !== object.sha256) {
      const restored = await fetch(localURL(object.key), { method: 'PUT', headers: { 'X-R2-Metadata': JSON.stringify(metadata[object.key]) }, body: bytes });
      throw new Error(`CDN verification failed; immediate restore HTTP ${restored.status}`);
    }
  }
  results.push({ key: object.key, bytes: object.bytes, mode, existed: Boolean(head), passed: true });
  fs.writeFileSync(path.join(repo, `reports/cloudflare-blockers/r2-archive-${mode}.json`), JSON.stringify({ checkedAt: new Date().toISOString(), objects: results.length, bytes: results.reduce((s, r) => s + r.bytes, 0), results }, null, 2));
}
console.log(JSON.stringify({ mode, objects: results.length, bytes: results.reduce((sum, object) => sum + object.bytes, 0) }));
