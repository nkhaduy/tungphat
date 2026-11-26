import { expect, test, type Locator } from "@playwright/test";
import { getCatalogueListingEntries } from "../lib/catalog/listing";

const suppliers = [
  { id: "an-cuong", name: "An Cường", logo: "/partners/an-cuong-logo.png" },
  { id: "ba-thanh", name: "Ba Thanh", logo: "/partners/ba-thanh-logo.png" },
  { id: "thanh-thuy", name: "Thanh Thuỳ", logo: "/partners/thanh-thuy-logo.png" },
] as const;

const entries = getCatalogueListingEntries();

async function expectSupplierLogo(locator: Locator, supplier: (typeof suppliers)[number]) {
  await expect(locator).toHaveAttribute("data-supplier-id", supplier.id);
  const image = locator.locator("img");
  await expect(image).toHaveAttribute("alt", `Logo ${supplier.name}`);
  await expect(image).toBeVisible();
  const source = await image.getAttribute("src");
  expect(decodeURIComponent(source ?? "")).toContain(supplier.logo);
  await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0)).toBe(true);
}

test("catalogue listing cards show the real logo mapped to each supplier", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });

  for (const supplier of suppliers) {
    await page.goto("/catalogue/");
    await page.getByRole("button", { name: new RegExp(`^${supplier.name}`) }).click();
    const card = page.getByTestId("catalogue-card-link").first();
    await expect(card).toBeVisible();
    await expectSupplierLogo(card.getByTestId("supplier-brand-logo"), supplier);
    await expect(card.getByTestId("supplier-brand-logo")).toHaveCount(1);
  }
});

test("supplier detail pages show the logo for the record supplier", async ({ page }) => {
  for (const supplier of suppliers) {
    const entry = entries.find((item) => item.supplierId === supplier.id);
    expect(entry, `Expected a real catalogue record for ${supplier.name}`).toBeDefined();
    await page.goto(entry!.canonicalRoute);

    const logo = page.getByTestId("supplier-brand-logo");
    await expect(logo).toHaveCount(1);
    await expectSupplierLogo(logo, supplier);
    const bounds = await logo.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.width).toBeGreaterThanOrEqual(112);
  }
});

test("supplier logos fit mobile cards without horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  for (const supplier of suppliers) {
    await page.goto("/catalogue/");
    await page.getByRole("button", { name: new RegExp(`^${supplier.name}`) }).click();
    const card = page.getByTestId("catalogue-card-link").first();
    const logo = card.getByTestId("supplier-brand-logo");
    await expectSupplierLogo(logo, supplier);

    const bounds = await logo.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.width).toBeLessThanOrEqual(96);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  }
});
