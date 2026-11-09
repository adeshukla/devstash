import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

/**
 * Lab hub and the smaller tools: what only a browser can break. Pure logic has
 * unit tests; the UTM toolkit flows are in toolkit.spec.ts.
 */

test.use({ permissions: ['clipboard-read', 'clipboard-write'] })

test.describe('Lab hub', () => {
  test('leads with jobs to do, and every card shows a real result', async ({ page }) => {
    await page.goto('/lab')
    await expect(page.getByRole('heading', { name: 'What do you need to do?' })).toBeVisible()
    await expect(page.getByRole('link', { name: /Tag links for a campaign/ })).toHaveAttribute(
      'href',
      '/lab/utm-builder'
    )
    // The UTM card's sample result is produced by the builder's own code.
    await expect(page.getByText('utm_campaign=spring-sale').first()).toBeVisible()
    expect(await page.getByText(/Real output ·/).count()).toBeGreaterThanOrEqual(6)
  })

  test('an odd last card spans the row instead of sitting alone', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto('/lab')
    const cards = page.locator('section', { hasText: 'More tools' }).locator('article')
    const count = await cards.count()
    expect(count % 2).toBe(1)
    const first = await cards.first().boundingBox()
    const last = await cards.last().boundingBox()
    expect(last!.width).toBeGreaterThan(first!.width * 1.8)
  })

  test('copy link puts the full tool address on the clipboard', async ({ page }) => {
    await page.goto('/lab')
    await page.getByRole('button', { name: 'Copy link' }).first().click()
    const text = await page.evaluate(() => navigator.clipboard.readText())
    expect(text).toMatch(/^https?:\/\/[^/]+\/lab\/utm-builder$/)
  })

  test('has no automatically-detectable a11y violations in light and dark', async ({ page }) => {
    test.setTimeout(60_000)
    for (const scheme of ['light', 'dark'] as const) {
      await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: scheme })
      await page.goto('/lab')
      const results = await new AxeBuilder({ page }).analyze()
      expect(results.violations.map((v) => `${v.id}: ${v.nodes[0]?.target}`)).toEqual([])
    }
  })
})

test.describe('Meta tag generator', () => {
  test('checks pasted head tags and lists what is wrong', async ({ page }) => {
    await page.goto('/lab/meta-tag-generator')
    await page.getByRole('button', { name: 'Not sure? Try an example' }).click()
    await expect(page.getByText(/Problem: There is no viewport/)).toBeVisible()
    await expect(page.getByText(/Tip: There is no canonical link/)).toBeVisible()
    await expect(page.getByText(/og:image must be a full/)).toBeVisible()
  })

  test('the SEO kit writes FAQ schema and a robots file', async ({ page }) => {
    await page.goto('/lab/meta-tag-generator')
    await page.getByRole('button', { name: 'Try an example', exact: true }).click()
    await expect(page.getByText('2 questions read')).toBeVisible()
    await expect(page.getByText(/"@type": "FAQPage"/)).toBeVisible()
    await page.getByRole('tab', { name: 'robots.ts' }).click()
    await page.getByLabel('Your site address').fill('example.com')
    await expect(page.getByText(/https:\/\/example\.com\/sitemap\.xml/)).toBeVisible()
  })

  test('the SEO kit refuses to guess: sitemap needs a site address, pasted URLs are not doubled', async ({
    page,
  }) => {
    await page.goto('/lab/meta-tag-generator')
    await page.getByRole('tab', { name: 'sitemap.ts' }).click()
    await expect(page.getByText(/Add your site address first/)).toBeVisible()
    await page.getByLabel('Your site address').fill('https://x.com')
    await page.getByLabel('Your page paths').fill('https://x.com/a?utm=1\n/b')
    await expect(page.getByText('{ url: "https://x.com/a" }')).toBeVisible()
    await expect(page.getByText(/x\.com\/https/)).toHaveCount(0)
  })
})

test.describe('Saved looks and backup reminder', () => {
  test('a saved look stays after a reload and can be removed', async ({ page }) => {
    await page.goto('/lab/css-shapes-playground')
    await page.getByLabel('Name this look').fill('Hero blob')
    await page.getByRole('button', { name: 'Save', exact: true }).click()
    const list = page.getByRole('list', { name: 'Saved looks' })
    await expect(list.getByRole('link', { name: 'Hero blob' })).toBeVisible()
    await page.reload()
    await expect(list.getByRole('link', { name: 'Hero blob' })).toBeVisible()
    await page.getByRole('button', { name: 'Remove Hero blob' }).click()
    await expect(list).toHaveCount(0)
  })

  test('the builder reminds you to back up once five links are saved', async ({ page }) => {
    await page.goto('/lab/utm-builder')
    await page.getByLabel('Landing page link').fill('https://example.com/lp')
    await page.getByRole('button', { name: 'Google Ads', exact: true }).click()
    for (const name of ['a', 'b', 'c', 'd']) {
      await page.getByLabel('Campaign name', { exact: true }).fill(name)
      await page.getByRole('button', { name: 'Save to list' }).click()
    }
    await expect(page.getByText(/You have \d+ saved links/)).toHaveCount(0)
    await page.getByLabel('Campaign name', { exact: true }).fill('e')
    await page.getByRole('button', { name: 'Save to list' }).click()
    await expect(page.getByText(/You have 5 saved links/)).toBeVisible()
    await page.getByRole('button', { name: 'Not now' }).click()
    await expect(page.getByText(/You have 5 saved links/)).toHaveCount(0)
  })
})
