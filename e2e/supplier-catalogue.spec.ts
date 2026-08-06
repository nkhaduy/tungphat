import { expect, test } from "@playwright/test";

const approvedBaThanhMessage =
  "Tôi cần kiểm tra mã BT 111 của Ba Thanh tại Tùng Phát. Vui lòng tư vấn loại ván, quy cách, tình trạng hàng và dịch vụ gia công phù hợp.";

test.describe("supplier catalogue customer journeys", () => {
  test("homepage supplier cards open the live catalogue routes", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(
      page.getByRole("link", { name: "Tùng Phát", exact: true }).first(),
    ).toBeVisible();

    await expect(
      page.getByRole("link", { name: /Thanh Thuỳ.*xem catalogue/i }),
    ).toHaveAttribute("href", "/thuong-hieu/thanh-thuy/");
    await expect(
      page.getByRole("link", { name: /Ba Thanh.*xem bảng mã/i }),
    ).toHaveAttribute("href", "/ma-mau-melamine/ba-thanh/");
    await expect(
      page.getByRole("link", { name: /An Cường.*xem dữ liệu mẫu/i }),
    ).toHaveAttribute("href", "/catalogue/an-cuong/");
    await expect(
      page
        .getByRole("contentinfo")
        .getByRole("link", { name: "Tất cả sản phẩm", exact: true }),
    ).toHaveAttribute("href", "/san-pham/#catalogue");
  });

  test("exact code search supports Enter, Escape and browser restoration", async ({
    page,
  }) => {
    await page.goto("/catalogue/");
    const search = page.getByRole("searchbox", {
      name: "Tìm catalogue nhà cung cấp",
    });

    await search.fill("bt-111");
    await expect(page).toHaveURL(/q=bt-111/i);
    await expect(
      page.getByRole("link", { name: /Ba Thanh.*BT 111/i }).first(),
    ).toBeVisible();
    await search.press("Enter");
    await expect(page).toHaveURL(/\/ma-mau-melamine\/ba-thanh\/bt-111\/$/);

    await page.goBack();
    await expect(search).toHaveValue("bt-111");
    await search.press("Escape");
    await expect(search).toHaveValue("");
    await expect(page).not.toHaveURL(/q=/);
  });

  test("search and filters keep supplier and taxonomy explicit", async ({
    page,
  }) => {
    await page.goto("/catalogue/");
    const search = page.getByRole("searchbox", {
      name: "Tìm catalogue nhà cung cấp",
    });
    await search.fill("An Cuong");
    await expect(
      page.getByRole("link", { name: /Khớp chính xác.*An Cường/i }),
    ).toHaveAttribute("href", "/catalogue/an-cuong/");
    await expect(
      page.getByRole("link", { name: /An Cường, mã MFC - MS 01012 T/i }),
    ).toHaveCount(0);

    await search.fill("");
    await page
      .getByRole("combobox", { name: "Lọc theo nhà cung cấp" })
      .selectOption("ba-thanh");
    await page
      .getByRole("combobox", { name: "Lọc theo danh mục" })
      .selectOption({ label: "Vân gỗ" });
    await expect(page).toHaveURL(/supplier=ba-thanh/);
    await expect(page).toHaveURL(/category=van-go/);
    await expect(
      page.getByRole("link", { name: /Ba Thanh, mã BT 111/i }),
    ).toBeVisible();
  });

  test("Ba Thanh detail exposes copy and the approved inquiry URL near the code", async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/ma-mau-melamine/ba-thanh/bt-111/");

    const copy = page.getByRole("button", { name: "Sao chép mã BT 111" });
    await expect(copy).toBeVisible();
    await copy.click();
    await expect(page.getByText("Đã sao chép mã BT 111")).toBeVisible();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      "BT 111",
    );

    const zalo = page.getByRole("link", {
      name: /Gửi mã BT 111.*qua Zalo/i,
    });
    const href = await zalo.getAttribute("href");
    expect(new URL(href!).searchParams.get("text")).toBe(
      approvedBaThanhMessage,
    );
  });

  test("An Cuong explains the limited scope and shows all seven samples", async ({
    page,
  }) => {
    await page.goto("/catalogue/an-cuong/");

    await expect(page.getByText(/7 mẫu dữ liệu tham khảo/i)).toBeVisible();
    await expect(
      page
        .getByRole("region", { name: "Mẫu dữ liệu An Cường" })
        .getByRole("article"),
    ).toHaveCount(7);
    await expect(page.getByText("MFC - MS 01012 T")).toBeVisible();
    await expect(page.getByText("3DE 02 LL 2500")).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      /noindex, follow/i,
    );
  });

  test("noindex code pages remain usable and keep breadcrumb context", async ({
    page,
  }) => {
    await page.goto("/ma-mau-melamine/ba-thanh/bt-06/");

    await expect(
      page.getByRole("heading", { name: "BT 06", exact: true }),
    ).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      /noindex/i,
    );
    const breadcrumb = page.getByRole("navigation", { name: "Breadcrumb" });
    await expect(
      breadcrumb.getByRole("link", { name: "Bảng mã Melamine Ba Thanh" }),
    ).toHaveAttribute("href", "/ma-mau-melamine/ba-thanh/");
    await expect(
      page.getByRole("button", { name: "Sao chép mã BT 06" }),
    ).toBeVisible();
  });

  test("Ba Thanh grid gives every copy action a unique accessible name", async ({
    page,
  }) => {
    await page.goto("/ma-mau-melamine/ba-thanh/");
    const copyButtons = page.getByRole("button", { name: /^Sao chép mã / });
    await expect(copyButtons.first()).toBeVisible();
    const names = await copyButtons.evaluateAll((buttons) =>
      buttons.map((button) => button.getAttribute("aria-label")),
    );

    expect(names.length).toBeGreaterThan(1);
    expect(new Set(names).size).toBe(names.length);
  });

  test("Ba Thanh lookup restores query and filter after detail navigation and reload", async ({
    page,
  }) => {
    await page.goto("/ma-mau-melamine/ba-thanh/");
    const search = page.getByRole("searchbox", {
      name: "Tìm theo mã, tên hoặc nhóm vân",
    });
    const category = page.getByRole("combobox", { name: "Lọc nhóm màu" });

    await search.fill("BT111");
    await category.selectOption("van-go");
    await expect(page).toHaveURL(/q=BT111/);
    await expect(page).toHaveURL(/category=van-go/);
    await page
      .getByRole("link", { name: /BT 111/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/ma-mau-melamine\/ba-thanh\/bt-111\/$/);
    await page.goBack();
    await expect(page).toHaveURL(/q=BT111/);
    await expect(page).toHaveURL(/category=van-go/);
    await expect(search).toHaveValue("BT111");
    await expect(category).toHaveValue("van-go");

    await page.reload();
    await expect(search).toHaveValue("BT111");
    await expect(category).toHaveValue("van-go");
  });

  test("legacy noindex supplier catalogue routes hand customers to live data", async ({
    page,
  }) => {
    await page.goto("/catalogue/ba-thanh/");

    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      /noindex/i,
    );
    await expect(
      page.getByRole("link", { name: /Mở bảng mã Ba Thanh/i }),
    ).toHaveAttribute("href", "/ma-mau-melamine/ba-thanh/");
    await expect(
      page.getByText(/đang (?:được )?(?:cập nhật|bổ sung)/i),
    ).toHaveCount(0);
  });

  test("catalogue content remains useful without JavaScript", async ({
    browser,
  }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto("/catalogue/");
    await expect(
      page.getByRole("heading", {
        name: "Tìm đúng mã vật liệu từ ba nhà cung cấp.",
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Nhà cung cấp Ba Thanh/i }),
    ).toHaveAttribute("href", "/ma-mau-melamine/ba-thanh/");
    await context.close();
  });

  test("catalogue-level Zalo advice names the available suppliers", async ({
    page,
  }) => {
    await page.goto("/catalogue/");
    const href = await page
      .getByRole("link", { name: "Nhắn Zalo tư vấn" })
      .getAttribute("href");

    expect(new URL(href!).searchParams.get("text")).toBe(
      "Tôi cần tư vấn catalogue Thanh Thuỳ, Ba Thanh hoặc An Cường tại Tùng Phát.",
    );
  });
});

