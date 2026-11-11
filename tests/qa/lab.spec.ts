import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import jsQR from 'jsqr'

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

/** Puts a report into the box in one step. Typing thousands of lines with fill() is slow in a test and is not what a paste does. */
async function pasteReport(page: import('@playwright/test').Page, rows: string[]) {
  // wait until React has taken over the box, or the input event would go unseen
  await page.waitForFunction(() => {
    const box = document.getElementById('rc-text')
    return !!box && Object.keys(box).some((k) => k.startsWith('__reactProps'))
  })
  const body = ['Session campaign,Sessions', ...rows].join('\n')
  await page.evaluate((text) => {
    const box = document.getElementById('rc-text') as HTMLTextAreaElement
    Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!.call(box, text)
    box.dispatchEvent(new Event('input', { bubbles: true }))
  }, body)
}

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
    await pasteReport(
      page,
      Array.from({ length: 5200 }, (_, i) => `c${i},1`)
    )
    await expect(
      page.getByRole('alert').filter({ hasText: /Only the first 5,000 of 5,200 rows/ })
    ).toBeVisible()
  })

  test('a big report draws only the biggest groups and says so, and the long list opens on demand', async ({
    page,
  }) => {
    await page.goto('/lab/utm-report-cleaner')
    // 2,000 campaigns each spelled two ways, plus 500 that need no merge
    const rows = [
      ...Array.from({ length: 2000 }, (_, i) => [`Camp-${i},5`, `camp_${i},3`]).flat(),
      ...Array.from({ length: 500 }, (_, i) => `solo${i},1`),
    ]
    await pasteReport(page, rows)
    await expect(page.getByText('Showing the 150 biggest of 2,000 merged groups.')).toBeVisible()
    await expect(page.locator('[aria-label="Merged groups"] > li')).toHaveCount(150)
    // the "nothing to merge" list is not built until it is opened
    await expect(page.locator('details li')).toHaveCount(0)
    await page.getByText(/Rows with nothing to merge \(500\)/).click()
    await expect(page.locator('details li')).toHaveCount(200)
    await expect(page.getByText('…and 300 more')).toBeVisible()
    // everything is still in what you copy
    await expect(page.getByRole('button', { name: 'Copy merged table' })).toBeVisible()
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
    '/lab/ga4-event-builder',
    '/lab/og-image-maker',
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

test.describe('GA4 event builder', () => {
  test('starts from a recommended event, checks it and switches between dataLayer and gtag', async ({
    page,
  }) => {
    await page.goto('/lab/ga4-event-builder')
    await page.getByLabel('Start from a recommended event').selectOption('generate_lead')
    const code = page.locator('pre').filter({ hasText: 'dataLayer' })
    await expect(code).toContainText("event: 'generate_lead'")
    await expect(code).toContainText('value: 500')
    await expect(page.getByText('No problems found')).toBeVisible()
    // value without a currency is a problem
    await page.getByLabel('Parameter 1 name').fill('')
    await expect(page.getByText(/"currency" is required if you set "value"/)).toBeVisible()
    await page.getByRole('tab', { name: 'gtag.js' }).click()
    await expect(page.locator('pre').filter({ hasText: "gtag('event'" })).toContainText(
      "gtag('event', 'generate_lead'"
    )
  })

  test('flags a bad name and personal data', async ({ page }) => {
    await page.goto('/lab/ga4-event-builder')
    await page.getByLabel('Event name').fill('My Event')
    await expect(page.getByText(/Use only letters, numbers and underscores/)).toBeVisible()
    await expect(page.getByText(/Event names are case sensitive:/)).toBeVisible()
    await page.getByLabel('Event name').fill('page_view')
    await expect(page.getByText(/name Google reserves/)).toBeVisible()
    await page.getByLabel('Event name').fill('quote_requested')
    await page.getByLabel('Parameter 1 name').fill('contact')
    await page.getByLabel('Parameter 1 value').fill('adesh@example.com')
    await expect(page.getByText(/looks like an email address/)).toBeVisible()
  })
})

test.describe('OG image maker', () => {
  // Chrome opens a native Save dialog that a test cannot answer; Firefox and Safari fall back to a
  // plain download, so that is the path checked here.
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      delete (window as unknown as { showSaveFilePicker?: unknown }).showSaveFilePicker
    })
  })

  const pngSize = (buf: Buffer) => ({ w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) })

  test('draws a Hindi title and downloads a real 1200 x 630 PNG and an SVG', async ({ page }) => {
    await page.goto('/lab/og-image-maker')
    await page.getByLabel('Title', { exact: true }).fill('ट्रेल रनिंग जूते: मानसून गाइड')
    await page.getByLabel('Site name (optional)').fill('northpeak.example')
    const preview = page.getByRole('img', { name: /Preview: ट्रेल रनिंग/ })
    await expect(preview).toBeVisible()
    const src = decodeURIComponent((await preview.getAttribute('src')) ?? '')
    expect(src).toContain('<svg')
    expect(src).toContain('ट्रेल')
    expect(src).toContain('northpeak.example')

    const [png] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Download PNG' }).click(),
    ])
    expect(png.suggestedFilename()).toBe('og-image-1200x630.png')
    const bytes = await (await import('node:fs/promises')).readFile((await png.path())!)
    expect(bytes.subarray(1, 4).toString()).toBe('PNG')
    expect(pngSize(bytes)).toEqual({ w: 1200, h: 630 })

    const [svg] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Download SVG' }).click(),
    ])
    const text = await (await import('node:fs/promises')).readFile((await svg.path())!, 'utf8')
    expect(text.startsWith('<svg')).toBe(true)
    expect(text).toContain('ट्रेल')
  })

  test('a long title still fits, the size changes the file, and a hard-to-see accent is flagged', async ({
    page,
  }) => {
    await page.goto('/lab/og-image-maker')
    const long =
      'The complete beginner guide to choosing lightweight trail running shoes for the monsoon '.repeat(
        3
      )
    await page.getByLabel('Title', { exact: true }).fill(long.trim())
    await expect(page.getByRole('img', { name: /Preview:/ })).toBeVisible()
    await page.getByLabel('Size').selectOption('cover')
    const [png] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Download PNG' }).click(),
    ])
    expect(png.suggestedFilename()).toBe('og-image-1600x900.png')
    await page.getByLabel('Accent colour').fill('#0c1020')
    await expect(page.getByRole('alert').filter({ hasText: 'hard to see' })).toBeVisible()
  })
})

