#!/usr/bin/env node
// Local, single-host polling publisher. No webhook or production deployment.
import { createHash, randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { access, copyFile, mkdir, readFile, readlink, rename, rm, symlink, writeFile, realpath, statfs } from 'node:fs/promises';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const stable = (value) => Array.isArray(value) ? value.map(stable) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])])) : value;
const digest = (posts) => createHash('sha256').update(JSON.stringify(stable([...posts].sort((a, b) => a.id - b.id)))).digest('hex');
const sourceInputs = ['app', 'components', 'lib', 'data', 'public', 'content', 'config', 'schemas', 'next.config.mjs', 'next-env.d.ts', 'package.json', 'package-lock.json', 'tsconfig.json', 'tailwind.config.ts', 'postcss.config.mjs'];
const secretExcludes = ['.env*', '.dev.vars*', '.npmrc', '.netrc', '.ssh', '.aws', '*.pem', '*.key', '*secret*', '*token*', '*credential*'];
const dependencyExcludes = ['.env*', '.dev.vars*', '.npmrc', '.netrc', '.ssh', '.aws', '*.pem', '*.key', 'token.json', 'credentials.json', 'secrets.json'];

export async function copySource(source, dest) {
  await mkdir(dest, { recursive: true });
  const inputs = [];
  for (const name of sourceInputs) { try { await access(join(source, name)); inputs.push(name); } catch (error) { if (error.code !== 'ENOENT') throw error; } }
  await command('rsync', ['-a', '--safe-links', ...secretExcludes.map((item) => `--exclude=${item}`), '--', ...inputs, `${dest}/`], { cwd: source });
}

async function writeJson(path, data) {
  const temp = `${path}.${randomUUID()}.tmp`;
  try { await writeFile(temp, JSON.stringify(data), { mode: 0o600 }); await rename(temp, path); } finally { await rm(temp, { force: true }); }
}
async function readJob(stateDir) {
  try { return JSON.parse(await readFile(join(stateDir, 'job.json'), 'utf8')); } catch (error) { if (error.code === 'ENOENT') return {}; throw error; }
}
async function acquireLock(stateDir) {
  const lock = join(stateDir, 'lock');
  try { await mkdir(lock); return lock; } catch (error) { if (error.code !== 'EEXIST') throw error; }
  const guard = join(stateDir, 'lock-recovery');
  try { await mkdir(guard); } catch { throw new Error('Worker lock exists; recovery already in progress'); }
  try {
    let owner;
    try { owner = JSON.parse(await readFile(join(lock, 'owner.json'), 'utf8')); } catch { throw new Error('Worker lock exists; owner unknown'); }
    if (!Number.isSafeInteger(owner.pid) || owner.pid <= 0 || owner.phase !== 'polling') throw new Error('Worker lock exists; build may still be running');
    try { process.kill(owner.pid, 0); throw new Error('Worker lock exists; owner still alive'); } catch (error) { if (error.code !== 'ESRCH') throw error; }
    const stale = join(stateDir, `.stale-lock-${randomUUID()}`);
    await rename(lock, stale);
    await rm(stale, { recursive: true, force: true });
    try { await mkdir(lock); } catch { throw new Error('Worker lock exists; another worker acquired it'); }
    return lock;
  } finally { await rm(guard, { recursive: true, force: true }); }
}

