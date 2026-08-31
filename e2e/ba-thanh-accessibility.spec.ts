import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const auditedRoutes = [
  ["homepage", "/"],
  ["Ba Thanh catalogue", "/ma-mau-melamine/ba-thanh/"],
  ["Ba Thanh category", "/ma-mau-melamine/ba-thanh/van-go/"],
  ["An Cuong catalogue", "/catalogue/an-cuong/"],
] as const;

for (const [name, route] of auditedRoutes) {
  test(`${name} has no serious accessibility violations`, async ({ page }) => {
    await page.setViewportSize({ width: 412, height: 915 });
    await page.goto(route);

    const results = await new AxeBuilder({ page }).analyze();
    expect(
      results.violations.filter(
        (violation) =>
          violation.impact === "critical" || violation.impact === "serious",
      ),
    ).toEqual([]);
  });
}

test("homepage hero content stays readable before hydration", async ({
  browser,
}) => {
  const page = await browser.newPage({ javaScriptEnabled: false });

  try {
    await page.goto("/");
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Kho ván gỗ công nghiệp, gỗ ghép & gia công CNC tại Thủ Đức",
      }),
    ).toBeVisible();
  } finally {
    await page.close();
  }
});
