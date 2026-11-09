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
    const first = await cards.first().boundingBox()
    const last = await cards.last().boundingBox()
    if (count % 2 === 1) expect(last!.width).toBeGreaterThan(first!.width * 1.8)
    else expect(last!.width).toBeLessThan(first!.width * 1.2)
  })

  test('the toolkit is three tools; the QR generator sits under More tools with no toolkit nav', async ({
    page,
  }) => {
    await page.goto('/lab')
    await expect(page.getByText(/Three tools that work as one/)).toBeVisible()
    const more = page.locator('section', { hasText: 'More tools' })
    await expect(more.getByRole('heading', { name: 'QR Code Generator' })).toBeVisible()
    const toolkit = page.locator('section', { hasText: 'The UTM toolkit' })
    await expect(toolkit.getByRole('heading', { name: 'QR Code Generator' })).toHaveCount(0)

    await page.goto('/lab/utm-builder')
    const nav = page.getByRole('navigation', { name: 'UTM toolkit' })
    await expect(nav.getByRole('link')).toHaveCount(3)
    await expect(nav.getByRole('link', { name: 'QR codes' })).toHaveCount(0)

    await page.goto('/lab/qr-code-generator')
    await expect(page.getByRole('navigation', { name: 'UTM toolkit' })).toHaveCount(0)
  })

  test('the WhatsApp link generator has a card, a job shortcut and a real example link', async ({
    page,
  }) => {
    await page.goto('/lab')
    await expect(
      page.getByRole('link', { name: /Get customers to message me on WhatsApp/ })
    ).toHaveAttribute('href', '/lab/whatsapp-link-generator')
    await expect(
      page.getByText(
        'https://wa.me/919876543210?text=Hi%2C%20please%20share%20your%20price%20list.%20%5Bref%3A%20diwali-poster%5D'
      )
    ).toBeVisible()
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
    // the head-tag check comes first on the page; the AI crawler check has its own example button
    await page.getByRole('button', { name: 'Not sure? Try an example' }).first().click()
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

test.describe('Stress-test fixes', () => {
  test('the builder completes a bare domain and keeps a Hindi campaign name', async ({ page }) => {
    await page.goto('/lab/utm-builder')
    await page.getByLabel('Landing page link').fill('example.com/pricing')
    await page.getByRole('button', { name: 'Google Ads', exact: true }).click()
    await page.getByLabel('Campaign name', { exact: true }).fill('दिवाली सेल')
    await expect(
      page.getByText(/^https:\/\/example\.com\/pricing\?utm_source=google/)
    ).toBeVisible()
    await expect(page.getByText(/looks incomplete/)).toHaveCount(0)
    const link = await page
      .getByText(/^https:\/\/example\.com\/pricing\?utm_source=google/)
      .textContent()
    expect(new URL(link ?? '').searchParams.get('utm_campaign')).toBe('दिवाली-सेल')
  })

  test('the report cleaner keeps different Hindi campaigns apart and adds up European numbers', async ({
    page,
  }) => {
    await page.goto('/lab/utm-report-cleaner')
    const box = page.getByLabel('Paste your report')
    await box.fill('Session campaign,Sessions\nदिवाली-सेल,10\nदिवाली_सेल,5\nहोली-ऑफर,7')
    await expect(page.getByText('1 thing is split into 2 spellings.')).toBeVisible()
    await box.fill('Session campaign;Sessions\nSpring-Sale;1.200\nspring_sale;300')
    await expect(page.getByText(/Total: 1,500 sessions/)).toBeVisible()
  })

  test('the report cleaner says when rows past the limit were not read', async ({ page }) => {
    await page.goto('/lab/utm-report-cleaner')
    const rows = Array.from({ length: 5200 }, (_, i) => `c${i},1`).join('\n')
    await page.getByLabel('Paste your report').fill(`Session campaign,Sessions\n${rows}`)
    await expect(
      page.getByRole('alert').filter({ hasText: /Only the first 5,000 of 5,200 rows/ })
    ).toBeVisible()
  })

  test('the QR generator will not make a WhatsApp code from a number with no country code', async ({
    page,
  }) => {
    await page.goto('/lab/qr-code-generator')
    await page.getByRole('button', { name: 'WhatsApp', exact: true }).click()
    const phone = page.getByLabel('WhatsApp number with country code')
    await phone.fill('98765 43210')
    await expect(page.getByText(/country code is missing/)).toBeVisible()
    await phone.fill('91 98765 43210')
    await expect(page.getByText(/country code is missing/)).toHaveCount(0)
    await expect(page.getByText('https://wa.me/919876543210')).toBeVisible()
  })
})

test.describe('Report cleaner on a GA4-shaped file', () => {
  test('uploads the sample export, leaves out the Grand total line and writes a Looker field that quotes the name', async ({
    page,
  }) => {
    await page.goto('/lab/utm-report-cleaner')
    await page.locator('input[type=file]').setInputFiles('tests/fixtures/ga4-source-medium.csv')
    await expect(page.getByText('5 things are split into 13 spellings.')).toBeVisible()
    await expect(page.getByText(/Left out 1 "Total" line/)).toBeVisible()
    await expect(page.getByText('Total: 4,693 sessions')).toBeVisible()
    await expect(page.getByText(/user counts cannot be added/)).toBeVisible()
    await expect(page.getByText('`Session source / medium`').first()).toBeAttached()
    await page.screenshot({ path: 'test-results/cleaner-ga4-sample.png', fullPage: true })
  })
})

test.describe('Every tool page has the same frame', () => {
  const PAGES = [
    '/lab/meta-tag-generator',
    '/lab/css-shapes-playground',
    '/lab/illustration-generator',
    '/lab/ai-content-pipeline',
    '/lab/whatsapp-link-generator',
  ]
  for (const path of PAGES) {
    test(`${path} has an FAQ, a "Free tool" footer and no accessibility violations`, async ({
      page,
    }) => {
      for (const scheme of ['light', 'dark'] as const) {
        await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: scheme })
        await page.goto(path)
        await expect(page.locator('main').getByText(/^Free tool by Adesh Shukla/)).toBeVisible()
        await expect(page.getByText(/\d+ questions/)).toBeVisible()
        const faq = await page.evaluate(() =>
          [...document.querySelectorAll('script[type="application/ld+json"]')].some((s) =>
            (s.textContent ?? '').includes('"FAQPage"')
          )
        )
        expect(faq, 'FAQPage JSON-LD is on the page').toBe(true)
        const results = await new AxeBuilder({ page }).analyze()
        expect(results.violations.map((v) => `${v.id}: ${v.nodes[0]?.target}`)).toEqual([])
      }
    })
  }

  test('the AI pipeline tour stays closed until asked for, and Done closes it', async ({
    page,
  }) => {
    await page.goto('/lab/ai-content-pipeline')
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Run the pipeline' })).toBeEnabled()
    await page.getByRole('button', { name: 'How it works' }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.getByRole('button', { name: 'Skip' }).click()
    await expect(page.getByRole('dialog')).toHaveCount(0)
  })
})

test.describe('WhatsApp link generator', () => {
  test('builds the link from a country and a number, adds the campaign code, and warns about a repeated code', async ({
    page,
  }) => {
    await page.goto('/lab/whatsapp-link-generator')
    await page.getByLabel('WhatsApp number').fill('98765 43210')
    await page.getByRole('button', { name: 'Price list' }).click()
    await page.getByLabel('Campaign code (optional)').fill('Diwali Poster')
    await expect(page.getByText(/^https:\/\/wa\.me\/919876543210\?text=/)).toBeVisible()
    await expect(page.getByText('+919876543210')).toBeVisible()
    await expect(
      page.getByText('Hi, please share your price list. [ref: diwali-poster]', { exact: true })
    ).toBeVisible()
    const link = await page.getByText(/^https:\/\/wa\.me\//).textContent()
    expect(decodeURIComponent(link ?? '')).toContain('[ref: diwali-poster]')
    await expect(page.getByRole('button', { name: 'Download PNG' })).toBeVisible()
    // a number that already starts with the country code is not given it twice
    await page.getByLabel('WhatsApp number').fill('91 98765 43210')
    await expect(page.getByText(/Removed the \+91 you typed/)).toBeVisible()
    await expect(page.getByText(/^https:\/\/wa\.me\/919876543210/)).toBeVisible()
    // too short a number is explained, not turned into a link
    await page.getByLabel('WhatsApp number').fill('123')
    await expect(page.getByText(/8 to 15 digits/)).toBeVisible()
    await expect(page.getByText(/^https:\/\/wa\.me\//)).toHaveCount(0)
  })

  test('copies the link and an HTML snippet', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.goto('/lab/whatsapp-link-generator')
    await page.getByLabel('Country').selectOption({ label: 'United Kingdom (+44)' })
    await page.getByLabel('WhatsApp number').fill('07911 123456')
    await page.getByRole('button', { name: 'Copy link' }).click()
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      'https://wa.me/447911123456'
    )
    await page.getByRole('button', { name: 'Copy as HTML link' }).click()
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      '<a href="https://wa.me/447911123456" target="_blank" rel="noopener noreferrer">Chat on WhatsApp</a>'
    )
  })
})

test.describe('AI crawler check and robots.ts opt-out', () => {
  test('shows which AI crawlers a pasted robots.txt blocks', async ({ page }) => {
    await page.goto('/lab/meta-tag-generator')
    const section = page.locator('section', { hasText: 'Which AI crawlers can read your site?' })
    await section.getByRole('button', { name: 'Not sure? Try an example' }).click()
    await expect(section.getByText('2 of 13 AI crawlers blocked')).toBeVisible()
    const row = (token: string) => section.locator('li', { hasText: token }).first()
    await expect(row('GPTBot')).toContainText('Blocked')
    await expect(row('ClaudeBot')).toContainText('Blocked')
    await expect(row('OAI-SearchBot')).toContainText('Allowed')
    await expect(row('Google-Extended')).toContainText('does not affect Google Search')
  })

  test('the robots.ts tab can opt out of AI training and leaves search crawlers alone', async ({
    page,
  }) => {
    await page.goto('/lab/meta-tag-generator')
    await page.getByRole('tab', { name: 'robots.ts' }).click()
    await page.getByLabel('Your site address').fill('example.com')
    await page.getByLabel(/Opt out of AI training/).check()
    const code = page.locator('pre').filter({ hasText: 'MetadataRoute.Robots' })
    await expect(code).toContainText('rules: [')
    await expect(code).toContainText('"GPTBot","ClaudeBot","Google-Extended"')
    await expect(code).not.toContainText('OAI-SearchBot')
  })
})
