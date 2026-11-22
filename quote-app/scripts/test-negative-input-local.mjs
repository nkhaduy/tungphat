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
  await page.goto("http://127.0.0.1:5173/bao-gia/moi");
  const price = page.getByLabel("Đơn giá dòng 1", { exact: true });
  await price.fill("100");
  await price.fill("-100");
  await page.getByText("Không được nhập số âm.", { exact: true }).first().waitFor();
  assert.equal(await price.inputValue(), "100");
  await price.fill("9007199254740992");
  await page.getByText("Số tiền vượt quá giới hạn cho phép.", { exact: true }).first().waitFor();
  assert.equal(await price.inputValue(), "100");
  const quantity = page.getByLabel("Số lượng dòng 1", { exact: true });
  await quantity.fill("2");
  await quantity.fill("-2");
  assert.equal(await quantity.inputValue(), "2");
  await quantity.fill("1.2345");
  await page.getByText("Số lượng chỉ được có tối đa 3 chữ số thập phân.", { exact: true }).first().waitFor();
  assert.equal(await quantity.inputValue(), "2");
  await quantity.fill("1000000001");
  await page.getByText("Số lượng vượt quá giới hạn cho phép.", { exact: true }).first().waitFor();
  assert.equal(await quantity.inputValue(), "2");
  const fee = page.locator('input[name="shippingFee"]');
  await fee.fill("50");
  await fee.fill("-50");
  assert.equal(await fee.inputValue(), "50");
  const first = page.getByLabel("Tên sản phẩm dòng 1", { exact: true });
  await first.fill("Hàng ban đầu");
  await first.click();
  await page.evaluate(() => navigator.clipboard.writeText("Hàng mới\t18mm\t-3\ttấm\t100\tghi chú"));
  await page.keyboard.press(process.platform === "darwin" ? "Meta+V" : "Control+V");
  await page.getByText("Không được nhập số âm.", { exact: true }).first().waitFor();
  assert.equal(await first.inputValue(), "Hàng ban đầu");
  assert.equal(await quantity.inputValue(), "2");
  console.log("PASS negative, over-limit and over-precision input is rejected without changing values");
} finally {
  await browser.close();
}