test.describe("supplier catalogue mobile navigation", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("mobile menu presents one supplier catalogue group and locks background scroll", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Mở menu" }).click();

    await expect(
      page.getByRole("link", { name: "Catalogue nhà cung cấp", exact: true }),
    ).toBeVisible();
    await expect(page.locator("body")).toHaveCSS("overflow", "hidden");
    await expect(page.getByText("Thương hiệu", { exact: true })).toHaveCount(0);

    await page.getByRole("button", { name: "Đóng menu" }).click();
    await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
  });

  test("Escape closes the mobile menu and restores focus to its trigger", async ({
    page,
  }) => {
    await page.goto("/");
    const trigger = page.getByRole("button", { name: "Mở menu" });
    await trigger.focus();
    await trigger.press("Enter");
    await expect(page.getByRole("button", { name: "Đóng menu" })).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
    await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
  });

  test("mobile catalogue puts code search before supplier browsing", async ({
    page,
  }) => {
    await page.goto("/catalogue/");
    const searchBox = page.getByRole("searchbox", {
      name: "Tìm catalogue nhà cung cấp",
    });
    const firstSupplier = page.getByRole("link", {
      name: /Nhà cung cấp Thanh Thuỳ/i,
    });
    const searchPosition = await searchBox.boundingBox();
    const supplierPosition = await firstSupplier.boundingBox();

    expect(searchPosition).not.toBeNull();
    expect(supplierPosition).not.toBeNull();
    expect(searchPosition!.y).toBeLessThan(supplierPosition!.y);
  });

  test("mobile search targets stay usable with reduced motion and rotation", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/catalogue/");
    const searchBox = page.getByRole("searchbox", {
      name: "Tìm catalogue nhà cung cấp",
    });
    const box = await searchBox.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
    await searchBox.fill("query-<>-không-tồn-tại-".repeat(8));
    await expect(page.getByText("Chưa tìm thấy mã phù hợp")).toBeVisible();
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      ),
    ).toBeLessThanOrEqual(1);

    await page.setViewportSize({ width: 844, height: 390 });
    await expect(searchBox).toBeVisible();
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      ),
    ).toBeLessThanOrEqual(1);
  });

  test("catalogue remains operable at 200 percent zoom", async ({ page }) => {
    await page.goto("/catalogue/");
    await page.evaluate(() => {
      document.documentElement.style.zoom = "2";
    });
    await expect(
      page.getByRole("searchbox", { name: "Tìm catalogue nhà cung cấp" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Nhà cung cấp Thanh Thuỳ/i }),
    ).toBeVisible();
  });
});

