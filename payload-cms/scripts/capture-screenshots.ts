import fs from 'node:fs'
import path from 'node:path'
import { chromium, type Page } from '@playwright/test'
import { getPayload } from 'payload'
import config from '../src/payload.config'
import { cleanupTestUser, seedTestUser, testUser } from '../tests/helpers/seedUser'

const output = path.resolve(process.cwd(), '..', 'output', 'playwright', 'payload-cms')
fs.mkdirSync(output, { recursive: true })

async function waitForSettledAdmin(page: Page) {
  await page.waitForFunction(() => !document.body.innerText.includes('Field này không có') && !document.body.innerText.includes('Đang tải...'), undefined, { timeout: 20_000 })
  await page.waitForTimeout(200)
}

await seedTestUser()
const payload = await getPayload({ config })
const user = await payload.find({ collection: 'users', where: { email: { equals: testUser.email } }, limit: 1, overrideAccess: true })

// Remove only prior screenshot fixtures from the local bindings before capturing a clean set.
const previousMedia = await payload.find({
  collection: 'media',
  limit: 100,
  overrideAccess: true,
  where: { alt: { contains: 'fixture screenshot local' } },
})
for (const previous of previousMedia.docs) {
  await payload.delete({ collection: 'media', id: previous.id, overrideAccess: true, overrideLock: true }).catch(() => undefined)
}
const previousArticles = await payload.find({
  collection: 'articles',
  limit: 100,
  overrideAccess: true,
  where: { slug: { equals: 'bai-viet-screenshot-local' } },
})
for (const previous of previousArticles.docs) {
  await payload.delete({ collection: 'articles', id: previous.id, overrideAccess: true, overrideLock: true }).catch(() => undefined)
}

let articleID: number | string | undefined
let mediaID: number | string | undefined

