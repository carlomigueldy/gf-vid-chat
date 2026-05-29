import { test, expect } from '@playwright/test'

test.describe('Home page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('renders hero heading and tagline', async ({ page }) => {
    await expect(page).toHaveTitle(/gf.?vid.?chat/i)

    const heading = page.getByRole('heading', { level: 1 })
    await expect(heading).toBeVisible()
    await expect(heading).toContainText(/stay close/i)

    await expect(page.getByText(/just you two/i)).toBeVisible()
    await expect(page.getByRole('link', { name: 'gf-vid-chat home' })).toBeVisible()
  })

  test('shows the Start/Join toggle and the Create Room button', async ({ page }) => {
    await expect(page.getByRole('radio', { name: /start a room/i })).toBeVisible()
    await expect(page.getByRole('radio', { name: /join a room/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /create room/i })).toBeVisible()
  })

  test('header navigation links work', async ({ page }) => {
    await page.getByRole('link', { name: /^settings$/i }).click()
    await expect(page).toHaveURL(/\/settings$/)

    await page.getByRole('link', { name: /^home$/i }).click()
    await expect(page).toHaveURL(/\/$/)
  })
})
