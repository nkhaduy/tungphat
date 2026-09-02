import { test, expect } from '@playwright/test'
import { cleanupTestUser, seedTestUser } from '../helpers/seedUser'

test.describe('Frontend', () => {
  test.beforeEach(async () => {
    await seedTestUser()
  })

  test.afterEach(async () => {
    await cleanupTestUser()
  })

  test('opens the CMS login directly', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveURL(/\/admin\/login(?:\?.*)?$/)
    await expect(page.getByRole('heading', { name: 'CMS', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Đăng nhập' })).toBeVisible()
  })
})
