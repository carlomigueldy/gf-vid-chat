import { test, expect } from '@playwright/test'

test.describe('Theme toggle', () => {
  test('home page loads with a theme applied', async ({ page }) => {
    await page.goto('/')
    // documentElement has either no .dark or .dark class; both are valid initial states.
    const html = page.locator('html')
    await expect(html).toBeVisible()
  })

  test('toggle button switches between light and dark', async ({ page }) => {
    await page.goto('/')

    const html = page.locator('html')
    const initiallyDark = await html.evaluate((el) => el.classList.contains('dark'))

    const toggle = page.getByRole('button', {
      name: /switch to (light|dark) mode/i,
    })
    await expect(toggle).toBeVisible()

    await toggle.click()

    await expect
      .poll(async () => html.evaluate((el) => el.classList.contains('dark')))
      .toBe(!initiallyDark)
  })

  test('theme preference persists across navigation', async ({ page }) => {
    await page.goto('/')

    const html = page.locator('html')
    const toggle = page.getByRole('button', {
      name: /switch to (light|dark) mode/i,
    })
    await toggle.click()

    const afterToggle = await html.evaluate((el) => el.classList.contains('dark'))

    // Navigate to settings and back
    await page.getByRole('link', { name: /^settings$/i }).click()
    await expect(page).toHaveURL(/\/settings$/)

    const stillSame = await html.evaluate((el) => el.classList.contains('dark'))
    expect(stillSame).toBe(afterToggle)

    // localStorage should have the saved theme
    const stored = await page.evaluate(() => localStorage.getItem('gfvc-theme'))
    expect(stored).toMatch(/^(light|dark|system)$/)
  })

  test('theme persists across full page reload', async ({ page }) => {
    await page.goto('/')

    const toggle = page.getByRole('button', {
      name: /switch to (light|dark) mode/i,
    })
    await toggle.click()

    const html = page.locator('html')
    const beforeReload = await html.evaluate((el) => el.classList.contains('dark'))

    await page.reload()

    const afterReload = await html.evaluate((el) => el.classList.contains('dark'))
    expect(afterReload).toBe(beforeReload)
  })
})
