import { test, expect, type Page } from '@playwright/test'

/**
 * Room controls auto-hide after 4s of inactivity, so we wiggle the pointer
 * to keep the toolbar visible while asserting.
 */
async function keepControlsVisible(page: Page) {
  await page.mouse.move(100, 100)
  await page.mouse.move(200, 200)
}

test.describe('Room controls', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/room/controls-test?role=creator')
    // Wait for the call controls toolbar
    await page.getByRole('toolbar', { name: /call controls/i }).waitFor({
      timeout: 15_000,
    })
  })

  test('toolbar shows mic, camera, fullscreen, and end-call buttons', async ({
    page,
  }) => {
    await keepControlsVisible(page)
    const toolbar = page.getByRole('toolbar', { name: /call controls/i })
    await expect(toolbar).toBeVisible()

    await expect(
      page.getByRole('button', { name: /mute microphone|unmute microphone/i })
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: /turn off camera|turn on camera/i })
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: /enter fullscreen|exit fullscreen/i })
    ).toBeVisible()
    await expect(page.getByRole('button', { name: /end call/i })).toBeVisible()
  })

  test('mic toggle flips aria-pressed state', async ({ page }) => {
    await keepControlsVisible(page)
    const micBtn = page.getByRole('button', {
      name: /mute microphone|unmute microphone/i,
    })

    const before = await micBtn.getAttribute('aria-pressed')
    await micBtn.click()
    await keepControlsVisible(page)

    await expect
      .poll(async () =>
        page
          .getByRole('button', { name: /mute microphone|unmute microphone/i })
          .getAttribute('aria-pressed')
      )
      .not.toBe(before)
  })

  test('camera toggle flips aria-pressed state', async ({ page }) => {
    await keepControlsVisible(page)
    const camBtn = page.getByRole('button', {
      name: /turn off camera|turn on camera/i,
    })

    const before = await camBtn.getAttribute('aria-pressed')
    await camBtn.click()
    await keepControlsVisible(page)

    await expect
      .poll(async () =>
        page
          .getByRole('button', { name: /turn off camera|turn on camera/i })
          .getAttribute('aria-pressed')
      )
      .not.toBe(before)
  })

  test('end call navigates back to home', async ({ page }) => {
    await keepControlsVisible(page)
    await page.getByRole('button', { name: /end call/i }).click()

    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      /gf.?vid.?chat/i
    )
  })
})