const catalogueViewports = [
  { name: "desktop 1440x900", width: 1440, height: 900 },
  { name: "desktop 1280x800", width: 1280, height: 800 },
  { name: "tablet 768x1024", width: 768, height: 1024 },
  { name: "mobile 390x844", width: 390, height: 844 },
  { name: "mobile 375x667", width: 375, height: 667 },
  { name: "mobile 360x800", width: 360, height: 800 },
] as const;

test.describe("supplier catalogue requested viewport matrix", () => {
  for (const viewport of catalogueViewports) {
    test(`${viewport.name} keeps navigation and exact-code lookup operable`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await page.goto("/catalogue/");

      if (viewport.width >= 1280) {
        await expect(
          page
            .getByRole("navigation", { name: "Điều hướng chính" })
            .getByRole("link", {
              name: "Catalogue nhà cung cấp",
              exact: true,
            }),
        ).toBeVisible();
      } else {
        const menu = page.getByRole("button", { name: "Mở menu" });
        await menu.click();
        await expect(
          page.getByRole("link", {
            name: "Catalogue nhà cung cấp",
            exact: true,
          }),
        ).toBeVisible();
        await page.getByRole("button", { name: "Đóng menu" }).click();
      }

      const search = page.getByRole("searchbox", {
        name: "Tìm catalogue nhà cung cấp",
      });
      await search.fill("BT111");
      await expect(
        page.getByRole("link", { name: /Ba Thanh.*BT 111/i }).first(),
      ).toBeVisible();
      expect((await search.boundingBox())?.height).toBeGreaterThanOrEqual(44);
      expect(
        await page.evaluate(
          () =>
            document.documentElement.scrollWidth -
            document.documentElement.clientWidth,
        ),
      ).toBeLessThanOrEqual(1);
    });
  }
});
