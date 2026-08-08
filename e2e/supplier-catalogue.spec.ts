import { expect, test } from "@playwright/test";

const colorSearchName = "Tìm mã màu, tên màu hoặc thương hiệu";

test.describe("Mã màu customer journeys", () => {
  test("site navigation exposes the public Mã màu experience", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(
      page
        .getByRole("navigation", { name: "Điều hướng chính" })
        .getByRole("link", { name: "Mã màu", exact: true }),
    ).toHaveAttribute("href", "/catalogue/");
    await expect(
      page
        .getByRole("contentinfo")
        .getByRole("link", { name: "Mã màu", exact: true }),
    ).toHaveAttribute("href", "/catalogue/");
  });

  test("exact normalized code search opens the canonical An Cường route", async ({
    page,
  }) => {
    await page.goto("/catalogue/");
    const search = page.getByRole("searchbox", { name: colorSearchName });

    await search.fill("MS465SC04");
    await expect(page).toHaveURL(/query=MS465SC04/);
    await expect(
      page
        .getByRole("link", {
          name: /An Cường, mã MFC - MS 465 SC04, xem chi tiết/i,
        })
        .first(),
    ).toBeVisible();

    await search.press("Enter");
    await expect(page).toHaveURL(
      /\/catalogue\/an-cuong\/melamine\/mfc-ms-465-sc04\/$/,
    );

    await page.goBack();
    await expect(search).toHaveValue("MS465SC04");
    await search.press("Escape");
    await expect(search).toHaveValue("");
    await expect(page).not.toHaveURL(/query=/);
  });

  test("exact search aliases resolve Ba Thanh and Thanh Thuỳ codes", async ({
    page,
  }) => {
    const cases = [
      {
        query: "BT99",
        name: /Ba Thanh, mã BT99, xem chi tiết/i,
        route: "/catalogue/ba-thanh/melamine/bt99/",
      },
      {
        query: "SC 016M",
        name: /Ba Thanh, mã SC016M, xem chi tiết/i,
        route: "/catalogue/ba-thanh/melamine/sc016m/",
      },
      {
        query: "0029",
        name: /Thanh Thuỳ, mã 0029, xem chi tiết/i,
        route: "/catalogue/thanh-thuy/melamine/0029/",
      },
    ] as const;

    await page.goto("/catalogue/");
    const search = page.getByRole("searchbox", { name: colorSearchName });

    for (const item of cases) {
      await search.fill(item.query);
      await expect(
        page.getByRole("link", { name: item.name }).first(),
      ).toHaveAttribute("href", item.route);
    }
  });

  test("supplier hubs show verified color-code counts only", async ({ page }) => {
    const suppliers = [
      { path: "/catalogue/an-cuong/", heading: "Mã màu An Cường", count: 2195 },
      { path: "/catalogue/thanh-thuy/", heading: /Mã màu Thanh Th[uù]y/, count: 342 },
      { path: "/catalogue/ba-thanh/", heading: "Mã màu Ba Thanh", count: 292 },
    ] as const;

    for (const supplier of suppliers) {
      await page.goto(supplier.path);
      await expect(
        page.getByRole("heading", { name: supplier.heading, exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole("heading", {
          name: `${supplier.count} mã màu · ${supplier.count} mã phù hợp`,
          exact: true,
        }),
      ).toBeVisible();
      await expect(
        page.getByRole("searchbox", { name: colorSearchName }),
      ).toBeVisible();
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
        "content",
        /index, follow/i,
      );
    }
  });

  test("An Cường hub keeps the full surface code and verified image", async ({
    page,
  }) => {
    await page.goto("/catalogue/an-cuong/");
    const search = page.getByRole("searchbox", { name: colorSearchName });

    await search.fill("MFC - MS 465 SC04");
    const result = page
      .getByRole("region", { name: "Kết quả mã màu An Cường" })
      .getByRole("article");
    await expect(result).toHaveCount(1);
    await expect(result.getByText("MFC - MS 465 SC04", { exact: true })).toBeVisible();
    await expect(result.getByRole("img", { name: "Swatch MFC - MS 465 SC04" })).toBeVisible();
  });

  test("Ba Thanh exposes both Melamine and Laminate code collections", async ({
    page,
  }) => {
    await page.goto("/catalogue/ba-thanh/laminate/");
    await expect(
      page.getByRole("heading", {
        name: "Mã màu laminate · Ba Thanh",
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: "33 mã màu · 33 mã phù hợp",
        exact: true,
      }),
    ).toBeVisible();

    const search = page.getByRole("searchbox", { name: colorSearchName });
    await search.fill("P2052");
    await expect(
      page.getByRole("link", { name: /Ba Thanh, mã P2052, xem chi tiết/i }),
    ).toHaveAttribute("href", "/catalogue/ba-thanh/laminate/p2052/");

    await page.goto("/catalogue/ba-thanh/melamine/");
    await expect(
      page.getByRole("heading", {
        name: "Mã màu melamine · Ba Thanh",
        exact: true,
      }),
    ).toBeVisible();
  });

  test("detail pages prioritize the code, breadcrumb and local source media", async ({
    page,
  }) => {
    await page.goto("/catalogue/an-cuong/melamine/mfc-ms-465-sc04/");

    await expect(
      page.getByRole("heading", { name: "MFC - MS 465 SC04", exact: true }),
    ).toBeVisible();
    const breadcrumb = page.getByRole("navigation", { name: "Breadcrumb" });
    await expect(
      breadcrumb.getByRole("link", { name: "Mã màu", exact: true }),
    ).toHaveAttribute("href", "/catalogue/");
    await expect(
      breadcrumb.getByRole("link", { name: "An Cường", exact: true }),
    ).toHaveAttribute("href", "/catalogue/an-cuong/");
    await expect(page.getByRole("img", { name: /MFC - MS 465 SC04 swatch/i })).toBeVisible();
    await expect(page.locator('img[src=""]')).toHaveCount(0);
  });

  test("Thanh Thuỳ Veneer collection exposes the official surface identifier and swatch", async ({
    page,
  }) => {
    await page.goto("/catalogue/thanh-thuy/veneer/veneer-cheery/");

    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "VENEER CHEERY",
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("img", { name: /VENEER CHEERY swatch/i }),
    ).toHaveAttribute("src", /\/catalog\/thanh-thuy\/veneer-cheery-/);
    await expect(page.locator('img[src=""]')).toHaveCount(0);
  });

  test("Ba Thanh invalid source media renders an explicit source-missing state", async ({
    page,
  }) => {
    await page.goto("/catalogue/ba-thanh/melamine/bt171ev/");

    await expect(
      page.getByRole("heading", { name: "BT171EV", exact: true }),
    ).toBeVisible();
    await expect(page.getByText("Nguồn chưa cung cấp ảnh màu")).toBeVisible();
    await expect(page.locator("main img")).toHaveCount(0);
    await expect(page.locator('img[src=""]')).toHaveCount(0);
  });

  test("catalogue remains useful without JavaScript", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto("/catalogue/");

    await expect(
      page.getByRole("heading", { name: "Mã màu vật liệu", exact: true }),
    ).toBeVisible();
    await expect(page.locator('a[href="/catalogue/an-cuong/"]')).toHaveCount(1);
    await expect(page.locator('a[href="/catalogue/thanh-thuy/"]')).toHaveCount(1);
    await expect(page.locator('a[href="/catalogue/ba-thanh/"]')).toHaveCount(1);
    await context.close();
  });
});

test.describe("Mã màu mobile navigation", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("mobile menu uses Mã màu and restores background scrolling", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Mở menu" }).click();

    await expect(
      page
        .getByRole("navigation", {
          name: "Điều hướng trên thiết bị di động",
        })
        .getByRole("link", { name: "Mã màu", exact: true }),
    ).toHaveAttribute("href", "/catalogue/");
    await expect(page.locator("body")).toHaveCSS("overflow", "hidden");

    await page.getByRole("button", { name: "Đóng menu" }).click();
    await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
  });

  test("mobile exact-code search stays usable without horizontal overflow", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/catalogue/");
    const search = page.getByRole("searchbox", { name: colorSearchName });

    expect((await search.boundingBox())?.height).toBeGreaterThanOrEqual(44);
    await search.fill("BT99");
    await expect(
      page.getByRole("link", { name: /Ba Thanh, mã BT99, xem chi tiết/i }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      ),
    ).toBeLessThanOrEqual(1);
  });
});
