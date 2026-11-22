import { test } from 'node:test';
import assert from 'node:assert/strict';

const origin = 'http://127.0.0.1:4187';
const wp = 'http://127.0.0.1:9400';
const id = process.env.PREVIEW_POST_ID || '32';
const cookie = process.env.PREVIEW_EDITOR_COOKIE || '';

test('anonymous and malformed cookies cannot retrieve a draft, even with Playground auto-login', async () => {
  for (const value of ['', 'playground_auto_login_already_happened=1', 'wordpress_logged_in_abcd=invalid']) {
    const response = await fetch(`${origin}/preview/${id}`, { headers: { Cookie: value }, redirect: 'manual' });
    const html = await response.text();
    assert.equal(response.status, 404);
    assert.match(response.headers.get('cache-control') || '', /no-store/i);
    assert.match(response.headers.get('x-robots-tag') || '', /noindex/i);
    assert.doesNotMatch(html, /data-analytics-content/);
  }
  const direct = await fetch(`${wp}/wp-json/tungphat/v1/preview/${id}`, { headers: {Cookie: 'playground_auto_login_already_happened=1'}, redirect: 'manual' });
  assert.ok([401, 403].includes(direct.status), `Expected WordPress denial, got ${direct.status}`);
  assert.match(direct.headers.get('cache-control') || '', /no-store/i);
});

test('a permitted editor sees the real article template', {skip: !cookie && 'Set PREVIEW_EDITOR_COOKIE to the logged-in WordPress cookie'}, async () => {
  const response = await fetch(`${origin}/preview/${id}`, { headers: {Cookie: cookie}, redirect: 'manual' });
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.match(response.headers.get('cache-control') || '', /no-store/i);
  assert.match(response.headers.get('x-robots-tag') || '', /noindex/i);
  assert.match(html, /data-analytics-content/);
  assert.match(html, /Bản xem trước nội dung đã lưu/);
});
