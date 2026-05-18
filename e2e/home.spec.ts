import { test, expect } from '@playwright/test'

test.describe('Home page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('renders main heading and tagline', async ({ page }) => {
    await expect(page).toHaveTitle(/gf.?vid.?chat/i)

    const heading = page.getByRole('heading', { level: 1 })
    await expect(heading).toBeVisible()
    await expect(heading).toContainText(/gf.?vid.?chat/i)

    await expect(
      page.getByText(/Stay connected while you sleep/i)
    ).toBeVisible()
  })

  test('shows Create Room and Join Room cards', async ({ page }) => {
    await expect(page.getByRole('button', { name: /create room/i })).toBeVisible()
    await expect(page.getByText(/Start a Room/i)).toBeVisible()
    await expect(page.getByText(/Join a Room/i)).toBeVisible()
  })

  test('header navigation links work', async ({ page }) => {
    await page.getByRole('link', { name: /^settings$/i }).click()
    await expect(page).toHaveURL(/\/settings$/)

    await page.getByRole('link', { name: /^home$/i }).click()
    await expect(page).toHaveURL(/\/$/)
  })
})
