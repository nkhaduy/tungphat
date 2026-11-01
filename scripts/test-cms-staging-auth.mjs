import { randomBytes } from 'node:crypto';
import fs from 'node:fs';
const origin = 'https://tungphat-payload-cms-staging.nkhaduy.workers.dev';
const email = `runtime-${Date.now()}@example.test`;
const password = randomBytes(24).toString('hex');
const results = [];
function testURL(path, name = path) {
  const url = new URL(path, origin);
  if (process.env.CMS_AUTH_PROBE) url.searchParams.set('cpuProbe', `${process.env.CMS_AUTH_PROBE}:${name}`);
  return url;
}
async function request(name, path, data, token) {
  const response = await fetch(testURL(path, name), { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `JWT ${token}` } : {}) }, body: JSON.stringify(data), signal: AbortSignal.timeout(60000) });
  const body = await response.json();
  results.push({ name, status: response.status });
  return { response, body };
}
const first = await request('bootstrap-staging-admin', '/api/users/first-register', { email, password, name: 'Runtime staging test' });
if (!first.response.ok) throw new Error(`Staging bootstrap HTTP ${first.response.status}; no credentials persisted`);
let cleanupToken;
let fixtureAdminID;
const fixtureRecords = [];
let workflowPassed = false;
try {
const login = await request('valid-login', '/api/users/login', { email, password });
const wrong = await request('invalid-login', '/api/users/login', { email, password: 'deliberately-invalid' });
const token = login.body.token;
cleanupToken = token;
fixtureAdminID = login.body.user.id;
const me = await fetch(testURL('/api/users/me', 'authenticated-me'), { headers: { Authorization: `JWT ${token}` } });
results.push({ name: 'authenticated-me', status: me.status, authenticated: Boolean((await me.json()).user?.id) });
const leads = await fetch(testURL('/api/leads?limit=1', 'authorized-leads'), { headers: { Authorization: `JWT ${token}` } });
results.push({ name: 'authorized-leads', status: leads.status });
const denied = await fetch(testURL('/api/leads?limit=1', 'unauthorized-leads'));
results.push({ name: 'unauthenticated-leads', status: denied.status });
if (process.env.CMS_BROWSER_WORKFLOW === '1') {
  const { chromium, expect } = await import('@playwright/test');
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.name));
    await page.goto(`${origin}/admin/login`);
    await expect(page.getByRole('heading', { name: 'CMS', exact: true })).toBeVisible();
    await page.locator('#field-email').fill(email);
    await page.locator('#field-password').fill(password);
    await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
    await page.waitForURL(/\/admin\/?$/, { timeout: 60000 });
    await expect(page.getByRole('heading', { name: /Xin chào/ })).toBeVisible();
    await page.screenshot({ path: 'reports/cloudflare-blockers/cms-staging-desktop.png', fullPage: true });
    await page.goto(`${origin}/admin/collections/articles`);
    await expect(page.getByRole('heading', { name: 'Bài viết', exact: true })).toBeVisible();
    await page.setViewportSize({ width: 390, height: 844 });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    await page.screenshot({ path: 'reports/cloudflare-blockers/cms-staging-mobile.png', fullPage: true });
    results.push({ name: 'cms-browser-login-dashboard-editor', passed: true, pageErrors: errors.length, overflow });
    if (errors.length || overflow > 1) throw new Error('Staging CMS browser regression');
  } finally { await browser.close(); }
}
if (process.env.CMS_EDITOR_WORKFLOW === '1') {
  const adminHeaders = { Authorization: `JWT ${token}` };
  const form = new FormData();
  form.set('_payload', JSON.stringify({ alt: 'Isolated staging upload test', mediaKind: 'brand' }));
  const bytes = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64');
  form.set('file', new Blob([bytes], { type: 'image/png' }), `runtime-${Date.now()}.png`);
  const uploaded = await fetch(testURL('/api/media', 'media-upload'), { method: 'POST', headers: adminHeaders, body: form });
  const media = (await uploaded.json()).doc;
  if (media?.id) fixtureRecords.push(['media', media.id]);
  results.push({ name: 'media-upload', status: uploaded.status });
  if (!uploaded.ok || !media?.url) throw new Error(`Staging upload failed HTTP ${uploaded.status}`);
  const delivered = await fetch(new URL(media.url, origin));
  const actual = Buffer.from(await delivered.arrayBuffer());
  results.push({ name: 'media-exact-bytes', status: delivered.status, passed: actual.equals(bytes) });
  if (!actual.equals(bytes)) throw new Error('Staging uploaded bytes changed');
  const editor = await request('editor-create', '/api/users', { email: `editor-${Date.now()}@example.test`, password, name: 'Runtime editor test', role: 'editor' }, token);
  const editorDoc = editor.body.doc;
  if (editorDoc?.id) fixtureRecords.push(['users', editorDoc.id]);
  const editorLogin = await request('editor-login', '/api/users/login', { email: editorDoc.email, password });
  const editorToken = editorLogin.body.token;
  const slug = `migration-runtime-${Date.now()}`;
  const draft = await request('editor-save-draft', '/api/articles?draft=true', {
    title: 'Isolated migration editorial test', slug, excerpt: 'A temporary staging article verifies editorial workflow without changing any production records.', category: 'Runtime test', author: 'Staging test', body: '## Runtime test\n\nTemporary staged article.', featuredImage: media.id, featuredImageAlt: 'Isolated staging upload test', publishedAt: '2026-11-01', legacyUpdatedAt: '2026-11-01', seo: { title: 'Isolated staging editorial test', description: 'This temporary staging metadata verifies the complete Payload publishing workflow, access controls and API compatibility.', canonical: `https://mdftungphat.com/bai-viet/${slug}`, noindex: true }, _status: 'draft',
  }, editorToken);
  if (!draft.response.ok) throw new Error(`Draft save failed HTTP ${draft.response.status}`);
  const articleID = draft.body.doc.id;
  fixtureRecords.push(['articles', articleID]);
  const publicDraft = await fetch(testURL(`/api/articles/${articleID}`, 'public-draft'));
  results.push({ name: 'public-draft-hidden', status: publicDraft.status });
  const patch = async (name, path, data, accessToken) => {
    const r = await fetch(testURL(path, name), { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `JWT ${accessToken}` }, body: JSON.stringify(data) });
    results.push({ name, status: r.status }); return r;
  };
  const forbiddenPublish = await patch('editor-publish-denied', `/api/articles/${articleID}`, { _status: 'published' }, editorToken);
  const published = await patch('admin-publish', `/api/articles/${articleID}`, { _status: 'published' }, token);
  const publicArticle = await fetch(testURL(`/api/articles/${articleID}`, 'public-published'));
  results.push({ name: 'public-published-visible', status: publicArticle.status });
  const mediaEdit = await patch('media-metadata-edit', `/api/media/${media.id}`, { alt: 'Updated staging metadata test' }, editorToken);
  const deniedUser = await request('editor-user-create-denied', '/api/users', { email: `denied-${Date.now()}@example.test`, password, name: 'Forbidden user', role: 'admin' }, editorToken);
  for (const [collection, id] of [['articles', articleID], ['media', media.id], ['users', editorDoc.id]]) {
    const r = await fetch(testURL(`/api/${collection}/${id}`, `cleanup-${collection}`), { method: 'DELETE', headers: adminHeaders });
    results.push({ name: `cleanup-${collection}`, status: r.status });
    if (!r.ok) throw new Error(`Staging cleanup failed ${collection} HTTP ${r.status}`);
  }
  if (publicDraft.status !== 404 || forbiddenPublish.status !== 403 || !published.ok || !publicArticle.ok || !mediaEdit.ok || deniedUser.response.status !== 403) throw new Error('Staging editorial authorization contract failed');
}
const logout = await request('logout', '/api/users/logout', {}, token);
const again = await request('login-after-logout', '/api/users/login', { email, password });
cleanupToken = again.body.token;
const removed = await fetch(testURL(`/api/users/${login.body.user.id}`, 'cleanup'), { method: 'DELETE', headers: { Authorization: `JWT ${again.body.token}` } });
results.push({ name: 'fixture-cleanup-after-logout', status: removed.status });
const passed = login.response.ok && [400,401].includes(wrong.response.status) && me.ok && leads.ok && denied.status === 403 && logout.response.ok && removed.ok;
workflowPassed = passed;
fs.writeFileSync(new URL('../reports/cloudflare-blockers/durable-auth.json', import.meta.url), JSON.stringify({ checkedAt: new Date().toISOString(), passed, results }, null, 2));
console.log(JSON.stringify({ passed, results }));
if (!passed) process.exitCode = 1;
} finally {
  if (!workflowPassed) {
    fs.writeFileSync(new URL('../reports/cloudflare-blockers/durable-auth.json', import.meta.url), JSON.stringify({ checkedAt: new Date().toISOString(), passed: false, results }, null, 2));
    console.log(JSON.stringify({ passed: false, results }));
  }
  if (cleanupToken) {
    for (const [collection, id] of fixtureRecords.reverse()) await fetch(new URL(`/api/${collection}/${id}`, origin), { method: 'DELETE', headers: { Authorization: `JWT ${cleanupToken}` } });
    if (fixtureAdminID) await fetch(new URL(`/api/users/${fixtureAdminID}`, origin), { method: 'DELETE', headers: { Authorization: `JWT ${cleanupToken}` } });
  }
}
