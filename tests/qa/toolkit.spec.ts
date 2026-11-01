import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { readFileSync } from 'node:fs'

/**
 * End-to-end checks for the UTM toolkit: the flows people actually use, run in
 * a real browser. The pure logic has unit tests (tests/unit/lab.test.mjs); this
 * file guards what only a browser can break: the form, saved state, downloads,
 * the backup round trip and what usage tracking sends.
 *
 * Run against a production build: `pnpm qa:toolkit` (see playwright.qa.config.ts).
 */

test.use({ permissions: ['clipboard-read', 'clipboard-write'] })

// Skip the OS save dialog so downloads arrive as ordinary files in tests.
const plainDownloads = (page: Page) =>
  page.addInitScript(() => {
    delete (window as unknown as Record<string, unknown>).showSaveFilePicker
  })

const campaign = (page: Page) => page.getByLabel('Campaign name', { exact: true })
const moreTools = (page: Page) => page.locator('summary', { hasText: 'More tools' })

async function buildOne(page: Page, name = 'spring-sale') {
  await page.goto('/lab/utm-builder')
  await page.getByLabel('Landing page link').fill('https://example.com/lp')
  await page.getByRole('button', { name: 'Google Ads', exact: true }).click()
  await campaign(page).fill(name)
}

test.describe('UTM builder', () => {
  test('three steps build a clean link, show its GA4 channel and save it', async ({ page }) => {
    await buildOne(page, 'Spring Sale')
    const link = page.locator('[aria-label="Tagged links"] li').first()
    await expect(link).toContainText('utm_source=google&utm_medium=cpc&utm_campaign=spring-sale')
    await expect(link).toContainText('GA4 channel: Paid Search')
    await page.getByRole('button', { name: 'Save to list' }).click()
    await expect(page.locator('section[aria-label="Saved links"] li')).toHaveCount(1)
  })

  test('the sticky result card never overlaps the saved list when scrolling', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await buildOne(page, 'one')
    for (const name of ['one', 'two', 'three']) {
      await campaign(page).fill(name)
      await page.getByRole('button', { name: 'Save to list' }).click()
    }
    const list = page.locator('section[aria-label="Saved links"]')
    await list.scrollIntoViewIfNeeded()
    await page.evaluate(() =>
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' })
    )
    const card = page
      .locator('[aria-label="Tagged links"]')
      .locator('xpath=ancestor::div[contains(@class,"rounded-xl")][1]')
    const [c, l] = await Promise.all([card.boundingBox(), list.boundingBox()])
    expect(c && l).toBeTruthy()
    const overlap = !(c!.y + c!.height <= l!.y || l!.y + l!.height <= c!.y)
    expect(overlap).toBe(false)
  })

  test('secondary tools start closed under one "More tools" section', async ({ page }) => {
    await page.goto('/lab/utm-builder')
    await expect(page.getByText('Working in a team? Set naming rules')).toBeHidden()
    await moreTools(page).click()
    await expect(page.getByText('Working in a team? Set naming rules')).toBeVisible()
    await expect(page.getByText('Test your links before you launch')).toBeVisible()
  })

  test('team rules with a pattern flag a name that does not fit', async ({ page }) => {
    await page.goto('/lab/utm-builder')
    await moreTools(page).click()
    await page.locator('summary', { hasText: 'Working in a team' }).click()
    await page
      .locator('#utm-rule-channels')
      .fill('Google Ads, google, cpc\nNewsletter, newsletter, email')
    await page.getByLabel('Campaign name pattern (optional)').fill('{name}-{yyyy}-{mm}')
    await page.getByRole('button', { name: 'Turn on rules' }).click()
    await expect(page.getByRole('button', { name: 'Bing Ads', exact: true })).toHaveCount(0)
    await page.getByLabel('Landing page link').fill('https://example.com/lp')
    await page.getByRole('button', { name: 'Google Ads', exact: true }).click()
    await campaign(page).fill('spring-sale')
    await expect(page.getByText('does not follow your team pattern')).toBeVisible()
    await page.getByRole('button', { name: '+ Add this month' }).click()
    await expect(page.getByText('does not follow your team pattern')).toHaveCount(0)
  })

  test('ad versions make one link per page, channel and version', async ({ page }) => {
    await buildOne(page, 'spring')
    await page.getByRole('button', { name: 'Newsletter', exact: true }).click()
    await page.locator('summary', { hasText: 'More options' }).click()
    await page
      .getByLabel('Or test several ad versions at once')
      .fill('Blue Button, green-button, red')
    await expect(page.locator('[aria-label="Tagged links"] li')).toHaveCount(6)
    await expect(page.locator('[aria-label="Tagged links"] li').first()).toContainText(
      'utm_content=blue-button'
    )
  })

  test('a backup restores saved links after browser storage is cleared', async ({ page }) => {
    await plainDownloads(page)
    await buildOne(page)
    await page.getByRole('button', { name: 'Save to list' }).click()
    await moreTools(page).click()
    await page.locator('summary', { hasText: 'Back up or move your workspace' }).click()
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Download backup' }).click(),
    ])
    const file = await download.path()
    expect(JSON.parse(readFileSync(file, 'utf8')).sheet).toHaveLength(1)

    await page.evaluate(() => localStorage.clear())
    await page.reload()
    await expect(page.locator('section[aria-label="Saved links"]')).toHaveCount(0)
    await moreTools(page).click()
    await page.locator('summary', { hasText: 'Back up or move your workspace' }).click()
    await page.locator('input[type=file][accept*=json]').setInputFiles(file)
    await expect(page.getByText('Restored: 1 new link')).toBeVisible()
    await expect(page.locator('section[aria-label="Saved links"] li')).toHaveCount(1)
  })

  test('the campaign pack has a QR code, the channel and a launch checklist', async ({ page }) => {
    await plainDownloads(page)
    await buildOne(page)
    await page.getByRole('button', { name: 'Save to list' }).click()
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Download campaign pack' }).click(),
    ])
    const html = readFileSync((await download.path())!, 'utf8')
    expect(html).toContain('<svg')
    expect(html).toContain('Paid Search')
    expect(html).toContain('Before you launch')
  })

  test('usage events carry the tool and action, never what was typed', async ({ page }) => {
    await buildOne(page, 'very-private-name')
    await page.getByRole('button', { name: 'Save to list' }).click()
    const events = await page.evaluate(() =>
      ((window as unknown as { dataLayer?: { event?: string }[] }).dataLayer ?? []).filter(
        (e) => e?.event === 'lab_tool_action'
      )
    )
    expect(events.length).toBeGreaterThan(0)
    const blob = JSON.stringify(events)
    expect(blob).toContain('save_to_list')
    expect(blob).not.toMatch(/very-private-name|example\.com|google/i)
  })
})

