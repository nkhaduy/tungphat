import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const output = process.argv[2] || 'reports/cloudflare-blockers/cpu-baseline.json';
const run = `cf-cpu-${Date.now()}`;
const origin = process.env.CMS_PROFILE_ORIGIN || 'https://tungphat-payload-cms.nkhaduy.workers.dev';
const tailArgs = process.env.CMS_PROFILE_DEPLOYMENT
  ? ['pages', 'deployment', 'tail', process.env.CMS_PROFILE_DEPLOYMENT, '--project-name', 'tungphat-light-cms-production', '--format', 'json']
  : ['tail', '--env', process.env.CMS_PROFILE_ENV || 'production', '--format', 'json'];
const tail = spawn(path.resolve('node_modules/.bin/wrangler'), tailArgs, { cwd: path.resolve(process.env.CMS_PROFILE_DEPLOYMENT ? 'payload-cms/gateway' : 'payload-cms'), stdio: ['ignore', 'pipe', 'pipe'] });
let buffer = '';
const events = [];
const results = [];
let tailError = '';
tail.stderr.on('data', chunk => { tailError += chunk; });
tail.stdout.on('data', chunk => {
  buffer += chunk;
  for (;;) {
    const start = buffer.indexOf('{');
    if (start < 0) return;
    let depth = 0, quoted = false, escaped = false, end = -1;
    for (let i = start; i < buffer.length; i++) {
      const c = buffer[i];
      if (escaped) { escaped = false; continue; }
      if (quoted && c === '\\') { escaped = true; continue; }
      if (c === '"') { quoted = !quoted; continue; }
      if (!quoted && c === '{') depth++;
      if (!quoted && c === '}' && --depth === 0) { end = i + 1; break; }
    }
    if (end < 0) return;
    try {
      const event = JSON.parse(buffer.slice(start, end));
      const url = event.event?.request?.url && new URL(event.event.request.url);
      const label = url?.searchParams.get('cpuProbe');
      if (label?.startsWith(run)) events.push({ label, entrypoint: event.entrypoint, scriptName: event.scriptName, durableObjectId: event.event?.durableObjectId, path: url.pathname, outcome: event.outcome, cpuMs: event.cpuTime, wallMs: event.wallTime, logLevels: event.logs?.map(l => l.level), exceptionNames: event.exceptions?.map(e => e.name), diagnostics: [...(event.exceptions || []).map(e => e.message), ...(event.logs || []).flatMap(l => l.message || [])].flatMap(m => JSON.stringify(m).match(/(?:PBKDF2[^\n]{0,140}|iteration counts[^\n]{0,100}|Cannot[^\\n]{0,100}|no such column: [a-zA-Z0-9_.]+|no column named [a-zA-Z0-9_]+|D1_ERROR:[^\n]{0,100})/gi) || []) });
    } catch { /* Ignore CLI status lines, never persist request headers or logs. */ }
    buffer = buffer.slice(end);
  }
});
await new Promise(resolve => setTimeout(resolve, 7000));
const cases = [
  ['health', '/api/health'], ['login', '/admin/login'], ['products', '/api/products?limit=1&depth=0'],
  ['global', '/api/globals/business-settings?depth=0'], ['media', '/media/catalog/ba-thanh/laminate/p-2052-g-swatch.webp'],
  ['preflight', '/api/contact', { method: 'OPTIONS', headers: { Origin: 'https://mdftungphat.com', 'Access-Control-Request-Method': 'POST' } }],
  ['invalid-contact', '/api/contact', { method: 'POST', headers: { Origin: 'https://mdftungphat.com', 'Content-Type': 'application/json' }, body: '{"consent":false}' }],
  ['unauthenticated-leads', '/api/leads?limit=1&depth=0'],
];
if (process.env.CMS_PROFILE_AUTH_PROBE === '1') cases.splice(0, cases.length, ['bootstrap-probe', '/api/users/first-register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Staging runtime test', email: `probe-${Date.now()}@example.test`, password: crypto.randomUUID() + crypto.randomUUID() }) }]);
let selected = process.env.CMS_PROFILE_FAST === '1' ? cases.filter(([name]) => ['media', 'preflight'].includes(name)) : cases;
if (process.env.CMS_PROFILE_AUTH_WORKFLOW === '1') {
  const child = spawn(process.execPath, ['scripts/test-cms-staging-auth.mjs'], { env: { ...process.env, CMS_AUTH_PROBE: run }, stdio: ['ignore', 'pipe', 'ignore'] });
  let report = '';
  child.stdout.on('data', chunk => { report += chunk; });
  const code = await new Promise(resolve => child.on('close', resolve));
  if (code !== 0) results.push({ name: 'auth-workflow-failed', error: `exit-${code}` });
  if (report.trim()) for (const row of JSON.parse(report).results) results.push({ ...row, label: `${run}:${row.name}` });
  selected = results.map(row => [row.name]);
} else for (const round of [0, 1, 2]) for (const [name, pathname, options] of selected) {
  const label = `${run}:${name}:${round}`;
  const url = new URL(pathname, origin);
  url.searchParams.set('cpuProbe', label);
  try {
    const response = await fetch(url, { ...options, redirect: 'manual', signal: AbortSignal.timeout(20000) });
    const body = await response.text();
    results.push({ label, name, round, status: response.status, resourceLimit: /error code: 1102|Error 1102|exceeded resource limits/i.test(body), bytes: Buffer.byteLength(body) });
  } catch (error) { results.push({ label, name, round, error: error.name }); }
}
await new Promise(resolve => setTimeout(resolve, 12000));
tail.kill('SIGTERM');
const joined = results.map(r => ({ ...r, ...events.find(e => e.label === r.label && !e.entrypoint), durableCpuMs: events.find(e => e.label === r.label && e.entrypoint === 'PayloadWorkspace')?.cpuMs, invocations: events.filter(e => e.label === r.label) }));
const summary = selected.map(([name]) => { const rows = joined.filter(r => r.name === name); return { name, samples: rows.length, measured: rows.filter(r => Number.isFinite(r.cpuMs)).length, cpuMs: rows.map(r => r.cpuMs), durableCpuMs: rows.map(r => r.durableCpuMs), statuses: rows.map(r => r.status), outcomes: rows.map(r => r.outcome) }; });
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify({ run, origin, checkedAt: new Date().toISOString(), tailFailed: tailError.includes('ERROR'), summary, requests: joined, events }, null, 2)}\n`);
console.log(JSON.stringify(summary));
