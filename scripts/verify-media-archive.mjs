import fs from 'node:fs';
import { createHash } from 'node:crypto';
const repo = new URL('../', import.meta.url);
const manifest = JSON.parse(fs.readFileSync(new URL('payload-cms/gateway/media-archive-manifest.json', repo), 'utf8'));
const origin = process.env.MEDIA_ARCHIVE_TEST_ORIGIN || manifest.origin;
const pending = [...manifest.objects];
const results = [];
await Promise.all(Array.from({ length: 3 }, async () => {
  while (pending.length) {
    const object = pending.shift();
    try {
      const response = await fetch(`${origin}/${object.key}`, { signal: AbortSignal.timeout(120000) });
      const hash = createHash('sha256'); let bytes = 0;
      for await (const chunk of response.body) { hash.update(chunk); bytes += chunk.length; }
      const sha256 = hash.digest('hex');
      results.push({ key: object.key, status: response.status, bytes, sha256, passed: response.status === 200 && bytes === object.bytes && sha256 === object.sha256 });
    } catch (e) { results.push({ key: object.key, passed: false, error: e.name }); }
  }
}));
const report = { checkedAt: new Date().toISOString(), origin, passed: results.filter(x => x.passed).length, failed: results.filter(x => !x.passed).length, results };
fs.writeFileSync(new URL(process.env.MEDIA_ARCHIVE_REPORT || 'reports/cloudflare-blockers/archive-http-verification.json', repo), JSON.stringify(report, null, 2));
console.log(JSON.stringify({ passed: report.passed, failed: report.failed }));
if (report.failed) process.exitCode = 1;
