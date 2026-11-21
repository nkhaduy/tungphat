import { afterEach, describe, expect, it } from 'vitest';
import { mkdtemp, mkdir, readFile, readlink, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:http';
import { spawnSync } from 'node:child_process';
import { runCycle, fetchSnapshot, copySource } from '../scripts/wordpress/publishing-worker.mjs';

const dirs: string[] = [];
afterEach(async () => { await Promise.all(dirs.splice(0).map((p) => rm(p, { recursive: true, force: true }))); });
async function setup() { const dir = await mkdtemp(join(tmpdir(), 'wp-worker-test-')); dirs.push(dir); return dir; }
const snapshot = (title: string) => [{ id: 1, slug: 'example', status: 'publish', title }];
async function build(path: string, posts: unknown[]) { await mkdir(path, { recursive: true }); await writeFile(join(path, 'index.html'), JSON.stringify(posts)); }

describe('local publishing worker', () => {
  it('serves the captured post snapshot to build fetches even if WordPress is unavailable', async () => {
    const dir = await setup(); const file = join(dir, 'snapshot.json'); await writeFile(file, JSON.stringify(snapshot('captured')));
    const script = `fetch('http://127.0.0.1:9400/wp-json/wp/v2/posts?status=publish&per_page=100&page=1&_embed=1').then(async r => console.log(r.headers.get('x-wp-totalpages'), (await r.json())[0].title)).catch(() => process.exit(2))`;
    const result = spawnSync(process.execPath, ['--require', join(process.cwd(), 'scripts/wordpress/snapshot-fetch.cjs'), '-e', script], { encoding: 'utf8', env: { ...process.env, WP_BUILD_SNAPSHOT: file, WORDPRESS_BASE_URL: 'http://127.0.0.1:9400' } });
    expect(result.status).toBe(0); expect(result.stdout.trim()).toBe('1 captured');
  });
  it('copies only build inputs and excludes private files and unrelated directories', async () => {
    const dir = await setup(); const src = join(dir, 'input'); const dest = join(dir, 'copy');
    for (const part of ['app', 'data', 'backups', 'reports', 'quote-app', '.wrangler']) await mkdir(join(src, part), { recursive: true });
    for (const file of ['app/page.tsx', 'data/posts.json', 'app/.env.local', 'data/token.json', 'backups/archive', 'reports/report', 'quote-app/secret', '.wrangler/state']) await writeFile(join(src, file), file);
    await writeFile(join(src, 'package.json'), '{}');
    await copySource(src, dest);
    expect(await readFile(join(dest, 'app/page.tsx'), 'utf8')).toBe('app/page.tsx');
    for (const file of ['app/.env.local', 'data/token.json', 'backups/archive', 'reports/report', 'quote-app/secret', '.wrangler/state']) await expect(readFile(join(dest, file))).rejects.toMatchObject({ code: 'ENOENT' });
  });
  it('activates new content, skips duplicates, and survives restart', async () => {
    const dir = await setup(); let posts = snapshot('first'); let builds = 0;
    const opts = { stateDir: dir, snapshot: async () => posts, build: async (path: string, items: unknown[]) => { builds++; await build(path, items); } };
    expect(await runCycle(opts)).toBe('published');
    expect(await readFile(join(dir, 'current', 'index.html'), 'utf8')).toContain('first');
    expect(await runCycle(opts)).toBe('unchanged');
    posts = snapshot('updated');
    expect(await runCycle(opts)).toBe('published');
    expect(await readFile(join(dir, 'current', 'index.html'), 'utf8')).toContain('updated');
    expect(builds).toBe(2);
    expect(await runCycle({ ...opts })).toBe('unchanged');
  });
  it('keeps the last good release after build failure and retries', async () => {
    const dir = await setup(); let posts = snapshot('first');
    const opts = { stateDir: dir, snapshot: async () => posts, build };
    await runCycle(opts); const before = await readlink(join(dir, 'current')); posts = snapshot('second');
    await expect(runCycle({ ...opts, build: async () => { throw new Error('failed build'); } })).rejects.toThrow('failed build');
    expect(JSON.parse(await readFile(join(dir, 'job.json'), 'utf8'))).toMatchObject({ state: 'failed', attempts: 1 });
    expect(await readlink(join(dir, 'current'))).toBe(before);
    expect(await runCycle(opts)).toBe('published');
    expect(JSON.parse(await readFile(join(dir, 'job.json'), 'utf8'))).toMatchObject({ state: 'published', attempts: 0 });
    expect(await readFile(join(dir, 'current', 'index.html'), 'utf8')).toContain('second');
  });
  it('does not activate a build when source changed while building', async () => {
    const dir = await setup(); let posts = snapshot('first');
    const opts = { stateDir: dir, snapshot: async () => posts, build };
    await runCycle(opts); const before = await readlink(join(dir, 'current')); posts = snapshot('second');
    await expect(runCycle({ ...opts, build: async (path: string, items: unknown[]) => { await build(path, items); posts = snapshot('third'); } })).rejects.toThrow(/changed/i);
    expect(await readlink(join(dir, 'current'))).toBe(before);
    expect(await runCycle(opts)).toBe('published');
  });
  it('refuses overlapping worker cycles', async () => {
    const dir = await setup(); await mkdir(join(dir, 'lock'));
    await expect(runCycle({ stateDir: dir, snapshot: async () => [], build })).rejects.toThrow(/lock/i);
  });
  it('recovers a dead polling lock but refuses an interrupted build lock', async () => {
    const dir = await setup(); const lock = join(dir, 'lock'); await mkdir(lock);
    await writeFile(join(lock, 'owner.json'), JSON.stringify({ pid: 2147483647, phase: 'polling' }));
    const opts = { stateDir: dir, snapshot: async () => snapshot('a'), build };
    expect(await runCycle(opts)).toBe('published');
    await mkdir(lock); await writeFile(join(lock, 'owner.json'), JSON.stringify({ pid: 2147483647, phase: 'building' }));
    await expect(runCycle(opts)).rejects.toThrow(/lock/i);
  });
  it('reconciles public removals and retries after REST outages', async () => {
    const dir = await setup(); let posts = snapshot('public'); let offline = false;
    const opts = { stateDir: dir, snapshot: async () => { if (offline) throw new Error('REST offline'); return posts; }, build };
    await runCycle(opts); const before = await readlink(join(dir, 'current'));
    offline = true;
    await expect(runCycle(opts)).rejects.toThrow('REST offline');
    expect(await readlink(join(dir, 'current'))).toBe(before);
    offline = false; posts = [];
    expect(await runCycle(opts)).toBe('published');
    expect(JSON.parse(await readFile(join(dir, 'current', 'index.html'), 'utf8'))).toEqual([]);
  });
  it('reads all public REST pages and rejects failures and remote hosts', async () => {
    const server = createServer((req, res) => { const url = new URL(req.url!, 'http://localhost'); res.setHeader('X-WP-TotalPages', '2'); res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(url.searchParams.get('page') === '1' ? snapshot('first') : [{ id: 2, slug: 'other', status: 'publish' }])); });
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    try { const address = server.address(); if (!address || typeof address === 'string') throw new Error('missing address');
      expect(await fetchSnapshot(`http://127.0.0.1:${address.port}`)).toHaveLength(2);
      await expect(fetchSnapshot('https://mdftungphat.com')).rejects.toThrow(/loopback/i);
    } finally { await new Promise<void>((resolve) => server.close(() => resolve())); }
  });
  it('fails closed on missing pagination headers and duplicate posts', async () => {
    let mode = 'header';
    const server = createServer((_req, res) => {
      if (mode === 'duplicate') res.setHeader('X-WP-TotalPages', '1');
      res.end(JSON.stringify(mode === 'duplicate' ? [...snapshot('one'), ...snapshot('two')] : []));
    });
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    try {
      const address = server.address(); if (!address || typeof address === 'string') throw new Error('missing address');
      const url = `http://127.0.0.1:${address.port}`;
      await expect(fetchSnapshot(url)).rejects.toThrow(/pagination/i);
      mode = 'duplicate'; await expect(fetchSnapshot(url)).rejects.toThrow(/duplicate/i);
    } finally { await new Promise<void>((resolve) => server.close(() => resolve())); }
  });
});
