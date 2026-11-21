// Preload in every Next build process: serve the captured public post list.
// Node's --require preload must be CommonJS.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { readFileSync } = require('node:fs');
const posts = JSON.parse(readFileSync(process.env.WP_BUILD_SNAPSHOT, 'utf8'));
if (!Array.isArray(posts)) throw new Error('Invalid build snapshot');
const origin = new URL(process.env.WORDPRESS_BASE_URL).origin;
const originalFetch = globalThis.fetch;
globalThis.fetch = function snapshotFetch(input, init) {
  const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url);
  if (url.origin === origin && url.pathname === '/wp-json/wp/v2/posts') {
    const method = (init?.method || input?.method || 'GET').toUpperCase();
    if (method !== 'GET' || url.searchParams.get('status') !== 'publish' || url.searchParams.get('per_page') !== '100') throw new Error('Unexpected WordPress build request');
    const page = Number(url.searchParams.get('page'));
    if (!Number.isInteger(page) || page < 1) throw new Error('Invalid snapshot page');
    return Promise.resolve(new Response(JSON.stringify(posts.slice((page - 1) * 100, page * 100)), { headers: { 'content-type': 'application/json', 'x-wp-totalpages': String(Math.ceil(posts.length / 100)) } }));
  }
  return originalFetch(input, init);
};
