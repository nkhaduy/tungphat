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
        name: /Ván gỗ công nghiệp\s*&\s*gia công CNC/,
      }),
    ).toBeVisible();
  } finally {
    await page.close();
  }
});

test("page entrance motion keeps content fully opaque", async ({ page }) => {
  await page.addInitScript(() => {
    const samples: number[] = [];
    Object.assign(window, { __pageTransitionOpacitySamples: samples });
    document.addEventListener(
      "animationstart",
      (event) => {
        if ((event as AnimationEvent).animationName !== "page-enter") return;
        const element = event.target;
        if (!(element instanceof HTMLElement)) return;
        let frames = 0;
        const sample = () => {
          samples.push(Number.parseFloat(getComputedStyle(element).opacity));
          frames += 1;
          if (frames < 6) requestAnimationFrame(sample);
        };
        requestAnimationFrame(sample);
      },
      true,
    );
  });

  await page.goto("/");
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (
            window as Window & {
              __pageTransitionOpacitySamples?: number[];
            }
          ).__pageTransitionOpacitySamples?.length ?? 0,
      ),
    )
    .toBeGreaterThan(0);
  const samples = await page.evaluate(
    () =>
      (
        window as Window & { __pageTransitionOpacitySamples: number[] }
      ).__pageTransitionOpacitySamples,
  );
  expect(Math.min(...samples)).toBeGreaterThanOrEqual(0.99);
});
