// Disposable local database only. Set QA_USERNAME and QA_PASSWORD.
import assert from "node:assert/strict";
import { chromium } from "playwright";

const { QA_USERNAME: username, QA_PASSWORD: password } = process.env;
if (!username || !password) throw new Error("Provide credentials for a disposable local admin.");
const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({ permissions: ["clipboard-read", "clipboard-write"] });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:5173/login");
  await page.getByLabel("Tên đăng nhập").fill(username);
  await page.getByLabel("Mật khẩu").fill(password);
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await page.waitForURL("**/admin");
  for (const count of [50, 100, 300, 500]) {
    await page.goto("http://127.0.0.1:5173/bao-gia/moi");
    const first = page.getByLabel("Tên sản phẩm dòng 1", { exact: true });
    await first.click();
    const text = Array.from({ length: count }, (_, i) => `Ván dán ${i + 1}\t18mm\t2\ttấm\t1000\tGhi chú ${i + 1}`).join("\n");
    await page.evaluate((value) => navigator.clipboard.writeText(value), text);
    const pasteStart = Date.now();
    await page.keyboard.press(process.platform === "darwin" ? "Meta+V" : "Control+V");
    await page.getByLabel(`Tên sản phẩm dòng ${count}`, { exact: true }).waitFor({ timeout: 30_000 });
    const pasteRenderMs = Date.now() - pasteStart;
    assert.equal(await first.inputValue(), "Ván dán 1");
    const saveStart = Date.now();
    await page.getByRole("button", { name: "Lưu nháp" }).click();
    await page.waitForURL("**/chinh-sua", { timeout: 60_000 });
    const saveUiMs = Date.now() - saveStart;
    const items = await page.evaluate(async () => (await (await fetch(`/api/quotes/${location.pathname.split("/")[2]}`)).json()).quote.items);
    assert.equal(items.length, count);
    for (let i = 0; i < count; i += 1) {
      assert.equal(items[i].productName, `Ván dán ${i + 1}`);
      assert.equal(items[i].specification, "18mm");
      assert.equal(items[i].quantity, 2);
      assert.equal(items[i].unit, "tấm");
      assert.equal(items[i].unitPrice, 1000);
      assert.equal(items[i].note, `Ghi chú ${i + 1}`);
    }
    console.log(JSON.stringify({ rows: count, pasteRenderMs, saveUiMs }));
  }
} finally {
  await browser.close();
}
