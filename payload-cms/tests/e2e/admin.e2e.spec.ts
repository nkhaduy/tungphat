import path from 'node:path'
import AxeBuilder from '@axe-core/playwright'
import { test, expect, Page, request } from '@playwright/test'
import { login } from '../helpers/login'
import { seedTestUser, cleanupTestUser, cleanupTestEditorialArtifacts, testUser } from '../helpers/seedUser'

async function expectNoSeriousAxeIssues(page: Page) {
  await page.waitForTimeout(250)
  const results = await new AxeBuilder({ page }).analyze()
  const blocking = results.violations.filter((violation) => violation.impact === 'critical' || violation.impact === 'serious')
  expect(blocking, blocking.map((violation) => `${violation.id}: ${violation.help}`).join('\n')).toEqual([])
}

async function expectNoPageOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true)
}

async function requestFromPage(page: Page, url: string, method = 'GET', data?: unknown) {
  return page.evaluate(async ({ url, method, data }) => {
    const response = await fetch(url, {
      method,
      credentials: 'include',
      ...(data === undefined ? {} : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    })
    return { status: response.status, body: await response.json().catch(() => null) as unknown }
  }, { url, method, data })
}

function responseDoc(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object') return {}
  const record = value as Record<string, unknown>
  return record.doc && typeof record.doc === 'object' ? record.doc as Record<string, unknown> : record
}

test.describe('Admin Panel', () => {
  let page: Page
  let testUserId: string | number
  test.beforeAll(async ({ browser }) => {
    await cleanupTestEditorialArtifacts()
    testUserId = await seedTestUser()

    const context = await browser.newContext()
    page = await context.newPage()

    await login({ page, user: testUser })
  })

  test.afterAll(async () => {
    await cleanupTestEditorialArtifacts()
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

  test('chuyển từ Nâng cao về Đơn giản vẫn ẩn field kỹ thuật', async () => {
    await page.goto('/admin')
    await page.evaluate(() => window.localStorage.setItem('tp-admin-mode', 'advanced'))
    await page.goto('/admin/collections/material-codes/create')
    await expect(page.locator('body')).toHaveAttribute('data-tp-admin-mode', 'advanced')

    await page.getByRole('button', { name: 'Mở Menu', exact: true }).click()
    await page.getByRole('button', { name: 'Đơn giản', exact: true }).click()

    await page.waitForTimeout(300)
    await expect(page.locator('body')).toHaveAttribute('data-tp-admin-mode', 'simple')
  })

  test('can navigate to list view', async () => {
    await page.goto('/admin/collections/articles')
    await expect(page).toHaveURL(/\/admin\/collections\/articles/)
    const listViewArtifact = page.locator('h1', { hasText: 'Bài viết' }).first()
    await expect(listViewArtifact).toBeVisible()
  })

  test('draft autosaves, previews Lexical content, then publishes, updates and unpublishes through Admin UI', async () => {
    await page.goto('/admin/collections/articles/create')
    await expect(page).toHaveURL(/\/admin\/collections\/articles\/\d+$/, { timeout: 30_000 })
    const articleID = page.url().match(/\/articles\/(\d+)$/)?.[1]
    expect(articleID).toBeTruthy()

    const title = 'Bản nháp kiểm thử editor Lexical'
    const slug = `e2e-editor-${Date.now()}`
    const content = 'Nội dung kiểm thử bản nháp và xem trước.'
    const editor = page.locator('.ContentEditable__root[contenteditable="true"]').first()
    await expect(page.locator('input[name="title"]')).toBeVisible()
    await expect(editor).toBeVisible()
    await page.locator('input[name="title"]').fill(title)
    await page.locator('input[name="slug"]').fill(slug)
    await page.getByRole('textbox', { name: 'Chọn excerpt' }).fill('Bản nháp này kiểm tra lưu tự động, nội dung Lexical và bản xem trước có xác thực trong môi trường thử nghiệm.')
    await editor.fill(content)
    await expect.poll(async () => {
      const response = await requestFromPage(page, `/api/articles/${articleID}?draft=true`)
      if (response.status !== 200 || !response.body || typeof response.body !== 'object') return false
      const doc = response.body as Record<string, unknown>
      return doc.title === title && JSON.stringify(doc.editorContent).includes(content)
    }, { timeout: 30_000, intervals: [500, 1_000, 1_500] }).toBe(true)

    const draftResponse = await requestFromPage(page, `/api/articles/${articleID}?draft=true`)
    expect(draftResponse.status).toBe(200)
    const draft = draftResponse.body as Record<string, unknown>
    expect(draft.title).toBe(title)
    expect(draft._status).toBe('draft')
    expect(draft.editorContent).toBeTruthy()

    const publicRequest = await request.newContext({ baseURL: 'http://127.0.0.1:3000' })
    const hiddenDraft = await publicRequest.get(`/api/articles/${articleID}`)
    expect(hiddenDraft.status()).toBe(404)

    await page.goto(`/preview/articles/${slug}`)
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/i)
    const preview = page.frameLocator('iframe[title="Bản xem trước nội dung Tùng Phát"]')
    await expect(preview.getByRole('heading', { name: title })).toBeVisible()
    await expect(preview.getByText('Nội dung kiểm thử bản nháp và xem trước.')).toHaveCount(1)

    await page.goto('/admin/collections/media/create')
    await page.locator('input[type="file"]').setInputFiles(path.resolve('public/brand/workshop-login.webp'))
    await page.locator('input[name="alt"]').fill('Ảnh kiểm thử editor local')
    await page.locator('#action-save').click()
    await expect(page).toHaveURL(/\/admin\/collections\/media\/(\d+)/, { timeout: 30_000 })
    const mediaID = page.url().match(/\/media\/(\d+)/)?.[1]
    expect(mediaID).toBeTruthy()
    const mediaCheck = await requestFromPage(page, `/api/media/${mediaID}`)
    expect(mediaCheck.status).toBe(200)
    expect((mediaCheck.body as { id?: number }).id).toBe(Number(mediaID))
    await page.goto(`/admin/collections/articles/${articleID}`)

    const today = new Date().toISOString().slice(0, 10)
    const preparedDraft = await requestFromPage(page, `/api/articles/${articleID}`, 'PATCH', {
        _status: 'draft',
        featuredImage: Number(mediaID),
        featuredImageAlt: 'Logo Tùng Phát dùng cho kiểm thử editor',
        category: 'Kiểm thử',
        author: 'Ban biên tập Tùng Phát',
        publishedAt: today,
        legacyUpdatedAt: today,
        seo: {
          title: 'Bản nháp kiểm thử xuất bản website',
          description: 'Metadata này chỉ dùng trong bài kiểm thử cô lập để xác nhận quy trình xuất bản và gỡ đăng trên CMS Payload.',
          canonical: `https://gotungphat.com/bai-viet/${slug}`,
          noindex: true,
        },
    })
    expect(preparedDraft.status, JSON.stringify(preparedDraft.body)).toBe(200)
    expect(responseDoc(preparedDraft.body)._status).toBe('draft')
    expect((await publicRequest.get(`/api/articles/${articleID}`)).status()).toBe(404)

    await page.reload()
    const publishButton = page.locator('#action-save')
    await expect(publishButton).toBeEnabled()
    await publishButton.click()
    await expect.poll(async () => {
      const response = await requestFromPage(page, `/api/articles/${articleID}?draft=true`)
      return responseDoc(response.body)._status
    }, { timeout: 30_000, intervals: [500, 1_000, 1_500] }).toBe('published')
    expect((await publicRequest.get(`/api/articles/${articleID}`)).status()).toBe(200)

    const updatedTitle = `${title} — đã cập nhật qua Admin UI`
    await page.locator('input[name="title"]').fill(updatedTitle)
    await expect.poll(async () => {
      const response = await requestFromPage(page, `/api/articles/${articleID}?draft=true`)
      return responseDoc(response.body).title
    }, { timeout: 30_000, intervals: [500, 1_000, 1_500] }).toBe(updatedTitle)
    await expect(publishButton).toBeEnabled()
    await publishButton.click()
    await expect.poll(async () => {
      const response = await publicRequest.get(`/api/articles/${articleID}`)
      if (!response.ok()) return null
      return (await response.json() as { title?: string }).title
    }, { timeout: 30_000, intervals: [500, 1_000, 1_500] }).toBe(updatedTitle)

    await page.getByRole('button', { name: 'Tùy chọn tài liệu' }).click()
    await expect(page.locator('#action-unpublish')).toBeVisible()
    await page.locator('#action-unpublish').click()
    await expect(page.getByRole('heading', { name: 'Xác nhận, ngưng xuất bản' })).toBeVisible()
    await page.locator('#confirm-action').click()
    await expect.poll(async () => {
      const response = await requestFromPage(page, `/api/articles/${articleID}?draft=true`)
      return responseDoc(response.body)._status
    }, { timeout: 30_000, intervals: [500, 1_000, 1_500] }).toBe('draft')
    expect((await publicRequest.get(`/api/articles/${articleID}`)).status()).toBe(404)
    await publicRequest.dispose()
  })

  test('upload media qua local R2 và đọc lại file thật', async () => {
    await page.goto('/admin/collections/media/create')
    await page.locator('input[type="file"]').setInputFiles(path.resolve('public/brand/logo-horizontal.png'))
    await page.locator('input[name="alt"]').fill('Logo Tùng Phát dùng để kiểm thử upload R2 local')
    await page.locator('#action-save').click()
    await expect(page).toHaveURL(/\/admin\/collections\/media\/\d+/, { timeout: 30_000 })

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
