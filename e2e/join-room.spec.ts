import { test, expect } from '@playwright/test'

async function openJoin(page: import('@playwright/test').Page) {
  await page.goto('/')
  await page.getByRole('radio', { name: /join a room/i }).click()
}

test.describe('Join room flow', () => {
  test('join panel shows the three method options', async ({ page }) => {
    await openJoin(page)
    const group = page.getByRole('radiogroup', { name: 'Join method' })
    await expect(group.getByRole('radio', { name: /scan/i })).toBeVisible()
    await expect(group.getByRole('radio', { name: /upload/i })).toBeVisible()
    await expect(group.getByRole('radio', { name: /paste/i })).toBeVisible()
  })

  test('paste method has input field and disabled join button', async ({ page }) => {
    await openJoin(page)
    await page.getByRole('radio', { name: /paste/i }).click()

    await expect(page.getByLabel(/room link or ID/i)).toBeVisible()
    const joinButton = page.getByRole('button', { name: /^join room$/i })
    await expect(joinButton).toBeVisible()
    await expect(joinButton).toBeDisabled()
  })

  test('pasting a valid room ID navigates to the room as joiner', async ({ page }) => {
    await openJoin(page)
    await page.getByRole('radio', { name: /paste/i }).click()
    await page.getByLabel(/room link or ID/i).fill('test-room-1234')
    await page.getByRole('button', { name: /^join room$/i }).click()
    await expect(page).toHaveURL(/\/room\/test-room-1234\?role=joiner/)
  })

  test('pasting an invalid value shows an error', async ({ page }) => {
    await openJoin(page)
    await page.getByRole('radio', { name: /paste/i }).click()
    await page.getByLabel(/room link or ID/i).fill('!!')
    await page.getByRole('button', { name: /^join room$/i }).click()
    await expect(page.getByRole('alert')).toContainText(/valid room link/i)
  })

  test('navigating directly to /room/:id?role=joiner loads room page', async ({ page }) => {
    await page.goto('/room/direct-join-abc?role=joiner')
    await expect(page.getByRole('status')).toBeVisible({ timeout: 15_000 })
  })

  test('upload method renders a file picker control', async ({ page }) => {
    await openJoin(page)
    await page.getByRole('radio', { name: /upload/i }).click()
    expect(await page.locator('input[type="file"]').count()).toBeGreaterThan(0)
  })
})
