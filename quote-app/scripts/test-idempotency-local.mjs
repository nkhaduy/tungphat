// Disposable local database only. Set QA_USERNAME and QA_PASSWORD.
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

(async () => {
  const { QA_USERNAME: username, QA_PASSWORD: password } = process.env;
  if (!username || !password) throw new Error('Provide credentials for a disposable local admin.');
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.goto('http://127.0.0.1:5173/login');
    await page.getByLabel('Tên đăng nhập').fill(username);
    await page.getByLabel('Mật khẩu').fill(password);
    await page.getByRole('button', { name: 'Đăng nhập' }).click();
    await page.waitForURL('**/admin');
    const result = await page.evaluate(async () => {
      const session = await (await fetch('/api/auth/session')).json();
      const meta = await (await fetch('/api/meta')).json();
      const input = {
        branchId: meta.branches[0].id, quoteDate: '2026-11-18', customerName: 'Khách kiểm thử',
        customerPhone: '', customerAddress: '', deliveryNote: '', generalNote: '', oldDebtAmount: 0,
        discount: 0, shippingFee: 0, processingFee: 0, vatAmount: 0, depositAmount: 0, paymentStatus: 'UNPAID',
        items: [{ productName: 'MDF thử', specification: '', quantity: 1, unit: 'tấm', unitPrice: 100, note: '' }],
      };
      const key = crypto.randomUUID();
      const send = (body) => fetch('/api/quotes', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': session.csrf, 'Idempotency-Key': key },
        body: JSON.stringify(body),
      });
      const [first, second] = await Promise.all([send(input), send(input)]);
      const firstBody = await first.json();
      const secondBody = await second.json();
      const changed = await send({ ...input, customerName: 'Dữ liệu khác' });
      return { statuses: [first.status, second.status], ids: [firstBody.quote?.id, secondBody.quote?.id], changed: changed.status };
    });
    assert.ok(result.statuses.every((status) => status === 200 || status === 201));
    assert.ok(result.ids[0]);
    assert.equal(result.ids[0], result.ids[1]);
    assert.equal(result.changed, 409);
    console.log('PASS: same-key concurrent creates return one quote; different payload conflicts');
  } finally {
    await browser.close();
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
