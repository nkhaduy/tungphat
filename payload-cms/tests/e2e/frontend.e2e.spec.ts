import { test, expect } from '@playwright/test'

test.describe('Frontend', () => {
  test('opens the CMS login directly', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveURL(/\/admin\/login(?:\?.*)?$/)
    await expect(page.getByRole('heading', { name: 'CMS', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Đăng nhập' })).toBeVisible()
  })
})
