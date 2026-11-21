import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const authFile = process.env.PREVIEW_EDITOR_AUTH_FILE;
const id = process.env.PREVIEW_POST_ID || '32';

test('Editor opens the saved draft in the shared article template', { skip: !authFile && 'Set PREVIEW_EDITOR_AUTH_FILE to a private JSON file with user and pass', timeout: 90000 }, async () => {
  const { user, pass } = JSON.parse(await readFile(authFile, 'utf8'));
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext();
    await context.addCookies([{ name: 'playground_auto_login_already_happened', value: '1', url: 'http://127.0.0.1:9400' }]);
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:9400/wp-login.php');
    await page.locator('#user_login').fill(user);
    await page.locator('#user_pass').fill(pass);
    await Promise.all([page.waitForURL(url => !url.pathname.endsWith('wp-login.php')), page.locator('#wp-submit').click()]);
    const cookies = await context.cookies('http://127.0.0.1:9400');
    const session = cookies.find(cookie => cookie.name.startsWith('wordpress_logged_in_'));
    assert.ok(session, 'WordPress login cookie missing');
    const wp = await page.request.get(`http://127.0.0.1:9400/wp-json/tungphat/v1/preview/${id}`, { headers: { Cookie: `${session.name}=${session.value}; playground_auto_login_already_happened=1` } });
    assert.equal(wp.status(), 200);
    const post = await wp.json();
    const wrongType = await page.request.get('http://127.0.0.1:9400/wp-json/tungphat/v1/preview/2', { headers: { Cookie: `${session.name}=${session.value}; playground_auto_login_already_happened=1` } });
    assert.ok([401, 403, 404].includes(wrongType.status()), 'Non-post must be denied');
    await page.goto('http://127.0.0.1:9400/wp-admin/admin.php?page=tungphat-editorial-home');
    const link = page.locator(`a[href="http://127.0.0.1:4187/preview/${id}"]`);
    assert.ok(await link.count(), 'Dashboard preview link missing; check that the draft is visible in the first page of results');
    const [response] = await Promise.all([page.waitForNavigation({ waitUntil: 'domcontentloaded' }), link.first().click()]);
    assert.equal(response.status(), 200);
    assert.match(response.headers()['cache-control'] || '', /no-store/i);
    assert.match(response.headers()['x-robots-tag'] || '', /noindex/i);
    assert.ok((await page.locator('h1').first().textContent()).includes(post.title));
    assert.equal(await page.locator('article[data-analytics-content]').count(), 1);
    const articleText = await page.locator('article').innerText();
    assert.ok(articleText.length > 100);
    const paragraph = await page.evaluate(html => new DOMParser().parseFromString(html, 'text/html').querySelector('p')?.textContent?.trim() || '', post.content);
    assert.ok(paragraph, 'WordPress response has no paragraph to compare');
    assert.ok(articleText.includes(paragraph), 'Saved WordPress paragraph missing from article');
    assert.ok(await page.getByText('Bản xem trước nội dung đã lưu', { exact: false }).count());
  } finally {
    await browser.close();
  }
});
