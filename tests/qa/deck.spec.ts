import { test, expect } from '@playwright/test'

// Phone bug: pressing Back/Next/Flip counted as "tap the section", which fanned
// the stack out and re-laid it out while a card was mid-slide. A synthetic touch
// pointerdown is used because Playwright's tap() scrolls the page, which re-arms
// the arrival fan and hides the bug.
test('touching a deck button does not fan the stack out', async ({ page }) => {
  await page.goto('/')
  const deck = page.getByRole('region', { name: 'Featured projects' })
  await page.waitForTimeout(8000) // let the arrival fan finish
  await expect(deck).not.toHaveAttribute('data-greeting')
  for (const label of ['Back', 'Flip', 'Next']) {
    await page.evaluate((l) => {
      const b = [...document.querySelectorAll('.deck-stage button')].find((x) =>
        x.textContent?.includes(l)
      )!
      b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'touch' }))
    }, label)
    await page.waitForTimeout(300)
    await expect(deck).not.toHaveAttribute('data-greeting')
  }
})