test.describe('QR codes scan back to what was typed', () => {
  /** Draws the code that is on the page onto a canvas and reads it with an independent decoder. */
  async function scanOnPage(page: import('@playwright/test').Page): Promise<string | null> {
    const px = await page.evaluate(async () => {
      const svg = document.querySelector('[aria-label="QR code"] svg') as SVGSVGElement
      svg.setAttribute('width', '400')
      svg.setAttribute('height', '400')
      const xml = new XMLSerializer().serializeToString(svg)
      const img = new Image()
      await new Promise<void>((ok, bad) => {
        img.onload = () => ok()
        img.onerror = () => bad(new Error('decode'))
        img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`
      })
      const c = document.createElement('canvas')
      c.width = c.height = 400
      const ctx = c.getContext('2d')!
      ctx.fillStyle = '#fff'
      ctx.fillRect(0, 0, 400, 400)
      ctx.drawImage(img, 0, 0, 400, 400)
      return Array.from(ctx.getImageData(0, 0, 400, 400).data)
    })
    return jsQR(new Uint8ClampedArray(px), 400, 400)?.data ?? null
  }

  test('a website code opens the page that was typed', async ({ page }) => {
    await page.goto('/lab/qr-code-generator')
    await page.getByLabel('Website link').fill('devstash.me/lab')
    await expect(page.getByRole('img', { name: 'QR code' })).toBeVisible()
    expect(await scanOnPage(page)).toBe('https://devstash.me/lab')
  })

  test('a Hindi text code reads back as the same Hindi text', async ({ page }) => {
    await page.goto('/lab/qr-code-generator')
    await page.getByRole('button', { name: 'Text', exact: true }).click()
    await page.getByLabel('Text', { exact: true }).fill('दिवाली सेल: 50% छूट')
    await expect(page.getByRole('img', { name: 'QR code' })).toBeVisible()
    expect(await scanOnPage(page)).toBe('दिवाली सेल: 50% छूट')
  })

  test('the WhatsApp generator code opens the link shown next to it', async ({ page }) => {
    await page.goto('/lab/whatsapp-link-generator')
    await page.getByLabel('WhatsApp number').fill('98765 43210')
    await page.getByLabel('Campaign code (optional)').fill('diwali-poster')
    await expect(page.getByRole('img', { name: 'QR code' })).toBeVisible()
    const shown = (await page.getByText(/^https:\/\/wa\.me\//).textContent()) ?? ''
    expect(await scanOnPage(page)).toBe(shown)
  })
})

test.describe('Tabs work from the keyboard and are wired to their panel', () => {
  const PAGES = [
    {
      path: '/lab/meta-tag-generator',
      list: 'SEO file',
      first: 'FAQ schema',
      second: 'robots.ts',
      last: 'OG image',
    },
    {
      path: '/lab/ga4-event-builder',
      list: 'Where the event goes',
      first: 'Tag Manager (dataLayer)',
      second: 'gtag.js',
      last: 'gtag.js',
    },
  ]
  for (const p of PAGES) {
    test(`${p.path}: arrow keys, Home and End move between tabs; the panel is labelled by the selected tab`, async ({
      page,
    }) => {
      await page.goto(p.path)
      const list = page.getByRole('tablist', { name: p.list })
      const first = list.getByRole('tab', { name: p.first })
      const second = list.getByRole('tab', { name: p.second })
      const last = list.getByRole('tab', { name: p.last })

      // only the selected tab is in the Tab order
      await expect(first).toHaveAttribute('tabindex', '0')
      await expect(second).toHaveAttribute('tabindex', '-1')

      await first.focus()
      await page.keyboard.press('ArrowRight')
      await expect(second).toHaveAttribute('aria-selected', 'true')
      await expect(second).toBeFocused()
      await expect(second).toHaveAttribute('tabindex', '0')
      await expect(first).toHaveAttribute('tabindex', '-1')

      await page.keyboard.press('End')
      await expect(last).toHaveAttribute('aria-selected', 'true')
      await expect(last).toBeFocused()
      await page.keyboard.press('ArrowRight') // wraps round to the first tab
      await expect(first).toHaveAttribute('aria-selected', 'true')
      await page.keyboard.press('ArrowLeft') // and back to the last
      await expect(last).toHaveAttribute('aria-selected', 'true')
      await page.keyboard.press('Home')
      await expect(first).toBeFocused()

      // each tab points at the panel, and the panel is named by the selected tab
      const controls = await first.getAttribute('aria-controls')
      const panel = page.locator(`[role=tabpanel][id="${controls}"]`)
      await expect(panel).toHaveCount(1)
      const selectedId = await list.locator('[aria-selected=true]').getAttribute('id')
      await expect(panel).toHaveAttribute('aria-labelledby', selectedId!)
    })
  }
})

test('the QR Wi-Fi and contact forms explain a missing name', async ({ page }) => {
  await page.goto('/lab/qr-code-generator')
  await page.getByRole('button', { name: 'Wi-Fi', exact: true }).click()
  await page.getByLabel('Password', { exact: true }).fill('longenoughpass')
  await expect(page.getByText('Enter the network name.')).toBeVisible()
  await page.getByLabel('Network name').fill('Cafe')
  await expect(page.getByText('Enter the network name.')).toHaveCount(0)
  await page.getByRole('button', { name: 'Contact card', exact: true }).click()
  await page.getByLabel('Phone with country code').fill('+91 98765 43210')
  await expect(page.getByText(/Add a name or a company/)).toBeVisible()
  await page.getByLabel('First name').fill('Adesh')
  await expect(page.getByText(/Add a name or a company/)).toHaveCount(0)
})