export async function fetchSnapshot(baseUrl) {
  const url = new URL(baseUrl);
  if (url.protocol !== 'http:' || url.hostname !== '127.0.0.1' || url.username || url.password || url.search || url.hash || (url.pathname !== '/' && url.pathname !== '')) throw new Error('WordPress must be an HTTP 127.0.0.1 loopback origin');
  const posts = []; let total = 1; const ids = new Set(); const slugs = new Set();
  for (let page = 1; page <= total; page++) {
    const endpoint = new URL('/wp-json/wp/v2/posts', url);
    endpoint.search = new URLSearchParams({ status: 'publish', per_page: '100', page: String(page), _embed: '1' }).toString();
    const response = await fetch(endpoint, { redirect: 'error', signal: AbortSignal.timeout(15000), headers: { Cookie: 'playground_auto_login_already_happened=1' } });
    if (!response.ok) throw new Error(`WordPress HTTP ${response.status}`);
    const header = response.headers.get('x-wp-totalpages');
    if (header === null || !/^\d+$/.test(header)) throw new Error('Missing or invalid pagination');
    const count = Number(header);
    if (count > 50 || (page > 1 && count !== total)) throw new Error('Inconsistent pagination');
    total = count;
    const data = await response.json();
    if (!Array.isArray(data) || (total === 0 && data.length)) throw new Error('Invalid posts response');
    for (const post of data) {
      if (!post || !Number.isSafeInteger(post.id) || post.id <= 0 || typeof post.slug !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(post.slug) || post.status !== 'publish' || ids.has(post.id) || slugs.has(post.slug)) throw new Error('Invalid or duplicate public post');
      ids.add(post.id); slugs.add(post.slug); posts.push(post);
    }
  }
  return posts;
}

async function currentHash(stateDir) {
  try {
    const target = await readlink(join(stateDir, 'current'));
    if (!/^releases\/[-a-f0-9]+\/out$/.test(target)) throw new Error('Invalid current release link');
    const manifest = JSON.parse(await readFile(join(stateDir, dirname(target), 'manifest.json'), 'utf8'));
    if (!/^[a-f0-9]{64}$/.test(manifest.hash)) throw new Error('Invalid release manifest');
    return manifest.hash;
  } catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}

export async function runCycle({ stateDir, snapshot, build }) {
  await mkdir(stateDir, { recursive: true });
  const lock = await acquireLock(stateDir);
  let release;
  let attempts = 0;
  try {
    const owner = { pid: process.pid, started: new Date().toISOString(), phase: 'polling' };
    await writeJson(join(lock, 'owner.json'), owner);
    const previous = await readJob(stateDir); attempts = Number.isSafeInteger(previous.attempts) ? previous.attempts : 0;
    await writeJson(join(stateDir, 'job.json'), { state: 'running', attempts, updated: new Date().toISOString() });
    const posts = await snapshot(); const hash = digest(posts);
    if (hash === await currentHash(stateDir)) { await writeJson(join(stateDir, 'job.json'), { state: 'unchanged', attempts: 0, updated: new Date().toISOString() }); return 'unchanged'; }
    const id = randomUUID(); release = join(stateDir, 'releases', id);
    await mkdir(release, { recursive: true });
    owner.phase = 'building'; await writeJson(join(lock, 'owner.json'), owner);
    await build(join(release, 'out'), posts, release);
    owner.phase = 'polling'; await writeJson(join(lock, 'owner.json'), owner);
    await readFile(join(release, 'out', 'index.html'));
    if (digest(await snapshot()) !== hash) throw new Error('WordPress changed during build; retrying later');
    await writeFile(join(release, 'manifest.json'), JSON.stringify({ hash, created: new Date().toISOString() }));
    const pending = join(stateDir, `.current-${id}`);
    await symlink(`releases/${id}/out`, pending);
    try { await rename(pending, join(stateDir, 'current')); } finally { await rm(pending, { force: true }); }
    release = undefined;
    await writeJson(join(stateDir, 'job.json'), { state: 'published', attempts: 0, updated: new Date().toISOString() });
    return 'published';
  } catch (error) {
    const delay = Math.min(300000, 5000 * 2 ** Math.min(attempts, 6));
    await writeJson(join(stateDir, 'job.json'), { state: 'failed', attempts: attempts + 1, updated: new Date().toISOString(), nextRetryAt: new Date(Date.now() + delay).toISOString(), error: String(error.message).slice(0, 300) });
    throw error;
  } finally {
    if (release) await rm(release, { recursive: true, force: true });
    await rm(lock, { recursive: true, force: true });
  }
}

function command(program, args, options) {
  return new Promise((resolveCommand, reject) => {
    const child = spawn(program, args, { ...options, stdio: 'inherit' });
    child.on('error', reject);
    child.on('close', (code, signal) => code === 0 ? resolveCommand() : reject(new Error(`${program} failed (${signal || code})`)));
  });
}

