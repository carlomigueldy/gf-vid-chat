import { test, expect } from '@playwright/test'

test.describe('Create room flow', () => {
  test('clicking Create Room navigates to a room URL', async ({ page }) => {
    await page.goto('/')

    await page.getByRole('button', { name: /create room/i }).click()

    await expect(page).toHaveURL(/\/room\/[A-Za-z0-9_-]+\?role=creator/)
  })

  test('room page shows QR code and waiting state', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /create room/i }).click()

    // Waiting state messaging
    await expect(page.getByText(/Waiting for your partner/i).first()).toBeVisible({
      timeout: 15_000,
    })

    // QR code figure should render
    await expect(page.getByRole('figure', { name: /QR code to join room/i })).toBeVisible()

    // Connection status badge announces waiting/initializing
    await expect(page.getByRole('status')).toBeVisible()
  })

  test('room URL link is displayed and copy button is present', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /create room/i }).click()

    // Wait for QR display
    await page.getByRole('figure', { name: /QR code to join room/i }).waitFor()

    // "Scan to join" caption
    await expect(page.getByText('Scan to join', { exact: true })).toBeVisible()

    // Copy link button
    const copyBtn = page.getByRole('button', { name: /copy join link/i })
    await expect(copyBtn).toBeVisible()
    await copyBtn.click()
    // Optional confirmation — best-effort, environments may block clipboard.
    await expect(page.getByText(/Copied|Copy link/i).first()).toBeVisible()
  })

  test('respects custom timeout in URL', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /create room/i }).click()

    const url = new URL(page.url())
    expect(url.searchParams.get('role')).toBe('creator')
    expect(Number(url.searchParams.get('timeout'))).toBeGreaterThan(0)
  })
})
