import { expect, test } from "@playwright/test";

const catalogueSearchName = "Tìm theo mã màu, tên màu hoặc thương hiệu";
const supplierSearchName = "Tìm mã màu, tên màu hoặc thương hiệu";

test.describe("Mã màu customer journeys", () => {
  test("site navigation exposes the public Mã màu experience", async ({
    page,
  }) => {
    await page.goto("/");

    const nav = page.getByRole("navigation", { name: "Điều hướng chính" });
    await nav.getByRole("button", { name: "Mã màu / Catalogue", exact: true }).click();
    await expect(nav.getByRole("link", { name: "Tìm mã màu", exact: true })).toHaveAttribute("href", "/catalogue/");
    await expect(
      page
        .getByRole("contentinfo")
        .getByRole("link", { name: "Mã màu / Catalogue", exact: true }),
    ).toHaveAttribute("href", "/catalogue/");
  });

  test("exact normalized code search opens the canonical An Cường route", async ({
    page,
  }) => {
    await page.goto("/catalogue/");
    const search = page.getByRole("searchbox", { name: catalogueSearchName });

    await page.getByRole("button", { name: /^An Cường/ }).click();
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
        supplier: "ba-thanh",
        query: "BT99",
        name: /Ba Thanh, mã BT99, xem chi tiết/i,
        route: "/catalogue/ba-thanh/melamine/bt99/",
      },
      {
        supplier: "ba-thanh",
        query: "SC 016M",
        name: /Ba Thanh, mã SC016M, xem chi tiết/i,
        route: "/catalogue/ba-thanh/melamine/sc016m/",
      },
      {
        supplier: "thanh-thuy",
        query: "0029",
        name: /Thanh Thuỳ, mã 0029, xem chi tiết/i,
        route: "/catalogue/thanh-thuy/melamine/0029/",
      },
    ] as const;

    await page.goto("/catalogue/");
    const search = page.getByRole("searchbox", { name: catalogueSearchName });

    for (const item of cases) {
      const brand = item.supplier === "ba-thanh" ? /^Ba Thanh/ : /^Thanh Thuỳ/;
      await page.getByRole("group", { name: "Lọc theo thương hiệu" }).first().getByRole("button", { name: brand }).click();
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
      { path: "/catalogue/ba-thanh/", heading: "Mã màu Ba Thanh", count: 373 },
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
        page.getByRole("searchbox", { name: supplierSearchName }),
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
    const search = page.getByRole("searchbox", { name: supplierSearchName });

    await search.fill("MFC - MS 465 SC04");
    const result = page
      .getByRole("region", { name: "Kết quả mã màu An Cường" })
      .getByRole("article");
    await expect(result).toHaveCount(1);
    await expect(
      result.getByRole("heading", { name: /^MFC - MS 465 SC04\b/ }),
    ).toBeVisible();
    await expect(result.getByRole("img", { name: "Swatch MFC - MS 465 SC04" })).toBeVisible();
  });

  test("supplier lists auto-load the next page near the bottom", async ({ page }) => {
    await page.goto("/catalogue/an-cuong/");
    const region = page.getByRole("region", { name: "Kết quả mã màu An Cường" });
    await expect(region.getByRole("article")).toHaveCount(48);

    const sentinel = page.getByTestId("catalogue-load-sentinel");
    await sentinel.scrollIntoViewIfNeeded();
    await expect(page.getByText("Đang tải thêm mã màu", { exact: true })).toBeVisible();
    await expect(region.getByRole("article")).toHaveCount(96);

    await page.goto("/catalogue/ba-thanh/melamine/");
    const baThanhRegion = page.getByRole("region", { name: "Kết quả mã màu Ba Thanh" });
    await expect(baThanhRegion.getByRole("article")).toHaveCount(48);
    await page.getByTestId("catalogue-load-sentinel").scrollIntoViewIfNeeded();
    await expect(page.getByText("Đang tải thêm mã màu", { exact: true })).toBeVisible();
    await expect(baThanhRegion.getByRole("article")).toHaveCount(96);
  });

  test("all verified codes auto-load beyond the first catalogue batch", async ({ page }) => {
    await page.goto("/catalogue/");
    await expect(page.getByRole("heading", { name: "2.910 mã màu", exact: true })).toBeVisible();
    const region = page.getByRole("region", { name: "Kết quả mã màu" });
    await expect(region.getByRole("article")).toHaveCount(48);
    await page.getByTestId("catalogue-load-sentinel").scrollIntoViewIfNeeded();
    await expect(region.getByRole("article")).toHaveCount(96);
  });

  test("supplier filters expose only verified material and pattern groups", async ({
    page,
  }) => {
    await page.goto("/catalogue/");
    await page.goto("/catalogue/");
    await page.getByRole("button", { name: /^Thanh Thuỳ/ }).click();
    const sidebar = page.getByRole("complementary", { name: "Bộ lọc catalogue" });
    await expect(sidebar.getByRole("checkbox", { name: /^Mã cạnh/ })).toHaveCount(0);
    await expect(sidebar.locator("details").filter({ has: page.getByText("Nhóm vân", { exact: true }) }).getByRole("checkbox", { name: /^Vân gỗ/ })).toBeVisible();
  });

  test("shared catalogue hides Panel and Khác but keeps Ba Thanh edge banding", async ({
    page,
  }) => {
    await page.goto("/catalogue/");

    await expect(page.getByRole("button", { name: "Panel", exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Khác", exact: true })).toHaveCount(0);

    await page.getByRole("button", { name: /^Ba Thanh/ }).click();
    const sidebar = page.getByRole("complementary", { name: "Bộ lọc catalogue" });
    await expect(sidebar.getByRole("checkbox", { name: /^Panel/ })).toHaveCount(0);
    await expect(sidebar.getByRole("checkbox", { name: /^Mã cạnh/ })).toHaveCount(0);
    await sidebar.getByRole("checkbox", { name: /^Laminate/ }).check();
    await expect(page.getByRole("heading", { name: "113 mã màu", exact: true })).toBeVisible();
  });

  test("catalogue filters expose clear selected states and supplier filtering", async ({
    page,
  }) => {
    await page.goto("/catalogue/");

    await page.getByRole("button", { name: /^Ba Thanh/ }).click();
    const sidebar = page.getByRole("complementary", { name: "Bộ lọc catalogue" });
    const laminate = sidebar.getByRole("checkbox", { name: /^Laminate/ });
    await expect(laminate).toBeVisible();
    await laminate.check();
    await expect(page.getByRole("heading", { name: "113 mã màu", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Laminate", exact: true }).click();
    await expect(page.getByRole("heading", { name: "373 mã màu", exact: true })).toBeVisible();
  });

  test("empty searches explain how to recover", async ({ page }) => {
    await page.goto("/catalogue/");
    await page.getByRole("searchbox", { name: catalogueSearchName }).fill(
      "MA-KHONG-TON-TAI-999999",
    );

    await expect(
      page.getByText("Không tìm thấy mã phù hợp", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText(/Thử đổi từ khóa hoặc bỏ bớt/i),
    ).toBeVisible();
  });

  test("catalogue cards use compact supplier copy without duplicate taxonomy", async ({ page }) => {
    await page.goto("/catalogue/?supplier=thanh-thuy&query=301");
    const thanhThuyCard = page
      .getByRole("region", { name: "Kết quả mã màu" })
      .getByRole("article")
      .filter({ hasText: "301 Artistic Stripe" });
    await expect(thanhThuyCard).toHaveCount(1);
    await expect(thanhThuyCard.getByText("Thanh Thuỳ", { exact: true })).toBeVisible();
    await thanhThuyCard.scrollIntoViewIfNeeded();
    await expect(thanhThuyCard.locator('img[src*="thanh-thuy-logo"]')).toHaveCount(0);
    await expect(thanhThuyCard.getByText("Mã màu", { exact: true })).toHaveCount(0);
    await expect(thanhThuyCard.getByText("301", { exact: true })).toHaveCount(0);
    await expect(thanhThuyCard.getByText("301 Artistic Stripe", { exact: true })).toHaveCount(1);
    await expect(thanhThuyCard.locator("p")).toHaveText(
      "Thanh Thuỳ · Danh mục: Melamine · Vân gỗ",
    );
    await expect(thanhThuyCard.getByRole("button")).toHaveCount(0);
    await expect(thanhThuyCard.getByText("Chi tiết", { exact: true })).toHaveCount(0);
    await expect(thanhThuyCard.getByTestId("catalogue-card-link")).toHaveAttribute(
      "href",
      /\/catalogue\/thanh-thuy\/melamine\/301\/?$/,
    );

    await page.goto("/catalogue/?supplier=ba-thanh&query=BT111");
    const baThanhCard = page
      .getByRole("region", { name: "Kết quả mã màu" })
      .getByRole("article")
      .first();
    await expect(baThanhCard.getByText("BT 111", { exact: true })).toBeVisible();
    await expect(baThanhCard).not.toContainText("MELAMINE BA THANH");
  });

  for (const viewport of [
    { name: "desktop", width: 1440, height: 900 },
    { name: "tablet", width: 834, height: 1112 },
    { name: "mobile", width: 390, height: 844 },
  ]) {
    test(`${viewport.name} keeps one search in its original position while scrolling`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await page.goto("/catalogue/");

      const search = page.getByRole("searchbox", { name: catalogueSearchName });
      await search.fill("0330");
      await page.mouse.wheel(0, 900);

      await expect(search).toHaveCount(1);
      await expect(search).toHaveValue("0330");
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
        viewport.width,
      );
      if (viewport.width >= 1024) {
        await expect(page.getByRole("complementary", { name: "Bộ lọc catalogue" })).toBeVisible();
      } else {
        await expect(page.getByRole("button", { name: /Bộ lọc/ })).toBeVisible();
      }
    });
  }

  test("Ba Thanh exposes both Melamine and Laminate code collections", async ({
    page,
  }) => {
    await page.goto("/catalogue/ba-thanh/laminate/");
    await expect(
      page.getByRole("heading", {
        name: /Mã màu laminate.*Ba Thanh/i,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: "113 mã màu · 113 mã phù hợp",
        exact: true,
      }),
    ).toBeVisible();

    const search = page.getByRole("searchbox", { name: supplierSearchName });
    await search.fill("LW 143 T");
    await expect(
      page.getByRole("link", { name: /Ba Thanh, mã LW 143 T, xem chi tiết/i }),
    ).toHaveAttribute("href", "/catalogue/ba-thanh/laminate/lw-143-t/");

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
      page.getByRole("heading", { name: /MFC - MS 465 SC04.*Santana Oak/ }),
    ).toBeVisible();
    const breadcrumb = page.getByRole("navigation", { name: "Breadcrumb" });
    await expect(
      breadcrumb.getByRole("link", { name: "Mã màu", exact: true }),
    ).toHaveAttribute("href", "/catalogue/");
    await expect(
      breadcrumb.getByRole("link", { name: "An Cường", exact: true }),
    ).toHaveAttribute("href", "/catalogue/an-cuong/");
    await expect(page.getByRole("img", { name: /Mã MFC - MS 465 SC04.*Melamine/i })).toBeVisible();
    await expect(page.locator('img[src=""]')).toHaveCount(0);
  });

  test("Thanh Thuỳ Veneer collection exposes the official surface identifier and swatch", async ({
    page,
  }) => {
    await page.goto("/catalogue/thanh-thuy/veneer/veneer-cheery/");

    await expect(
      page.getByRole("heading", {
        level: 1,
        name: /VENEER CHEERY/,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("img", { name: /Mã VENEER CHEERY/ }),
    ).toHaveAttribute("src", /\/catalog\/thanh-thuy\/veneer-cheery-/);
    await expect(page.locator('img[src=""]')).toHaveCount(0);
  });

  test("Ba Thanh invalid source media renders an explicit source-missing state", async ({
    page,
  }) => {
    await page.goto("/catalogue/ba-thanh/melamine/bt171ev/");

    await expect(
      page.getByRole("heading", { name: /BT\s*171EV/ }),
    ).toBeVisible();
    await expect(page.getByText("Ảnh đang cập nhật", { exact: true })).toBeVisible();
    await expect(page.locator("main img")).toHaveCount(0);
    await expect(page.locator('img[src=""]')).toHaveCount(0);
  });

  for (const code of ["SC009MW", "SC010MW", "SC011MW", "SC012MW", "SC013MW", "SC014MW", "SC015MW"]) {
    test(`missing legacy Ba Thanh ${code} preserves its code and source without a broken image`, async ({ page }) => {
      await page.goto(`/catalogue/ba-thanh/melamine/${code.toLowerCase()}/`);
      await expect(page.getByRole("heading", { level: 1 })).toContainText(new RegExp(code.replace("SC", "SC\\s*")));
      await expect(page.getByText("Ảnh đang cập nhật", { exact: true })).toBeVisible();
      await expect(page.locator("main img")).toHaveCount(0);
      await expect(page.getByRole("link", { name: "Mở nguồn", exact: true })).toHaveAttribute("href", `https://bathanh.com.vn/${code.toLowerCase()}`);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    });
  }

  test("catalogue remains useful without JavaScript", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto("/catalogue/");

    await expect(
      page.getByRole("heading", { name: "Mã màu", exact: true }),
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
        .getByRole("dialog", {
          name: "Điều hướng di động",
        })
        .getByRole("link", { name: "Mã màu / Catalogue", exact: true }),
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
    const search = page.getByRole("searchbox", { name: catalogueSearchName });

    expect((await search.boundingBox())?.height).toBeGreaterThanOrEqual(44);
    await page.getByRole("button", { name: /^Ba Thanh/ }).click();
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
