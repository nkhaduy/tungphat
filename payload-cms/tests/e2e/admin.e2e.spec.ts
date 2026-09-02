import path from 'node:path'
import AxeBuilder from '@axe-core/playwright'
import { test, expect, Page } from '@playwright/test'
import { login } from '../helpers/login'
import { seedTestUser, cleanupTestUser, testUser } from '../helpers/seedUser'

async function expectNoSeriousAxeIssues(page: Page) {
  await page.waitForTimeout(250)
  const results = await new AxeBuilder({ page }).analyze()
  const blocking = results.violations.filter((violation) => violation.impact === 'critical' || violation.impact === 'serious')
  expect(blocking, blocking.map((violation) => `${violation.id}: ${violation.help}`).join('\n')).toEqual([])
}

async function expectNoPageOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true)
}

test.describe('Admin Panel', () => {
  let page: Page
  let testUserId: string | number

  test.beforeAll(async ({ browser }) => {
    testUserId = await seedTestUser()

    const context = await browser.newContext()
    page = await context.newPage()

    await login({ page, user: testUser })
  })

  test.afterAll(async () => {
    await page.context().close()
    await cleanupTestUser()
  })

  test('login tối giản có logo, CMS, password toggle, loading ổn định và lỗi chung', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    const loginPage = await context.newPage()
    await loginPage.goto('/admin/login')
    await expect(loginPage.locator('.tp-login-view')).toBeVisible()
    await expect(loginPage.locator('.tp-login-card__logo')).toBeVisible()
    await expect(loginPage.getByRole('heading', { name: 'CMS', exact: true })).toBeVisible()
    await expect(loginPage.locator('.tp-login-view__story-image')).toHaveCount(0)
    await expect(loginPage.getByText('KHU VỰC NỘI BỘ')).toHaveCount(0)
    await expect(loginPage.getByText('Đăng nhập để tiếp tục chỉnh sửa nội dung website.')).toHaveCount(0)
    await expect(loginPage.getByRole('link', { name: 'Quên mật khẩu?' })).toHaveCount(0)
    await expectNoSeriousAxeIssues(loginPage)

    const password = loginPage.locator('#field-password')
    await password.fill('mat-khau-kiem-thu')
    await loginPage.getByRole('button', { name: 'Hiện mật khẩu' }).click()
    await expect(password).toHaveAttribute('type', 'text')
    await loginPage.getByRole('button', { name: 'Ẩn mật khẩu' }).click()
    await expect(password).toHaveAttribute('type', 'password')

    await loginPage.fill('#field-email', 'khong-ton-tai@mdftungphat.com')
    await password.fill('khong-dung-123')
    await loginPage.getByRole('button', { name: 'Đăng nhập' }).click()
    await expect(loginPage.getByText('Lỗi - Email hoặc mật khẩu không chính xác.')).toBeVisible()
    await expect(loginPage.locator('.field-error')).toHaveCount(0)

    await loginPage.reload()
    await loginPage.fill('#field-email', testUser.email)
    await loginPage.fill('#field-password', testUser.password)
    const submit = loginPage.getByRole('button', { name: 'Đăng nhập' })
    const width = await submit.evaluate((element) => element.getBoundingClientRect().width)
    await loginPage.route('**/api/users/login', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 500))
      await route.continue()
    })
    await submit.click()
    await expect(loginPage.getByRole('button', { name: 'Đang đăng nhập...' })).toBeDisabled()
    expect(await loginPage.getByRole('button', { name: 'Đang đăng nhập...' }).evaluate((element) => element.getBoundingClientRect().width)).toBe(width)
    await loginPage.waitForURL(/\/admin\/?$/)
    await context.close()
  })

  test('can navigate to dashboard', async () => {
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/admin\/?$/)
    await expect(page.getByRole('heading', { name: /Xin chào/ })).toBeVisible()
  })

  test('dashboard operator có việc cần xử lý, tìm kiếm và chế độ nâng cao', async () => {
    await page.goto('/admin')
    await expect(page.getByRole('heading', { name: 'Tìm mọi thứ', exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Việc cần xử lý', exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Tìm mã màu', exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Xem khách hỏi', exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Tổng quan', exact: true })).toBeVisible()
    await expect(page.getByText('Trạng thái hệ thống', { exact: true })).toHaveCount(0)
    const systemGroup = page.locator('[id="nav-group-Quản trị hệ thống"]')
    await expect(systemGroup).toBeHidden()

    const search = page.getByRole('combobox', { name: 'Tìm mọi thứ' })
    await search.fill('301')
    await expect(page.getByRole('listbox', { name: 'Kết quả tìm kiếm' })).toBeVisible()
    await expect(page.getByText(/Chưa có kết quả|Mã màu/).first()).toBeVisible()
    await search.press('Escape')
    await expect(search).toHaveAttribute('aria-expanded', 'false')

    await page.getByRole('button', { name: 'Mở Menu', exact: true }).click()
    await page.getByRole('button', { name: 'Nâng cao', exact: true }).click()
    await expect(systemGroup).toBeVisible()
    await page.getByRole('button', { name: 'Đơn giản', exact: true }).click()
    await expect(systemGroup).toBeHidden()
    await page.getByRole('button', { name: 'Đóng Menu', exact: true }).click()
  })

  test('can navigate to list view', async () => {
    await page.goto('/admin/collections/articles')
    await expect(page).toHaveURL(/\/admin\/collections\/articles/)
    const listViewArtifact = page.locator('h1', { hasText: 'Bài viết' }).first()
    await expect(listViewArtifact).toBeVisible()
  })

  test('can navigate to edit view', async () => {
    await page.goto('/admin/collections/articles/create')
    await expect(page).toHaveURL(/\/admin\/collections\/articles\/create/)
    const editViewArtifact = page.locator('input[name="title"]')
    await expect(editViewArtifact).toBeVisible()
  })

  test('upload media qua local R2 và đọc lại file thật', async () => {
    await page.goto('/admin/collections/media/create')
    await page.locator('input[type="file"]').setInputFiles(path.resolve('public/brand/logo-horizontal.png'))
    await page.locator('input[name="alt"]').fill('Logo Tùng Phát dùng để kiểm thử upload R2 local')
    await page.locator('#action-save').click()
    await page.waitForURL(/\/admin\/collections\/media\/\d+/)

    const id = page.url().match(/\/media\/(\d+)/)?.[1]
    expect(id).toBeTruthy()
    const response = await page.request.get(`/api/media/${id}`)
    expect(response.ok()).toBe(true)
    const media = await response.json() as { filename?: string; mimeType?: string; url?: string }
    expect(media.filename).toContain('logo-horizontal')
    expect(media.mimeType).toBe('image/png')
    expect(media.url).toBeTruthy()

    const fileResponse = await page.request.get(media.url as string)
    expect(fileResponse.ok()).toBe(true)
    expect(fileResponse.headers()['content-type']).toContain('image/png')
    expect((await fileResponse.body()).byteLength).toBeGreaterThan(100)
    await page.getByRole('button', { name: 'Tùy chọn tài liệu' }).click()
    await page.locator('#action-delete').click()
    await page.locator('#confirm-action').click()
    await page.waitForURL(/\/admin\/collections\/media\/?$/)
    expect((await page.request.get(`/api/media/${id}`)).status()).toBe(404)
  })

  test('Axe không có lỗi serious/critical trên các view chính và dialog', async () => {
    test.setTimeout(120_000)
    const routes = [
      '/admin',
      '/admin/collections/articles',
      '/admin/collections/articles/create',
      '/admin/collections/media',
    ]
    for (const route of routes) {
      await page.goto(route)
      await expectNoSeriousAxeIssues(page)
    }

    await page.goto(`/admin/collections/users/${testUserId}`)
    await page.getByRole('button', { name: 'Tùy chọn tài liệu' }).click()
    await page.locator('#action-delete').click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expectNoSeriousAxeIssues(page)
    await dialog.getByRole('button', { name: 'Hủy' }).click()
  })

  test('shell responsive không overflow tại 1440/1024/768/390', async () => {
    for (const width of [1440, 1024, 768, 390]) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 900 })
      await page.goto('/admin')
      await expectNoPageOverflow(page)
    }
  })
})
