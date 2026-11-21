import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getPreview } from './preview.mjs';

test('requires a WordPress login cookie before contacting Playground', async () => {
  let called = false;
  const result = await getPreview('32', 'playground_auto_login_already_happened=1', async () => { called = true; });
  assert.equal(result, null);
  assert.equal(called, false);
});
test('validates the post id and forwards only the login cookie without redirects or caching', async () => {
  let request;
  const fetcher = async (url, options) => { request = { url, options }; return new Response(JSON.stringify({id: 32, title:'Draft', content:'<p>Body</p>'}), {status:200}); };
  assert.equal(await getPreview('32x', 'wordpress_logged_in_abcd=abc', fetcher), null);
  const result = await getPreview('32', 'other=bad; wordpress_logged_in_abcd=abc; wp_secret=bad', fetcher);
  assert.equal(result.title, 'Draft');
  assert.equal(request.url, 'http://127.0.0.1:9400/wp-json/tungphat/v1/preview/32');
  assert.equal(request.options.headers.Cookie, 'wordpress_logged_in_abcd=abc; playground_auto_login_already_happened=1');
  assert.equal(request.options.cache, 'no-store');
  assert.equal(request.options.redirect, 'manual');
});
test('denies redirects, errors and mismatched post responses', async () => {
  for (const response of [new Response(null,{status:302}), new Response('{}',{status:403}), new Response('{"id":33}',{status:200})]) {
    assert.equal(await getPreview('32','wordpress_logged_in_abcd=abc',async()=>response), null);
  }
});
