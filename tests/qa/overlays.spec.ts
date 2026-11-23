import { test, expect } from '@playwright/test'

// The cookie banner and the "before you go" offer share the bottom corner. They must never be on
// screen together: the offer waits until a cookie choice has been made.
test.use({
  storageState: { cookies: [], origins: [] },
  viewport: { width: 375, height: 667 },
  hasTouch: true,
  isMobile: true,
})

test('mobile: cookie banner and exit offer never show together', async ({ page }) => {
  await page.goto('/blog/utm-naming-convention-for-teams', { waitUntil: 'load' })
  const banner = page.getByRole('region', { name: 'Analytics choice' })
  const offer = page.getByRole('dialog', { name: 'Before you go' })
  const nudge = () =>
    // Up, wait a frame, then down: scrolling there and back in one tick fires no scroll event.
    page.evaluate(async () => {
      window.scrollTo(0, 0)
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
      window.scrollTo(0, document.documentElement.scrollHeight)
    })

  // First input makes the banner appear; retry in case the page had not hydrated yet.
  await expect(async () => {
    await page.mouse.wheel(0, 40)
    await expect(banner).toBeVisible({ timeout: 1000 })
  }).toPass({ timeout: 20_000 })

  // The offer arms 4 s after hydration. Keep scrolling to the bottom for 8 s so it is armed for
  // part of this loop, and check it never appears while the choice is pending.
  for (let i = 0; i < 16; i++) {
    await nudge()
    await page.waitForTimeout(500)
    await expect(offer).toHaveCount(0)
  }
  await expect(banner).toBeVisible()

  await banner.getByRole('button', { name: 'Reject' }).click()
  await expect(banner).toHaveCount(0)
  // Decided: the offer may now appear on the next deep scroll.
  await expect(async () => {
    await nudge()
    await expect(offer).toBeVisible({ timeout: 500 })
  }).toPass({ timeout: 10_000 })

  // Reopening the banner from the footer closes the offer instead of stacking on it.
  await page
    .getByRole('button', { name: 'Cookie settings' })
    .evaluate((b) => (b as HTMLElement).click())
  await expect(banner).toBeVisible()
  await expect(offer).toHaveCount(0)
})
