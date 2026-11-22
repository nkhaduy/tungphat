import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const authFile = process.env.PREVIEW_EDITOR_AUTH_FILE;
const id = process.env.PREVIEW_POST_ID || '45';
test('Gutenberg native preview opens the local Next article', { skip: !authFile && 'Set PREVIEW_EDITOR_AUTH_FILE', timeout: 90000 }, async () => {
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
    await page.goto(`http://127.0.0.1:9400/wp-admin/post.php?post=${id}&action=edit`);
    await page.getByRole('button', { name: 'Xem', exact: true }).click();
    const preview = page.locator('.editor-header a').filter({ hasText: 'Xem thử' });
    await preview.waitFor({ state: 'attached' });
    assert.match(await preview.getAttribute('href'), new RegExp(`^http://127\\.0\\.0\\.1:4187/preview/${id}(?:\\?|$)`));
    const menuLink = page.locator('a').filter({ hasText: 'Xem trước ở tab mới' });
    const [popup] = await Promise.all([page.waitForEvent('popup'), menuLink.click()]);
    await popup.waitForURL(`http://127.0.0.1:4187/preview/${id}**`, { timeout: 20000 });
    await popup.waitForLoadState('domcontentloaded');
    assert.match(popup.url(), new RegExp(`^http://127\\.0\\.0\\.1:4187/preview/${id}`));
    assert.equal(await popup.locator('article[data-analytics-content]').count(), 1);
    assert.ok(await popup.getByText('Bản xem trước nội dung đã lưu', { exact: false }).count());
  } finally { await browser.close(); }
});