test.describe('QR generator', () => {
  test('shows the exact text encoded for a website, WhatsApp and a UPI payment', async ({
    page,
  }) => {
    await page.goto('/lab/qr-code-generator')
    await page.getByLabel('Website link').fill('example.com/hello')
    await expect(page.locator('p.break-all').first()).toHaveText('https://example.com/hello')

    await page.getByRole('button', { name: 'WhatsApp', exact: true }).click()
    await page.getByLabel('WhatsApp number with country code').fill('+91 98765 43210')
    await page.getByLabel('Message ready to send (optional)').fill('Hello there')
    await expect(page.locator('p.break-all').first()).toHaveText(
      'https://wa.me/919876543210?text=Hello%20there'
    )

    await page.getByRole('button', { name: 'UPI payment', exact: true }).click()
    await page.getByLabel('UPI ID').fill('shop@okhdfcbank')
    await page.getByLabel('Payee name').fill('Acme Studio')
    await page.getByLabel('Amount in rupees (optional)').fill('250')
    await expect(page.locator('p.break-all').first()).toHaveText(
      'upi://pay?pa=shop@okhdfcbank&pn=Acme%20Studio&am=250.00&cu=INR'
    )
    await expect(page.locator('[role=img][aria-label="QR code"] svg path')).toBeVisible()
  })

  test('a Wi-Fi password is never printed as text under the code', async ({ page }) => {
    await page.goto('/lab/qr-code-generator')
    await page.getByRole('button', { name: 'Wi-Fi', exact: true }).click()
    await page.getByLabel('Network name').fill('Cafe Net')
    await page.getByLabel('Password').fill('guest-pass-123')
    await expect(page.locator('[role=img][aria-label="QR code"]')).toBeVisible()
    await expect(page.getByText('guest-pass-123')).toHaveCount(0)
  })
})

test.describe('link checker and report cleaner', () => {
  test('the checker flags problems and hands links to the builder', async ({ page }) => {
    await page.goto('/lab/utm-link-checker')
    await page.getByRole('button', { name: 'Not sure? Try an example' }).click()
    await expect(page.locator('li[aria-label="Link 1"]')).toContainText('capital letters')
    await expect(page.locator('li[aria-label="Link 2"]')).toContainText('No problems found')
    await page.getByRole('button', { name: /Add these 2 links to my saved/ }).click()
    await expect(page.getByText('Added 2 to your saved list')).toBeVisible()
    await page.goto('/lab/utm-builder')
    await expect(page.locator('section[aria-label="Saved links"] li')).toHaveCount(2)
  })

  test('the cleaner merges split rows and remembers the merges next time', async ({ page }) => {
    await page.goto('/lab/utm-report-cleaner')
    await page.getByRole('button', { name: 'Not sure? Try an example' }).click()
    await expect(page.locator('ul[aria-label="Merged groups"] > li').first()).toContainText(
      '1,602 sessions'
    )
    await page.getByRole('button', { name: 'Remember these merges' }).click()
    await page.reload()
    await page.getByRole('button', { name: 'Not sure? Try an example' }).click()
    await expect(page.getByText(/merged\s+using what you saved/)).toBeVisible()
  })
})

for (const route of [
  '/lab/utm-builder',
  '/lab/utm-link-checker',
  '/lab/utm-report-cleaner',
  '/lab/qr-code-generator',
]) {
  for (const scheme of ['light', 'dark'] as const) {
    test(`no automatically-detectable a11y violations on ${route} (${scheme})`, async ({
      page,
    }) => {
      test.setTimeout(60_000)
      await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: scheme })
      await page.goto(route)
      if (route.endsWith('utm-builder')) {
        await moreTools(page).click()
        await page.locator('summary', { hasText: 'Working in a team' }).click()
      }
      const results = await new AxeBuilder({ page }).analyze()
      expect(results.violations.map((v) => `${v.id}: ${v.nodes[0]?.target}`)).toEqual([])
    })
  }
}