const browser = await chromium.launch({ channel: 'chrome' })
try {
  const desktop = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  await desktop.goto('http://127.0.0.1:3000/admin/login')
  await desktop.locator('.tp-login-view').waitFor({ state: 'visible', timeout: 20_000 })
  await desktop.screenshot({ path: path.join(output, '01-login-desktop.png'), fullPage: true })

  const mobileLogin = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 })
  await mobileLogin.goto('http://127.0.0.1:3000/admin/login')
  await mobileLogin.locator('.tp-login-view').waitFor({ state: 'visible', timeout: 20_000 })
  await mobileLogin.screenshot({ path: path.join(output, '02-login-mobile.png'), fullPage: true })
  await mobileLogin.close()

  const errorPage = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  await errorPage.goto('http://127.0.0.1:3000/admin/login')
  await errorPage.locator('.tp-login-view').waitFor({ state: 'visible', timeout: 20_000 })
  await errorPage.fill('#field-email', 'khong-ton-tai@mdftungphat.com')
  await errorPage.fill('#field-password', 'khong-dung-123')
  await errorPage.click('button[type="submit"]')
  await errorPage.getByText('Lỗi - Email hoặc mật khẩu không chính xác.').waitFor({ timeout: 15_000 }).catch(() => undefined)
  await errorPage.screenshot({ path: path.join(output, '03-error-state.png'), fullPage: true })
  await errorPage.close()

  await desktop.fill('#field-email', testUser.email)
  await desktop.fill('#field-password', testUser.password)
  await desktop.route('**/api/users/login', async (route) => { await new Promise((resolve) => setTimeout(resolve, 700)); await route.continue() })
  await desktop.click('button[type="submit"]')
  await desktop.waitForTimeout(120)
  await desktop.screenshot({ path: path.join(output, '04-loading-state.png'), fullPage: true })
  await desktop.waitForURL(/\/admin\/?$/, { timeout: 20_000 })
  await desktop.unroute('**/api/users/login')

  await desktop.goto('http://127.0.0.1:3000/admin/collections/media/create')
  await desktop.locator('input[type="file"]').setInputFiles(path.resolve('public/brand/logo-horizontal.png'))
  await desktop.locator('input[name="alt"]').fill('Logo Tùng Phát dùng làm fixture screenshot local')
  await desktop.locator('#action-save').click()
  await desktop.waitForURL(/\/admin\/collections\/media\/\d+/, { timeout: 20_000 })
  mediaID = desktop.url().match(/\/media\/(\d+)/)?.[1]
  if (!mediaID) throw new Error('Không lấy được ID media fixture local')
  await desktop.goto('http://127.0.0.1:3000/admin')
  await desktop.getByRole('heading', { name: /Xin chào/ }).waitFor()
  await desktop.waitForTimeout(500)

  const article = await payload.create({ collection: 'articles', draft: true, overrideAccess: true, data: {
    title: 'Bài viết đang chờ biên tập', slug: 'bai-viet-screenshot-local', excerpt: 'Nội dung local dùng để nghiệm thu list, form và version view của Payload CMS Tùng Phát.', category: 'Nghiệm thu', author: 'Ban biên tập Tùng Phát', body: '## Nội dung đang soạn\n\nBản ghi local, không phải dữ liệu production.', featuredImage: Number(mediaID), featuredImageAlt: 'Logo Tùng Phát dùng làm fixture screenshot local', publishedAt: '2026-07-29', legacyUpdatedAt: '2026-07-29', seo: { title: 'Bài viết nghiệm thu Payload CMS Tùng Phát', description: 'Bài viết local dùng để nghiệm thu giao diện Payload CMS, lịch sử phiên bản và trạng thái bản nháp của Tùng Phát.', canonical: '', noindex: true }, _status: 'draft',
  } })
  articleID = article.id

  await desktop.goto('http://127.0.0.1:3000/admin')
  await desktop.getByRole('heading', { name: /Xin chào/ }).waitFor()
  await desktop.screenshot({ path: path.join(output, '05-dashboard-desktop.png'), fullPage: true })

  await desktop.setViewportSize({ width: 1024, height: 900 })
  await desktop.screenshot({ path: path.join(output, '06-dashboard-tablet.png'), fullPage: true })
  await desktop.setViewportSize({ width: 390, height: 844 })
  await desktop.screenshot({ path: path.join(output, '07-dashboard-mobile.png'), fullPage: true })
  await desktop.setViewportSize({ width: 1440, height: 1000 })

  await desktop.goto('http://127.0.0.1:3000/admin/collections/articles')
  await desktop.getByText('Bài viết đang chờ biên tập').first().waitFor()
  await desktop.screenshot({ path: path.join(output, '08-collection-list.png'), fullPage: true })
  await desktop.goto(`http://127.0.0.1:3000/admin/collections/articles/${articleID}`)
  await desktop.locator('input[name="title"]').waitFor()
  await waitForSettledAdmin(desktop)
  await desktop.screenshot({ path: path.join(output, '09-edit-form.png'), fullPage: true })
  await desktop.goto('http://127.0.0.1:3000/admin/collections/media')
  await desktop.getByText('logo-horizontal.png').first().waitFor()
  await waitForSettledAdmin(desktop)
  await desktop.screenshot({ path: path.join(output, '10-media-library.png'), fullPage: true })
  await desktop.goto(`http://127.0.0.1:3000/admin/collections/articles/${articleID}/versions`)
  await desktop.getByText('Bản thảo hiện tại').waitFor()
  await desktop.screenshot({ path: path.join(output, '11-draft-version-view.png'), fullPage: true })
  await desktop.goto('http://127.0.0.1:3000/admin/collections/projects')
  await desktop.getByText('Không có kết quả.').waitFor()
  await desktop.screenshot({ path: path.join(output, '12-empty-state.png'), fullPage: true })

  if (user.docs[0]) {
    await desktop.goto(`http://127.0.0.1:3000/admin/collections/users/${user.docs[0].id}`)
    await desktop.getByRole('button', { name: 'Tùy chọn tài liệu' }).click()
    await desktop.locator('#action-delete').click()
    await desktop.getByRole('dialog').waitFor({ state: 'visible' })
    await desktop.screenshot({ path: path.join(output, '13-confirm-dialog.png'), fullPage: true })
    await desktop.getByRole('dialog').getByRole('button', { name: 'Hủy' }).click()
  }
  await desktop.goto('http://127.0.0.1:3000/admin/khong-ton-tai')
  await desktop.screenshot({ path: path.join(output, '14-not-found.png'), fullPage: true })

  await payload.delete({ collection: 'articles', id: articleID, overrideAccess: true, overrideLock: true })
  articleID = undefined
  await desktop.goto(`http://127.0.0.1:3000/admin/collections/media/${mediaID}`)
  await desktop.getByRole('button', { name: 'Tùy chọn tài liệu' }).click()
  await desktop.locator('#action-delete').click()
  await desktop.locator('#confirm-action').click()
  await desktop.waitForURL(/\/admin\/collections\/media\/?$/, { timeout: 20_000 })
  mediaID = undefined
  await desktop.close()
} finally {
  await browser.close()
  if (articleID) await payload.delete({ collection: 'articles', id: articleID, overrideAccess: true, overrideLock: true }).catch(() => undefined)
  if (mediaID) await payload.delete({ collection: 'media', id: mediaID, overrideAccess: true, overrideLock: true }).catch(() => undefined)
  await cleanupTestUser()
}

console.log(`Đã lưu screenshot tại ${output}`)
process.exit(0)