async function main() {
  const stateArg = process.env.WP_PUBLISH_STATE_DIR;
  const wpUrl = process.env.WORDPRESS_BASE_URL || 'http://127.0.0.1:9400';
  if (!stateArg || !process.argv.includes('--run')) throw new Error('Set WP_PUBLISH_STATE_DIR outside the repository and pass --run');
  // Validate before any build or filesystem mutation.
  const parsed = new URL(wpUrl);
  if (parsed.protocol !== 'http:' || parsed.hostname !== '127.0.0.1' || parsed.username || parsed.password || parsed.search || parsed.hash || parsed.pathname !== '/') throw new Error('Only a local loopback WordPress origin is allowed');
  const stateDir = resolve(stateArg);
  const actualState = await realpath(stateDir); const actualRoot = await realpath(root);
  if (actualState === actualRoot || actualState.startsWith(actualRoot + sep) || actualRoot.startsWith(actualState + sep)) throw new Error('State directory must be outside the repository');
  const interval = Number(process.env.WP_PUBLISH_INTERVAL_MS || 30000);
  if (!Number.isInteger(interval) || interval < 1000) throw new Error('Polling interval must be at least 1000 ms');
  const build = async (out, posts, release) => {
    const space = await statfs(release);
    if (space.bavail * space.bsize < 8 * 1024 ** 3) throw new Error('Insufficient free disk space: 8 GiB required');
    if (process.platform !== 'darwin') throw new Error('Local network sandbox requires macOS sandbox-exec');
    const source = join(release, 'source'); await mkdir(source);
    await copySource(root, source);
    // Dependencies are copied too: a build may write caches inside node_modules.
    await mkdir(join(source, 'node_modules'));
    await command('rsync', ['-a', '--safe-links', ...dependencyExcludes.map((item) => `--exclude=${item}`), `${root}/node_modules/`, `${source}/node_modules/`], {});
    const home = join(release, 'home'); await mkdir(home);
    const snapshotFile = join(release, 'snapshot.json'); const preload = join(release, 'snapshot-fetch.cjs');
    await writeFile(snapshotFile, JSON.stringify(posts), { mode: 0o600 });
    await copyFile(join(root, 'scripts/wordpress/snapshot-fetch.cjs'), preload);
    const env = { PATH: '/usr/bin:/bin:/usr/sbin:/sbin', HOME: home, NODE_ENV: 'production', NODE_OPTIONS: `--require=${JSON.stringify(preload)}`, WP_BUILD_SNAPSHOT: snapshotFile, NEXT_TELEMETRY_DISABLED: '1', BLOG_CONTENT_PROVIDER: 'wordpress', WORDPRESS_BASE_URL: wpUrl, WORDPRESS_ALLOW_LOCAL_HTTP: '1', PAYLOAD_CMS_URL: 'http://127.0.0.1:9', PAYLOAD_PUBLIC_URL: 'http://127.0.0.1:9' };
    const profile = '(version 1)(allow default)(deny network-outbound)(allow network-outbound (remote ip "localhost:*"))';
    await command('/usr/bin/sandbox-exec', ['-p', profile, process.execPath, join(source, 'node_modules/next/dist/bin/next'), 'build'], { cwd: source, env });
    await rename(join(source, 'out'), out);
    await rm(source, { recursive: true, force: true });
  };
  console.log(`Polling ${wpUrl}; output: ${join(actualState, 'current')}`);
  do {
    if (!process.argv.includes('--once')) {
      const job = await readJob(actualState); const wait = Date.parse(job.nextRetryAt || '') - Date.now();
      if (wait > 0) await new Promise((resolveWait) => setTimeout(resolveWait, wait));
    }
    try { console.log(`${new Date().toISOString()} ${await runCycle({ stateDir: actualState, snapshot: () => fetchSnapshot(wpUrl), build })}`); }
    catch (error) { console.error(`${new Date().toISOString()} cycle failed: ${error.message}`); if (process.argv.includes('--once')) process.exitCode = 1; }
    if (process.argv.includes('--once')) break;
    await new Promise((resolveWait) => setTimeout(resolveWait, interval));
  } while (true);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch((error) => { console.error(error.message); process.exitCode = 1; });
