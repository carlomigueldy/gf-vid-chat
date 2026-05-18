import { test, expect } from '@playwright/test'

test.describe('Join room flow', () => {
  test('Join card is visible on home page', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText(/Join a Room/i)).toBeVisible()
    await expect(
      page.getByText(/Scan, upload, or paste a room link/i)
    ).toBeVisible()
  })

  test('all three join tabs are present', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('tab', { name: /scan/i })).toBeVisible()
    await expect(page.getByRole('tab', { name: /upload/i })).toBeVisible()
    await expect(page.getByRole('tab', { name: /paste/i })).toBeVisible()
  })

  test('paste tab has input field and join button', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('tab', { name: /paste/i }).click()

    const input = page.getByLabel(/room link or ID/i)
    await expect(input).toBeVisible()

    const joinButton = page.getByRole('button', { name: /^join room$/i })
    await expect(joinButton).toBeVisible()
    await expect(joinButton).toBeDisabled()
  })

  test('pasting a valid room ID navigates to the room as joiner', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('tab', { name: /paste/i }).click()

    await page.getByLabel(/room link or ID/i).fill('test-room-1234')
    await page.getByRole('button', { name: /^join room$/i }).click()

    await expect(page).toHaveURL(/\/room\/test-room-1234\?role=joiner/)
  })

  test('pasting an invalid value shows an error', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('tab', { name: /paste/i }).click()

    await page.getByLabel(/room link or ID/i).fill('!!')
    await page.getByRole('button', { name: /^join room$/i }).click()

    await expect(page.getByRole('alert')).toContainText(/valid room link/i)
  })

  test('navigating directly to /room/:id?role=joiner loads room page', async ({ page }) => {
    await page.goto('/room/direct-join-abc?role=joiner')

    // Should reach waiting state (or initializing)
    await expect(page.getByRole('status')).toBeVisible({ timeout: 15_000 })
  })

  test('upload tab renders a file picker control', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('tab', { name: /upload/i }).click()

    // QrUpload renders a file input (covered by a button/label)
    const fileInputCount = await page.locator('input[type="file"]').count()
    expect(fileInputCount).toBeGreaterThan(0)
  })
})
